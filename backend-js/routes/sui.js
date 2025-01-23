import express from "express";
const router = express.Router();
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { bech32 } from "bech32";
import { getFaucetHost, requestSuiFromFaucetV0 } from "@mysten/sui/faucet";
const __dirname = import.meta.dirname;

dotenv.config();
const SUI_DEPLOYER_PRIVATE_KEY = process.env.SUI_DEPLOYER_PRIVATE_KEY;
const SUI_CHAIN_URL = process.env.SUI_CHAIN_URL;
let SUI_PACKAGE_ID = process.env.SUI_PACKAGE_ID; // set in the deploy contract endpoint if not set in env var

function getDeployerKeypair() {
  const { words } = bech32.decode(SUI_DEPLOYER_PRIVATE_KEY);
  const numArray = bech32.fromWords(words);
  const secretKeyBytes = Buffer.from(numArray);
  //first byte is always 0 at least in my case
  const keypair = Ed25519Keypair.fromSecretKey(secretKeyBytes.slice(1));
  return keypair;
}

async function mintSui(recipientSuiAddr) {
  return requestSuiFromFaucetV0({
    host: getFaucetHost("devnet"),
    recipient: recipientSuiAddr,
  });
}

router.get("/", (req, res) => {
  res.status(200).send({ modules, dependencies });
});

router.get("/mintSui", async (req, res) => {
  res.status(200).send(await mintSui(getDeployerKeypair().toSuiAddress()));
});

router.get("/deployContract", async (req, res) => {
  const client = new SuiClient({
    url: SUI_CHAIN_URL,
  });

  const keypair = getDeployerKeypair();

  mintSui(keypair.toSuiAddress());

  const { modules, dependencies } = JSON.parse(
    execSync(
      `sui move build --dump-bytecode-as-base64 --path "${join(
        __dirname,
        "../../SuiToken"
      )}" --install-dir "${join(__dirname, "../../sui_install_dir")}"`,
      { encoding: "utf-8" }
    )
  );
  const tx = new Transaction();
  const [upgradeCap] = tx.publish({
    modules,
    dependencies,
  });

  tx.transferObjects([upgradeCap], keypair.toSuiAddress());
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
  });

  if (result.digest === undefined) {
    res.status(500).send({ result });
    return;
  }

  const txBlock = await client.getTransactionBlock({
    digest: await tx.getDigest(),
    options: {
      showEffects: true,
    },
  });

  SUI_PACKAGE_ID = txBlock.effects.created.find((o) => o.owner === "Immutable")
    .reference.objectId;
  console.log(`SUI_PKG_ID: ${SUI_PACKAGE_ID}`);
  res.status(200).send({ txBlock });
});

router.get("/mint/:recipientAddr/:amount", async (req, res) => {
  const { recipientAddr, amount } = req.params;
  const keypair = getDeployerKeypair();
  const client = new SuiClient({
    url: SUI_CHAIN_URL,
  });
  try {
    let cap = await client.getOwnedObjects({
      owner: keypair.toSuiAddress(),
      filter: {
        StructType: `0x2::coin::TreasuryCap<${SUI_PACKAGE_ID}::ibt_token::IBT_TOKEN>`,
      },
      limit: 1,
    });
    if (cap === undefined) {
      res.status(500).send({ cap });
      return;
    }
    cap = cap.data[0];
    console.log(cap);
    const tx = new Transaction();
    tx.moveCall({
      target: `${SUI_PACKAGE_ID}::ibt_token::mint`,
      arguments: [
        tx.pure("u64", Number(amount)),
        tx.object(cap.data.objectId),
        tx.pure("address", recipientAddr),
      ],
    });
    tx.setGasBudget(9000000);
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    res.status(200).send({ txResult: result });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e });
  }
});

router.get("/balance/:suiAddr", async (req, res) => {
  if (SUI_PACKAGE_ID === undefined) {
    return res.status(401).send({ error: "Contract not deployed." });
  }
  const keypair = getDeployerKeypair();
  const { suiAddr } = req.params;
  const client = new SuiClient({
    url: SUI_CHAIN_URL,
  });
  try {
    const tx = new TransactionBlock();
    let coins = await client.getOwnedObjects({
      owner: suiAddr,
      // options: {
      //   showOwner: true,
      //   showType: true,
      //   showContent: true,
      //   showStorageRebate: true,
      //   showDisplay: true,
      // },
      filter: {
        StructType: `0x2::coin::Coin<${SUI_PACKAGE_ID}::ibt_token::IBT_TOKEN>`,
      },
    });

    if (coins.length === 0) {
      res.status(200).send({ balance: 0 });
      return;
    }
    const coinIds = coins.data.map((c) => c.data.objectId);

    tx.moveCall({
      target: `${SUI_PACKAGE_ID}::ibt_token::balance`,
      arguments: [
        tx.makeMoveVec({
          objects: coinIds.map((cId) => tx.object(cId)),
        }),
      ],
    });

    tx.setGasBudget(9000000);

    const result = await client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: keypair.toSuiAddress(),
    });
    const balanceByteArr = result.results[1].returnValues[0][0]; // returns u64 as byte arr
    // 8 values in array => 8bits per value
    const buffer = new Uint8Array(balanceByteArr).buffer;
    // for 1 => 1 0 0 0 .. so small endian
    const balance = Number(new DataView(buffer).getBigUint64(0, true));
    res.status(200).send({ balanceByteArr, balance });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e });
  }
});

export default router;

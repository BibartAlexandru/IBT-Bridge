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

router.get("/mintSui/:address", async (req, res) => {
  try {
    const { address } = req.params;
    res.status(200).send(await mintSui(address));
  } catch (e) {
    return res.status(500).send({ error: e.toString() });
  }
});

router.get("/deployerAddress", async (req, res) => {
  try {
    if (!SUI_DEPLOYER_PRIVATE_KEY)
      return res
        .status(500)
        .send({ message: "Missing sui deployer privatekey from .env" });
    if (!SUI_CHAIN_URL)
      return res.status(500).send({
        message: "Missing chain url",
      });
    const keypair = getDeployerKeypair();
    return res.status(200).send({ deployerAddress: keypair.toSuiAddress() });
  } catch (e) {
    return res.status(500).send({ error: e.toString() });
  }
});

router.get("/deployerPublicKey", async (req, res) => {
  if (!SUI_DEPLOYER_PRIVATE_KEY)
    return res
      .status(500)
      .send({ message: "Missing sui_deployer_privatekey from .env" });
  if (!SUI_CHAIN_URL)
    return res.status(500).send({
      message: "Missing chain url",
    });
  try {
    const keypair = getDeployerKeypair();
    res.setHeader("Content-Type", "application/octet-stream");
    return res
      .status(200)
      .send(new Buffer(keypair.getPublicKey().toRawBytes()));
  } catch (e) {
    return res.status(500).send({ error: e.toString() });
  }
});

router.get("/deployerChainId", async (req, res) => {
  if (!SUI_CHAIN_URL)
    return res.status(500).send({ message: "Chain URL missing from .env" });
  try {
    const client = new SuiClient({
      url: SUI_CHAIN_URL,
    });
    return res
      .status(200)
      .send({ deployerChainId: await client.getChainIdentifier() });
  } catch (e) {
    return res.status(500).send({ error: e.toString() });
  }
});

router.get("/deployContract", async (req, res) => {
  if (!SUI_CHAIN_URL)
    return res.status(500).send({
      message: "Missing chain url",
    });
  if (!SUI_DEPLOYER_PRIVATE_KEY)
    return res
      .status(500)
      .send({ message: "Missing sui_deployer_privatekey from .env" });
  try {
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
      options: {
        showEffects: true,
      },
    });

    SUI_PACKAGE_ID = result.effects.created.find((o) => o.owner === "Immutable")
      .reference.objectId;
    console.log(`SUI_PKG_ID: ${SUI_PACKAGE_ID}`);
    res.status(200).send({ result });
  } catch (e) {
    return res.status(500).send({ error: e.toString() });
  }
});

router.get("/mint/:recipientAddr/:amount", async (req, res) => {
  if (!SUI_CHAIN_URL)
    return res.status(500).send({
      message: "Missing chain url",
    });
  if (!SUI_DEPLOYER_PRIVATE_KEY)
    return res
      .status(500)
      .send({ message: "Missing sui_deployer_privatekey from .env" });
  if (!SUI_PACKAGE_ID) {
    return res.status(500).send({
      message: "Missing package id, not deployed or set in .env",
    });
  }
  try {
    let { recipientAddr, amount } = req.params;
    if (recipientAddr.startsWith("0x"))
      recipientAddr = recipientAddr.substring(2);
    const keypair = getDeployerKeypair();
    const client = new SuiClient({
      url: SUI_CHAIN_URL,
    });
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
    // console.log(cap);
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

router.post("/deployerSignBurn", async (req, res) => {
  if (!SUI_CHAIN_URL)
    return res.status(500).send({
      message: "Missing chain url",
    });
  if (!SUI_DEPLOYER_PRIVATE_KEY)
    return res
      .status(500)
      .send({ message: "Missing sui_deployer_privatekey from .env" });
  if (!SUI_PACKAGE_ID) {
    return res.status(500).send({
      message: "Missing package id, not deployed or set in .env",
    });
  }
  try {
    const keypair = getDeployerKeypair();
    const client = new SuiClient({
      url: SUI_CHAIN_URL,
    });
    const userSignedTransaction = new Uint8Array(req.body);

    // console.log(userSignedTransaction);
    //TODO: check transaction is burn from user
    const tx = Transaction.from(userSignedTransaction);
    let cap = await suiClient.getOwnedObjects({
      owner: keypair.toSuiAddress(),
      filter: {
        StructType: `0x2::coin::TreasuryCap<${SUI_PACKAGE_ID}::ibt_token::IBT_TOKEN>`,
      },
      limit: 1,
    });
    cap = cap.data[0];

    await client.signAndExecuteTransaction({
      transaction: tx,
      signer: keypair,
    });
    // const txBytes = await tx.build({ client: client });
    // res.setHeader("Content-Type", "application/octet-stream");
    // return res.status(200).send(Buffer.from(txBytes));
    return res.status(200).send({
      message: "OK",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send(userSignedTransaction);
  }
});

router.get("/balance/:suiAddr", async (req, res) => {
  if (!SUI_CHAIN_URL)
    return res.status(500).send({
      message: "Missing chain url",
    });
  if (!SUI_PACKAGE_ID) {
    return res.status(500).send({
      message: "Missing package id, not deployed or set in .env",
    });
  }
  try {
    const keypair = getDeployerKeypair();
    let { suiAddr } = req.params;
    if (suiAddr.startsWith("0x")) suiAddr = suiAddr.substring(2);
    const client = new SuiClient({
      url: SUI_CHAIN_URL,
    });
    const tx = new TransactionBlock();
    let coins = await client.getOwnedObjects({
      owner: suiAddr,
      filter: {
        StructType: `0x2::coin::Coin<${SUI_PACKAGE_ID}::ibt_token::IBT_TOKEN>`,
      },
    });

    if (coins.data.length === 0) {
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

router.get("/packageId", (req, res) => {
  if (!SUI_CHAIN_URL)
    return res.status(500).send({ message: "Chain URL missing from .env" });
  return res.status(200).send({ packageId: SUI_PACKAGE_ID });
});

export default router;

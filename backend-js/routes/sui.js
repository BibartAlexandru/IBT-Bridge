const express = require("express");
const router = express.Router();
module.exports = router;
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { getFullnodeUrl, SuiClient } = require("@mysten/sui.js/client");
const { Ed25519Keypair } = require("@mysten/sui.js/keypairs/ed25519");
const { Transaction } = require("@mysten/sui.js/transactions");
const { bech32 } = require("bech32");

const SUI_DEPLOYER_PRIVATE_KEY = process.env.SUI_DEPLOYER_PRIVATE_KEY;
const SUI_CHAIN_URL = process.env.SUI_CHAIN_URL;

router.get("/", (req, res) => {
  res.status(200).send({ modules, dependencies });
});

router.get("/deployContract", async (req, res) => {
  const client = new SuiClient({
    url: SUI_CHAIN_URL,
  });

  const { words } = bech32.decode(SUI_DEPLOYER_PRIVATE_KEY);
  const numArray = bech32.fromWords(words);
  const secretKeyBytes = Buffer.from(numArray);
  //first byte is version and is 0 at least in this case
  const keypair = Ed25519Keypair.fromSecretKey(secretKeyBytes.slice(1));
  res.status(200).send({
    resulted: keypair.getPublicKey().toRawBytes(),
    initial: Buffer.from(
      "AAdjq7WWm9yx1Xia1KCel1mMc2FiW7doxQI67dvuZ1mT",
      "base64"
    ).slice(1),
  });
  return;

  const { modules, dependencies } = fs.readFileSync(
    path.join(__dirname, "../../../SuiToken/contract-build.js"),
    "utf-8"
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

  console.log({ result });
});

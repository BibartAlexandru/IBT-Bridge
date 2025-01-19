const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;
const { Web3 } = require("web3");
const fs = require("fs");
const { json } = require("stream/consumers");
const { strict } = require("assert");
const { error } = require("console");
const { abi, bytecode } = JSON.parse(
  fs.readFileSync("../bin/EthereumToken/IBTToken.json")
);
require("dotenv").config();
const INFURA_API_KEY = process.env.INFURA_API_KEY;
let CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.post("/deployContract", async (req, res) => {
  const { chainId, deployerPrivateKey } = req.body;

  // console.log(chainId + "\n" + deployerPrivateKey);

  try {
    const web3 = new Web3("http://127.0.0.1:8545/");

    const signer = web3.eth.accounts.privateKeyToAccount(deployerPrivateKey);
    web3.eth.accounts.wallet.add(signer);

    const contract = new web3.eth.Contract(abi);
    const deployTx = contract.deploy({
      data: "0x" + bytecode,
    });
    const deployedContract = await deployTx
      .send({
        from: signer.address,
        gas: 30000000,
        // gas: await deployTx.estimateGas(),
        // gasPrice: web3.utils.toWei("1", "gwei"),
      })
      .once("transactionHash", (txHash) => {
        console.log(txHash);
        //0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
      });
    CONTRACT_ADDRESS = deployedContract.options.address;
    res.status(200).send();
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

app.get("/balanceOf/:account", async (req, res) => {
  const { account } = req.params;
  if (!CONTRACT_ADDRESS) {
    return res.status(401).send({ error: "Contract not deployed." });
  }

  try {
    const web3 = new Web3("http://127.0.0.1:8545/");
    const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
    const balance = (
      await contract.methods.balanceOf(account).call()
    ).toString();
    // console.log(`Balance: ${balance}, type: ${typeof balance}`);
    return res.status(200).send({ balance });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: e });
  }
});

app.post("/mintToPerson/:account/:amount", async (req, res) => {});

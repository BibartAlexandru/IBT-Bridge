const express = require("express");
const app = express();
app.use(express.json());
const port = 3000;
const { Web3 } = require("web3");
const fs = require("fs");
const { json } = require("stream/consumers");
const { abi, bytecode } = JSON.parse(
  fs.readFileSync("../bin/EthereumToken/IBTToken.json")
);
require("dotenv").config();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.post("/deployContract", async (req, res) => {
  const { chainId, deployerPrivateKey } = req.body;

  console.log(chainId + "\n" + deployerPrivateKey);

  const web3 = new Web3(
    new Web3.providers.HttpProvider(
      `http://${chainId}.infura.io/v3/${process.env.INFURA_API_KEY}`
    )
  );

  const signer = web3.eth.accounts.privateKeyToAccount(deployerPrivateKey);
  web3.eth.accounts.wallet.add(signer);

  const contract = new web3.eth.Contract(abi);
  contract.options.data = bytecode;
  const deployTx = contract.deploy();
  const deployedContract = await deployTx
    .send({
      from: signer.address,
      gas: await deployTx.estimateGas(),
    })
    .once("transactionHash", (txHash) => {
      console.log(`Waiting for deployment of transaction ...`);
      console.log(`https://${chainId}.etherscan.io/tx/${txhash}`);
    });
  res.status(200).send();
});

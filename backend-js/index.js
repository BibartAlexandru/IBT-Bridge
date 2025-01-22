const express = require("express");
const app = express();
const port = 3000;
const { Web3 } = require("web3");
const fs = require("fs");
const { abi, bytecode } = JSON.parse(
  fs.readFileSync("../bin/EthereumToken/IBTToken.json")
);
require("dotenv").config();
app.use(express.json());
const ethRoutes = require("./routes/eth");
const suiRoutes = require("./routes/sui");
app.use("/eth", ethRoutes);
app.use("/sui", suiRoutes);

// ENV VARS
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const ETH_DEPLOYER_PRIVATE_KEY = process.env.ETH_DEPLOYER_PRIVATE_KEY;
const ETH_DEPLOYER_PUBLIC_KEY = process.env.ETH_DEPLOYER_PUBLIC_KEY;
const SUI_DEPLOYER_PRIVATE_KEY = process.env.SUI_DEPLOYER_PRIVATE_KEY;
const SUI_DEPLOYER_PUBLIC_KEY = process.env.SUI_DEPLOYER_PUBLIC_KEY;
const ETH_CHAIN_ID = process.env.ETH_CHAIN_ID;
const SUI_CHAIN_ID = process.env.SUI_CHAIN_ID;
const ETH_CHAIN_URL = process.env.ETH_CHAIN_URL;
const SUI_CHAIN_URL = process.env.SUI_CHAIN_URL;

let CONTRACT_ADDRESS = "";

app.get("/", (req, res) => {
  res.send("app main!");
});

app.listen(port, () => {
  console.log(`backend-js listening on port ${port}`);
});

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
const app = express();
app.use(
  cors({
    origins: ["http://localhost:5173"],
  })
);
const port = 3000;
import { Web3 } from "web3";
import fs from "fs";
const { abi, bytecode } = JSON.parse(
  fs.readFileSync("../bin/EthereumToken/IBTToken.json")
);
import dotenv from "dotenv";
dotenv.config();
app.use(express.json());
app.use(bodyParser.raw({ type: "application/octet-stream" }));
import ethRoutes from "./routes/eth.js";
import suiRoutes from "./routes/sui.js";
import dbRoutes from "./routes/db.js";
app.use("/eth", ethRoutes);
app.use("/sui", suiRoutes);
app.use("/db", dbRoutes);

// ENV VARS
const INFURA_API_KEY = process.env.INFURA_API_KEY;
const ETH_DEPLOYER_PRIVATE_KEY = process.env.ETH_DEPLOYER_PRIVATE_KEY;
const ETH_DEPLOYER_PUBLIC_KEY = process.env.ETH_DEPLOYER_PUBLIC_KEY;
const SUI_DEPLOYER_PRIVATE_KEY = process.env.SUI_DEPLOYER_PRIVATE_KEY;
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

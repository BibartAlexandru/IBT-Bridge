import express from "express";
import dotenv from "dotenv";
import IBTToken from "../../bin/EthereumToken/IBTToken.json" with {type: "json"};
import {Web3} from "web3"
const router = express.Router();
dotenv.config();

const ETH_DEPLOYER_PRIVATE_KEY = process.env.ETH_DEPLOYER_PRIVATE_KEY;
const ETH_CHAIN_URL = process.env.ETH_CHAIN_URL;
let ETH_CONTRACT_ADDRESS = process.env.ETH_CONTRACT_ADDRESS; // can be set in deployContract if not set in env

router.get("/", (req, res) => {
  res.status(200).send("Hello from eth middleware");
});

router.get('/deployerPubKey', (req,res) => {
  if(!ETH_DEPLOYER_PRIVATE_KEY || !ETH_CHAIN_URL)
    return res.status(500).send({message: "Chain url or deployer private key missing from .env"});
  const web3 = new Web3(ETH_CHAIN_URL);
  return res.status(200).send({deployerPubKey: web3.eth.accountProvider.privateKeyToAccount(ETH_DEPLOYER_PRIVATE_KEY).address})
});

router.get("/deployContract", async (req, res) => {
  try {
    const web3 = new Web3(ETH_CHAIN_URL);
    const signer = web3.eth.accounts.privateKeyToAccount(
      ETH_DEPLOYER_PRIVATE_KEY
    );
    web3.eth.accounts.wallet.add(signer);
    const contract = new web3.eth.Contract(IBTToken.abi);
    const deployTx = contract.deploy({
      data: "0x" + IBTToken.bytecode,
    });
    const deployedContract = await deployTx.send({
      from: signer.address,
      gas: 30000000,
      // gas: await deployTx.estimateGas(),
      // gasPrice: web3.utils.toWei("1", "gwei"),
    });
    ETH_CONTRACT_ADDRESS = deployedContract.options.address;
    res.status(200).send({ETH_CONTRACT_ADDRESS});
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e });
  }
});

router.get('/mint/:pubKey/:amount', async (req,res) => {
  let {pubKey, amount} = req.params;
  if (!ETH_CONTRACT_ADDRESS) {
    return res.status(401).send({ error: "Contract not deployed." });
  }
  try{
    const web3 = new Web3(ETH_CHAIN_URL);
    const contract = new web3.eth.Contract(IBTToken.abi, ETH_CONTRACT_ADDRESS);
    pubKey = pubKey.slice(2);
    await contract.methods.mintToPerson(pubKey,amount).send({
      from: web3.eth.accountProvider.privateKeyToAccount(ETH_DEPLOYER_PRIVATE_KEY).address,
      gas: 30000000,
    });
    return res.status(200).send({ message: "ok"});
  }
  catch(e){
    console.error(e);
    return res.status(500).send({error: e})
  }
});

router.get('/deployerChainId', async (req,res) => {
    if(!ETH_CHAIN_URL)
      return res.status(500).send({message: "Missing ETH_CHAIN_URL from .env"});
    const web3 = new Web3(ETH_CHAIN_URL);
    return res.status(200).send({chainId: Number(await web3.eth.getChainId())});
});

router.get('/contractAddress', (req,res) => {
  if(ETH_CONTRACT_ADDRESS)
    return res.status(200).send({contractAddress: ETH_CONTRACT_ADDRESS});
  return res.status(500).send({contractAddress: undefined});
})

router.get('/burn/:pubKey/:amount', async (req,res) => {
  let {pubKey, amount} = req.params;
  if (!ETH_CONTRACT_ADDRESS) {
    return res.status(401).send({ error: "Contract not deployed." });
  }
  try{
    const web3 = new Web3(ETH_CHAIN_URL);
    const contract = new web3.eth.Contract(IBTToken.abi, ETH_CONTRACT_ADDRESS);
    pubKey = pubKey.slice(2);
    await contract.methods.burnFromPerson(pubKey,amount).send({
      from: web3.eth.accountProvider.privateKeyToAccount(ETH_DEPLOYER_PRIVATE_KEY).address,
      gas: 30000000,
    });
    return res.status(200).send({ message: "ok"});
  }
  catch(e){
    console.error(e);
    return res.status(500).send({error: e})
  }
});

router.get("/balanceOf/:pubKey", async (req, res) => {
  let { pubKey } = req.params;
  if (!ETH_CONTRACT_ADDRESS) {
    return res.status(401).send({ error: "Contract not deployed." });
  }
  try {
    const web3 = new Web3(ETH_CHAIN_URL);
    const contract = new web3.eth.Contract(IBTToken.abi, ETH_CONTRACT_ADDRESS);
    // are 0x in fata si trebe scos
    pubKey = pubKey.slice(2);
    let balance = await contract.methods.balanceOf(pubKey).call({
        gas: 300000000,
        from: web3.eth.accountProvider.privateKeyToAccount(ETH_DEPLOYER_PRIVATE_KEY).address
      });
    // balance /= BigInt(Math.pow(10,18));
    balance = balance.toString();
    return res.status(200).send({ balance });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: e });
  }
});

export default router;

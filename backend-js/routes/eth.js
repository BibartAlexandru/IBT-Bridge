import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).send("Hello from eth middleware");
});

router.post("/deployContract", async (req, res) => {
  try {
    const web3 = new Web3(ETH_CHAIN_URL);
    const signer = web3.eth.accounts.privateKeyToAccount(
      ETH_DEPLOYER_PRIVATE_KEY
    );
    web3.eth.accounts.wallet.add(signer);
    const contract = new web3.eth.Contract(abi);
    const deployTx = contract.deploy({
      data: "0x" + bytecode,
    });
    const deployedContract = await deployTx.send({
      from: signer.address,
      gas: 30000000,
      // gas: await deployTx.estimateGas(),
      // gasPrice: web3.utils.toWei("1", "gwei"),
    });
    CONTRACT_ADDRESS = deployedContract.options.address;
    res.status(200).send();
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

router.get("/balanceOf/:account", async (req, res) => {
  const { account } = req.params;
  if (!CONTRACT_ADDRESS) {
    return res.status(401).send({ error: "Contract not deployed." });
  }

  try {
    const web3 = new Web3(ETH_CHAIN_URL);
    const contract = new web3.eth.Contract(abi, CONTRACT_ADDRESS);
    const balance = (
      await contract.methods.balanceOf(account).call()
    ).toString();
    return res.status(200).send({ balance });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: e });
  }
});

router.post("mintToPerson/:account/:amount", async (req, res) => {});
export default router;

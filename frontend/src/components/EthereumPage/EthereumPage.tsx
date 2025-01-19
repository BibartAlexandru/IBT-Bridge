import React, { useEffect, useState } from "react";
import "./EthereumPage.css";
import { useSDK } from "@metamask/sdk-react";
import IBTToken from "../../contracts/IBTToken.json";
import Web3 from "web3";
import IBTNavbar from "../IBTNavBar/IBTNavbar";
const EthereumPage = () => {
  const [account, setAccount] = useState<string>();
  const [ethTokens, setEthTokens] = useState<number>(999);
  const [ethContractAddr, setEthContractAddr] = useState(
    localStorage.getItem("ethContractAddress") || ""
  );
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  async function deployEthTokenContract() {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();

      const contract = new web3.eth.Contract(IBTToken.abi);
      const deployTx = contract.deploy({
        data: "0x" + IBTToken.bytecode,
      });

      const tx = {
        from: account,
        data: deployTx.encodeABI(),
        gas: 30000000,
      };

      web3.eth
        .sendTransaction(tx)
        .on("error", (error) => {
          console.error(error);
        })
        .on("receipt", (receipt) => {
          console.log(receipt);
          localStorage.setItem("ethContractAddress", receipt.contractAddress);
          setEthContractAddr(receipt.contractAddress);
        });
    }
  }

  async function connect() {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);
    } catch (err) {
      console.error(`Connection to metamask SDK failed. ${err}`);
    }
  }

  async function getAndSetEthTokens() {
    try {
      if (window.ethereum && ethContractAddr && account) {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(IBTToken.abi, ethContractAddr);
        const balance = await contract.methods
          .balanceOf(account)
          .call({ from: account });
        console.log(`balance:${balance}`);
        setEthTokens(Number(balance));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (account) getAndSetEthTokens();
  }, [account]);
  return (
    <div className="ethereum-page">
      <button onClick={connect}> Connect</button>
      <button onClick={deployEthTokenContract}>Deploy Bridge Contract</button>
      {connected && (
        <div>
          <h1>Chain ID: {chainId}</h1>
          <h1>Account: {account}</h1>
          <h1>(ETH) IBT Tokens: {ethTokens}</h1>
          <div className="row">
            <h2>Eth Contract Address:</h2>
            <input
              type="text"
              value={ethContractAddr}
              onChange={(e) => {
                setEthContractAddr(e.currentTarget.value);
              }}
            />
          </div>
        </div>
      )}
      ;
    </div>
  );
};

export default EthereumPage;

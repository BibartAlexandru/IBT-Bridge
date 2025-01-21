import React, { useEffect, useState } from "react";
import "./EthereumPage.css";
import { useSDK } from "@metamask/sdk-react";
import IBTToken from "../../contracts/IBTToken.json";
import Web3 from "web3";
import { useParams } from "react-router-dom";
import { EthereumPageContext } from "../../contexts/EthereumPageContext";
import BlockchainPage from "../BlockchainPage/BlockchainPage";

const EthereumPage = () => {
  const [account, setAccount] = useState<string>("");
  const [ethTokens, setEthTokens] = useState<number | undefined>(undefined);
  const [ethContractAddr, setEthContractAddr] = useState(
    sessionStorage.getItem("ethContractAddress") || ""
  );
  const { mode } = useParams<{ mode: string }>();
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
          sessionStorage.setItem("ethContractAddress", receipt.contractAddress);
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

  async function refreshTokens() {
    try {
      if (window.ethereum && ethContractAddr.length > 0 && account) {
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(IBTToken.abi, ethContractAddr);
        const balance = await contract.methods
          .balanceOf(account)
          .call({ from: account });
        console.log(`GOT BALANCE:${balance}`);
        setEthTokens(Number(balance));
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function onMint(
    callerPubKey: string,
    contractAddress: string,
    mintToAddress: string,
    mintAmount: number
  ) {
    console.log({ callerPubKey, contractAddress, mintToAddress, mintAmount });
    try {
      if (window.ethereum) {
        console.log("ON MINT CALLED!");
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(IBTToken.abi, contractAddress);
        await contract.methods
          .mintToPerson(mintToAddress, mintAmount)
          .send({ from: callerPubKey })
          .then((receipt) => {
            // console.log(receipt);
            refreshTokens();
          });
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function onBurn(
    callerPubKey: string,
    burnAmount: number,
    burnFromAddress: string,
    contractAddress: string
  ) {
    try {
      if (window.ethereum) {
        console.log("ON BURN CALLED!");
        const web3 = new Web3(window.ethereum);
        const contract = new web3.eth.Contract(IBTToken.abi, contractAddress);
        await contract.methods
          .burnFromPerson(burnFromAddress, burnAmount)
          .send({ from: callerPubKey })
          .then((receipt) => {
            // console.log(receipt);
            refreshTokens();
          });
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (account) refreshTokens();
  }, [account]);

  useEffect(() => {
    connect();
  });

  return (
    <EthereumPageContext.Provider value={{ refreshTokens, onBurn, onMint }}>
      <BlockchainPage
        chainIcon="/eth-logo.png"
        chainId={chainId}
        chainName="ETH"
        connect={connect}
        connected={connected}
        contractAddress={ethContractAddr}
        setContractAddress={setEthContractAddr}
        deployTokenContract={deployEthTokenContract}
        mode={mode}
        pubKey={account}
        tokens={ethTokens}
      />
    </EthereumPageContext.Provider>
  );
};

export default EthereumPage;

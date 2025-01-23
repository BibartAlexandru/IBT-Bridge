import React, { useEffect, useState } from "react";
import "./EthereumPage.css";
import { useSDK } from "@metamask/sdk-react";
import IBTToken from "../../contracts/IBTToken.json";
import Web3 from "web3";
import { useParams } from "react-router-dom";
import { EthereumPageContext } from "../../contexts/EthereumPageContext";
import BlockchainPage from "../BlockchainPage/BlockchainPage";
import { backend_url } from "../../App";

const EthereumPage = () => {
  const [account, setAccount] = useState<string>("");
  const [ethTokens, setEthTokens] = useState<number | undefined>(undefined);
  const [ethContractAddr, setEthContractAddr] = useState("");
  const { mode } = useParams<{ mode: string }>();
  const { sdk, connected, chainId } = useSDK();

  //used in deployer mode
  const [deployerChainId, setDeployerChainId] = useState("");
  async function connect() {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);
    } catch (err) {
      console.error(`Connection to metamask SDK failed. ${err}`);
    }
  }

  async function refreshTokens() {
    if (mode === "deployer") {
      const res = await fetch(`${backend_url}/eth/balanceOf/${account}`, {
        method: "GET",
      });
      const balance = (await res.json()).balance;
      setEthTokens(Number(balance));
    } else {
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
  }

  async function onMint(mintToAddress: string, mintAmount: number) {
    try {
      const resp = await fetch(
        `${backend_url}/eth/mint/${mintToAddress}/${mintAmount}`,
        {
          method: "GET",
        }
      );
      console.log(resp);
      refreshTokens();
    } catch (e) {
      console.error(e);
    }
  }

  async function onBurn(burnAmount: number, burnFromAddress: string) {
    try {
      const resp = await fetch(
        `${backend_url}/eth/burn/${burnFromAddress}/${burnAmount}`,
        {
          method: "GET",
        }
      );
      refreshTokens();
      console.log(resp);
    } catch (e) {
      console.error(e);
    }
  }

  async function deployerFetchAndSetAccount() {
    const res = await fetch(`${backend_url}/eth/deployerPubKey`, {
      method: "GET",
    });
    const deployerPubKey = (await res.json()).deployerPubKey;
    setAccount(deployerPubKey);
  }

  async function deployerFetchAndSetChainId() {
    const res = await fetch(`${backend_url}/eth/deployerChainId`, {
      method: "GET",
    });
    const chainId = (await res.json()).chainId;
    setDeployerChainId(chainId);
  }

  async function fetchAndSetContractAddress() {
    /**
     * Gets contract address from backend. Will be from .env if set, otherwise undefined.
     */
    const res = await fetch(`${backend_url}/eth/contractAddress`, {
      method: "GET",
    });
    const contractAddress = (await res.json()).contractAddress;
    setEthContractAddr(contractAddress);
  }

  useEffect(() => {
    if (account) refreshTokens();
  }, [account]);

  useEffect(() => {
    fetchAndSetContractAddress();

    if (mode === "deployer") {
      deployerFetchAndSetAccount();
      deployerFetchAndSetChainId();
    } else {
      connect();
    }
  });

  async function deployEthTokenContract() {
    const res = await fetch(`${backend_url}/eth/deployContract`, {
      method: "GET",
    });
    fetchAndSetContractAddress();
    // const resJson = await res.json();
    // console.log(resJson);
  }

  return (
    <EthereumPageContext.Provider value={{ refreshTokens, onBurn, onMint }}>
      <BlockchainPage
        chainIcon="/eth-logo.png"
        chainId={mode === "deployer" ? deployerChainId : chainId}
        chainName="ETH"
        connect={connect}
        connected={connected}
        contractAddress={ethContractAddr}
        setContractAddress={setEthContractAddr}
        deployTokenContract={deployEthTokenContract}
        mode={mode as string}
        pubKey={account}
        tokens={ethTokens}
      />
    </EthereumPageContext.Provider>
  );
};

export default EthereumPage;

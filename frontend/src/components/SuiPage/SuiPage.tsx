import React, { useEffect, useState } from "react";
import "./SuiPage.css";
import { SuiPageContext } from "../../contexts/SuiPageContext";
import BlockchainPage from "../BlockchainPage/BlockchainPage";
import { useParams } from "react-router-dom";
import "@mysten/dapp-kit/dist/index.css";
import {
  ConnectButton,
  useCurrentAccount,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { backend_url } from "../../App";

const SuiPage = () => {
  const { mode } = useParams<{ mode: string }>();
  const [packageId, setPackageId] = useState("");
  const [tokens, setTokens] = useState(0);
  const account = useCurrentAccount();
  const chainData = useSuiClientQuery("getChainIdentifier", []).data;
  const suiClient = useSuiClient();
  const [deployerAddress, setDeployerAddress] = useState("");
  const [deployerChainId, setDeployerChainId] = useState("");

  async function refreshTokens() {
    if (packageId.length === 0) return;
    if (mode === "deployer") {
      if (!deployerAddress) return;
      const resp = await fetch(
        `${backend_url}/sui/balance/${deployerAddress}`,
        {
          method: "GET",
        }
      );
      if (resp.status === 200) {
        const { balance } = await resp.json();
        setTokens(Number(balance));
      }
    } else {
      if (!account) return;
      const resp = await fetch(
        `${backend_url}/sui/balance/${account.address}`,
        {
          method: "GET",
        }
      );
      const { balance } = await resp.json();
      setTokens(Number(balance));
    }
  }

  async function onMint(mintToAddress: string, mintAmount: number) {
    const resp = await fetch(
      `${backend_url}/sui/mint/${mintToAddress}/${mintAmount}`,
      {
        method: "GET",
      }
    );
    console.log(resp.json());
    refreshTokens();
  }

  async function onBurn(burnAmount: number, burnFromAddress: string) {
    const resp = await fetch(
      `${backend_url}/sui/burn/${burnFromAddress}/${burnAmount}`,
      {
        method: "GET",
      }
    );
    console.log(resp.json());
    refreshTokens();
  }

  async function connect() {
    //TODO:
  }

  async function deployPackage() {
    const resp = await fetch(`${backend_url}/sui/deployContract`, {
      method: "GET",
    });
    console.log(await resp.json());
    fetchAndsetPackageId();
  }

  async function fetchAndSetDeployerAddress() {
    const resp = await fetch(`${backend_url}/sui/deployerAddress`, {
      method: "GET",
    });
    const { deployerAddress } = await resp.json();
    setDeployerAddress(deployerAddress);
  }

  async function fetchAndSetDeployerChainId() {
    const resp = await fetch(`${backend_url}/sui/deployerChainId`, {
      method: "GET",
    });
    const { deployerChainId } = await resp.json();
    setDeployerChainId(deployerChainId);
  }

  async function fetchAndsetPackageId() {
    const resp = await fetch(`${backend_url}/sui/packageId`, {
      method: "GET",
    });
    const { packageId } = await resp.json();
    setPackageId(packageId);
  }

  useEffect(() => {
    refreshTokens();
  }, [account, deployerAddress]);

  useEffect(() => {
    fetchAndsetPackageId();
    refreshTokens();
    if (mode === "deployer") {
      fetchAndSetDeployerAddress();
      fetchAndSetDeployerChainId();
      refreshTokens();
    }
  }, []);

  return (
    <SuiPageContext.Provider
      value={{
        refreshTokens,
        onBurn,
        onMint,
        accountPropertyName: "Account Sui Address",
        contractAddressPropertyName: "Package Object Id",
      }}
    >
      <BlockchainPage
        chainIcon="/sui-logo.png"
        chainId={mode === "deployer" ? deployerChainId : chainData}
        chainName="SUI"
        connect={connect}
        connected={
          (mode === "deployer" && deployerAddress.length !== 0) ||
          (mode === "user" && account !== null)
        }
        contractAddress={packageId}
        deployTokenContract={deployPackage}
        mode={mode as string}
        pubKey={
          mode === "deployer" ? deployerAddress : account ? account.address : ""
        }
        setContractAddress={setPackageId}
        tokens={tokens}
        connectButton={<ConnectButton />}
      />
    </SuiPageContext.Provider>
  );
};

export default SuiPage;

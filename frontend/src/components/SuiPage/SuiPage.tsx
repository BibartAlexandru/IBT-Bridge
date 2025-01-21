import React, { useState } from "react";
import "./SuiPage.css";
import { SuiPageContext } from "../../contexts/SuiPageContext";
import BlockchainPage from "../BlockchainPage/BlockchainPage";
import { useParams } from "react-router-dom";
const SuiPage = () => {
  const { mode } = useParams<{ mode: string }>();
  const [contractAddress, setContractAddress] = useState("");
  const [tokens, setTokens] = useState(0);

  async function refreshTokens() {
    //TODO:
  }

  async function onMint(
    callerPubKey: string,
    contractAddress: string,
    mintToAddress: string,
    mintAmount: number
  ) {
    //TODO:
  }

  async function onBurn(
    callerPubKey: string,
    burnAmount: number,
    burnFromAddress: string,
    contractAddress: string
  ) {
    //TODO:
  }

  async function connect() {
    //TODO:
  }

  async function deployTokenContract() {
    //TODO:
  }

  return (
    <SuiPageContext.Provider value={{ refreshTokens, onBurn, onMint }}>
      <BlockchainPage
        chainIcon="/sui-logo.png"
        chainId=""
        chainName="SUI"
        connect={connect}
        connected={false}
        contractAddress={contractAddress}
        deployTokenContract={deployTokenContract}
        mode={mode as string}
        pubKey=""
        setContractAddress={setContractAddress}
        tokens={tokens}
      />
    </SuiPageContext.Provider>
  );
};

export default SuiPage;

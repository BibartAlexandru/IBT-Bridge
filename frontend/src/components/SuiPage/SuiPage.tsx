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

const SuiPage = () => {
  const { mode } = useParams<{ mode: string }>();
  const [packageAddress, setPackageAddress] = useState("");
  const [tokens, setTokens] = useState(0);
  const account = useCurrentAccount();
  const chainData = useSuiClientQuery("getChainIdentifier", []).data;
  const suiClient = useSuiClient();

  //127.0.0.1/tcp/46409
  async function refreshTokens() {
    if (account === null) return;
    const ownedObjects = await suiClient.getOwnedObjects({
      owner: account.address,
      // filter: {
      //   StructType: `${packageAddress}::coin::Coin<${packageAddress}::ibt_token::IBT_TOKEN>`,
      // },
      options: { showContent: true, showType: true },
    });
    console.log("Tokens are:");
    console.log(ownedObjects.data);
    //TODO:
  }

  async function onMint(
    callerPubKey: string,
    packageAddress: string,
    mintToAddress: string,
    mintAmount: number
  ) {
    //TODO:
  }

  async function onBurn(
    callerPubKey: string,
    burnAmount: number,
    burnFromAddress: string,
    packageAddress: string
  ) {
    //TODO:
  }

  async function connect() {
    //TODO:
  }

  async function deployTokenContract() {
    //TODO:
  }

  useEffect(() => {
    if (account) {
      refreshTokens();
    }
  }, [account]);

  return (
    <SuiPageContext.Provider value={{ refreshTokens, onBurn, onMint }}>
      <BlockchainPage
        chainIcon="/sui-logo.png"
        chainId={"0x" + chainData}
        chainName="SUI"
        connect={connect}
        connected={account !== null}
        packageAddress={packageAddress}
        deployTokenContract={deployTokenContract}
        mode={mode as string}
        pubKey={account ? account.address : ""}
        setPackageAddress={setPackageAddress}
        tokens={tokens}
        connectButton={<ConnectButton />}
      />
    </SuiPageContext.Provider>
  );
};

export default SuiPage;

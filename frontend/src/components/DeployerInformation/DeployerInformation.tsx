/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import React, { useContext, useState } from "react";
import "./DeployerInformation.css";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import MintBurnComponent from "../MintBurnComponent/MintBurnComponent";
import {
  EthereumPageContext,
  IBlockchainPageContext,
} from "../../contexts/EthereumPageContext";
import { SuiPageContext } from "../../contexts/SuiPageContext";

interface Props {
  contractAddress: string;
  setContractAddress: React.Dispatch<React.SetStateAction<string>>;
  deployTokenContract: () => Promise<void>;
  pubKey: string;
}

const DeployerInformation = ({
  contractAddress,
  setContractAddress,
  deployTokenContract,
  pubKey,
}: Props) => {
  const [mintAmount, setMintAmount] = useState<Number>(0);
  const [mintToAddress, setMintToAddress] = useState<String | undefined>(
    undefined
  );
  const [burnAmount, setBurnAmount] = useState<Number>(0);
  const [burnFromAddress, setBurnFromAddress] = useState<String | undefined>(
    undefined
  );
  //I don't know under which context this component will be...
  const ethContext = useContext(EthereumPageContext) as IBlockchainPageContext;
  const suiContext = useContext(SuiPageContext) as IBlockchainPageContext;
  const { refreshTokens, onBurn, onMint } =
    ethContext === undefined ? suiContext : ethContext;

  return (
    <Container
      className="deployer-information"
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      {/* CONTRACT ADDR */}
      <Row>
        <Col xs="6" s="6">
          <h4>Eth Contract Address:</h4>
        </Col>
        <Col xs="6" style={{ justifyContent: "left", display: "flex" }}>
          <Form.Control
            type="text"
            placeholder=""
            value={contractAddress}
            onChange={(e) => {
              setContractAddress(e.currentTarget.value);
            }}
          />
        </Col>
        <Col xs="6" sm="6"></Col>
        <Col xs="6" sm="6" className="ibt-col p-3">
          <button
            className="btn btn-dark w-100"
            onClick={(e) => {
              e.preventDefault();
              deployTokenContract();
            }}
          >
            Deploy Bridge Contract
          </button>
        </Col>
      </Row>
      {/* MINT */}
      <MintBurnComponent
        amount={mintAmount}
        address={mintToAddress}
        setAddress={setMintToAddress}
        setAmount={setMintAmount}
        operationName="Mint 🧊"
        buttonText="Mint"
        onOperation={async () => {
          onMint(
            pubKey,
            contractAddress,
            mintToAddress as string,
            mintAmount.valueOf()
          );
        }}
      />
      {/* BURN */}
      <MintBurnComponent
        amount={burnAmount}
        address={burnFromAddress}
        setAddress={setBurnFromAddress}
        setAmount={setBurnAmount}
        operationName="Burn 🔥"
        onOperation={async () => {
          onBurn(
            pubKey,
            burnAmount.valueOf(),
            burnFromAddress as string,
            contractAddress
          );
        }}
        buttonText="Burn"
      />
    </Container>
  );
};

export default DeployerInformation;

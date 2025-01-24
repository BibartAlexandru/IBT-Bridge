import React, { useEffect, useState } from "react";
import "./TransferComponent.css";
import Container from "react-bootstrap/esm/Container";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import Form from "react-bootstrap/esm/Form";
import UserInformation from "../UserInformation/UserInformation";
import { useSDK } from "@metamask/sdk-react";
import { Button } from "react-bootstrap";

//SUI WALLET
import {
  ConnectButton,
  useCurrentAccount,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { backend_url } from "../../App";

const TransferComponent = () => {
  const [ethTokens, setEthTokens] = useState(0);
  const [suiTokens, setSuiTokens] = useState(0);
  const [fromEth, setFromEth] = useState(1);
  const [fromSui, setFromSui] = useState(0);

  const [isEthContract, setIsEthContract] = useState(false);
  const [isSuiPackage, setIsSuiPackage] = useState(false);

  //METAMASK
  const [ethAccount, setEthAccount] = useState<string>();
  const { sdk, connected, connecting, provider, chainId } = useSDK();
  const connect = async () => {
    try {
      const ethAccounts = await sdk?.connect();
      setEthAccount(ethAccounts?.[0]);
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  };

  //SUI WALLET
  const account = useCurrentAccount();

  async function fetchAndSetTokens() {
    if (ethAccount) {
      const res = await fetch(`${backend_url}/eth/balanceOf/${ethAccount}`, {
        method: "GET",
      });
      if (res.status === 200) {
        const balance = (await res.json()).balance;
        setEthTokens(Number(balance));
      }
    }
    if (account) {
      const resp = await fetch(
        `${backend_url}/sui/balance/${account.address}`,
        {
          method: "GET",
        }
      );
      if (resp.status === 200) {
        const { balance } = await resp.json();
        setSuiTokens(Number(balance));
      }
    }
  }

  async function fetchAndSetIsContracts() {
    let resp = await fetch(`${backend_url}/eth/contractAddress`, {
      method: "GET",
    });
    if (resp.status === 200) setIsEthContract(true);
    resp = await fetch(`${backend_url}/sui/packageId`, {
      method: "GET",
    });
    if (resp.status === 200) setIsSuiPackage(true);
  }

  useEffect(() => {
    fetchAndSetIsContracts();
    fetchAndSetTokens();
  }, [ethAccount, account]);

  return (
    <Container className="mt-5 transfer-component">
      <Col style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* IMGS  */}

        <Row>
          <Col xs="2"></Col>

          <Col xs="3">
            <img src="eth-logo.png" className="normal-img" />
          </Col>
          <Col xs="2"></Col>

          <Col xs="3">
            <img src="sui-logo.png" className="normal-img" />
          </Col>
          <Col xs="2"></Col>
        </Row>
        {/* VALUES  */}
        <Row>
          <Col xs="2"></Col>

          <Col>
            <h3>{ethTokens}</h3>
          </Col>
          <Col xs="2"></Col>

          <Col>
            <h3>{suiTokens}</h3>
          </Col>
          <Col xs="2"></Col>
        </Row>
        {/* INPUTS */}
        <Row>
          <Col></Col>
          <Col
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <Form.Control
              style={{ cursor: "pointer" }}
              value={fromEth}
              readOnly={fromEth === 0}
              type="number"
              onChange={(e) => {
                setFromEth(Number(e.currentTarget.value));
                setFromSui(0);
              }}
              onClick={() => {
                setFromEth(1);
                setFromSui(0);
              }}
            />
            <h5>{fromEth ? "From" : "To"}</h5>
          </Col>
          <Col>
            <img src="/exchange-arrows.svg" className="normal-img" />
          </Col>
          <Col
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <Form.Control
              style={{ cursor: "pointer" }}
              readOnly={fromSui === 0}
              value={fromSui}
              type="number"
              onChange={(e) => {
                setFromSui(Number(e.currentTarget.value));
                setFromEth(0);
              }}
              onClick={() => {
                setFromEth(0);
                setFromSui(1);
              }}
            />
            <h5>{fromSui ? "From" : "To"}</h5>
          </Col>
          <Col></Col>
        </Row>
        {/* INFO */}
        <Row>
          <Col xs="2"></Col>
          <Col xs="3">
            <Button
              className="btn btn-dark w-100"
              onClick={(e) => {
                e.preventDefault();
                connect();
              }}
            >
              Connect Wallet
            </Button>
          </Col>
          <Col xs="2"></Col>
          <Col xs="3">
            <ConnectButton style={{ width: "100%" }} />
          </Col>
          <Col xs="2"></Col>
        </Row>
        {/* MISSING CONTRACTS POPUP */}
        {(!isEthContract || !isSuiPackage) && (
          <Row>
            <Col></Col>
            <Col xs="8" className="missing-contract p-2">
              <h5>
                Missing: <span>{!isEthContract && "ETH contract"}</span>{" "}
                <span>{!isSuiPackage && "SUI package"}</span>
              </h5>
            </Col>
            <Col></Col>
          </Row>
        )}
      </Col>
    </Container>
  );
};

export default TransferComponent;

import React, { useEffect, useState } from "react";
import "./EthereumPage.css";
import { useSDK } from "@metamask/sdk-react";
import IBTToken from "../../contracts/IBTToken.json";
import Web3 from "web3";
import IBTNavbar from "../IBTNavBar/IBTNavbar";
import Image from "react-bootstrap/Image";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import UserInformation from "../UserInformation/UserInformation";
import Form from "react-bootstrap/Form";
import DeployerInformation from "../DeployerInformation/DeployerInformation";

const EthereumPage = () => {
  const [account, setAccount] = useState<string>("");
  const [ethTokens, setEthTokens] = useState<number>(999);
  const [ethContractAddr, setEthContractAddr] = useState(
    sessionStorage.getItem("ethContractAddress") || ""
  );
  const { mode } = useParams<{ id: string }>();
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

  async function getAndSetEthTokens() {
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

  useEffect(() => {
    if (account) getAndSetEthTokens();
  }, [account]);

  useEffect(() => {
    connect();
  });

  return (
    <div className="ethereum-page p-5">
      <Container>
        <Row style={{ flexWrap: "nowrap", justifyContent: "space-between" }}>
          <Col xs="10" style={{ textAlign: "left" }}>
            <Row style={{ flexWrap: "nowrap", justifyContent: "left" }}>
              <Col style={{ flexGrow: 0 }}>
                <img src="/eth-logo.png" className="normal-img" />
              </Col>
              <Row style={{ alignItems: "center", width: "fit-content" }}>
                <h4>ETH IBT Tokens</h4>
              </Row>
            </Row>
          </Col>
          <Col xs="2" style={{ textAlign: "right" }}>
            <button
              className="btn btn-dark"
              onClick={() => {
                connect();
              }}
            >
              Reconnect
            </button>
          </Col>
        </Row>
      </Container>

      {connected &&
        (mode === "deployer" ? (
          <>
            <UserInformation
              tokens={ethTokens}
              publicKey={account}
              chainId={chainId}
            />
            <DeployerInformation
              contractAddress={ethContractAddr}
              setContractAddress={setEthContractAddr}
            />
            <button className="btn btn-dark" onClick={deployEthTokenContract}>
              Deploy Bridge Contract
            </button>
          </>
        ) : (
          <UserInformation
            tokens={ethTokens}
            publicKey={account}
            chainId={chainId}
          />
        ))}
    </div>
  );
};

export default EthereumPage;

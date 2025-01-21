import React from "react";
import "./BlockchainPage.css";
import Container from "react-bootstrap/esm/Container";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";
import DeployerInformation from "../DeployerInformation/DeployerInformation";
import UserInformation from "../UserInformation/UserInformation";

interface Props {
  connect: () => Promise<void>;
  connected: boolean;
  mode: string;
  tokens: number | undefined;
  pubKey: string;
  chainId: string | undefined;
  deployTokenContract: () => Promise<void>;
  contractAddress: string;
  setContractAddress: React.Dispatch<React.SetStateAction<string>>;
  chainIcon: string;
  chainName: string;
  connectButton?: React.ReactNode | undefined;
}

const BlockchainPage = ({
  connect,
  connected,
  mode,
  tokens,
  pubKey,
  chainId,
  deployTokenContract,
  contractAddress,
  setContractAddress,
  chainIcon,
  chainName,
  connectButton = undefined,
}: Props) => {
  return (
    <div className="blockchain-page p-5">
      {/* ICON ROW */}
      <Container>
        <Row>
          <Col xs="2" md="1" lg="1" style={{ textAlign: "left" }}>
            <img src={chainIcon} className="normal-img" />
          </Col>
          <Col
            xs="3"
            md="3"
            lg="3"
            style={{
              textAlign: "left",
              display: "flex",
              alignItems: "center",
            }}
          >
            <h4>{chainName} IBT Tokens</h4>
          </Col>
          <Col xs="1" sm="1" md="4" lg="6"></Col>
          <Col xs="6" md="4" lg="2" style={{ textAlign: "right" }}>
            {connectButton === undefined ? (
              <button
                className="btn btn-dark w-100"
                onClick={() => {
                  connect();
                }}
              >
                Reconnect
              </button>
            ) : (
              connectButton
            )}
          </Col>
        </Row>
      </Container>

      {connected ? (
        mode === "deployer" ? (
          <>
            <UserInformation
              tokens={tokens}
              publicKey={pubKey}
              chainId={chainId}
            />
            <DeployerInformation
              pubKey={pubKey}
              deployTokenContract={deployTokenContract}
              contractAddress={contractAddress}
              setContractAddress={setContractAddress}
            />
          </>
        ) : (
          <UserInformation
            tokens={tokens}
            publicKey={pubKey}
            chainId={chainId}
            displayContractAddress={true}
            contractAddress={contractAddress}
            setContractAddress={setContractAddress}
          />
        )
      ) : (
        <h3>Not connected... =\</h3>
      )}
    </div>
  );
};

export default BlockchainPage;

import React, { useContext } from "react";
import "./UserInformation.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/esm/Form";
import {
  EthereumPageContext,
  IBlockchainPageContext,
} from "../../contexts/EthereumPageContext";
import { SuiPageContext } from "../../contexts/SuiPageContext";

interface Props {
  chainId: string | undefined;
  tokens: number | undefined;
  publicKey: string | undefined;
  contractAddress?: string | undefined;
  setContractAddress?: React.Dispatch<React.SetStateAction<string>> | undefined;
  displayContractAddress?: boolean;
}

const UserInformation = ({
  chainId,
  tokens,
  publicKey,
  contractAddress = undefined,
  setContractAddress = undefined,
  displayContractAddress = false,
}: Props) => {
  const ethContext = useContext(EthereumPageContext) as IBlockchainPageContext;
  const suiContext = useContext(SuiPageContext) as IBlockchainPageContext;
  const { accountPropertyName, contractAddressPropertyName } =
    ethContext === undefined ? suiContext : ethContext;
  return (
    <Container className="user-information px-3 my-3">
      <Row className="info-row">
        <Col xs="12" sm="6" className="p-3">
          <h4>Chain ID</h4>
        </Col>
        <Col xs="12" sm="6" className="p-3">
          <h4>{chainId}</h4>
        </Col>
      </Row>
      <Row className="info-row">
        <Col xs="12" sm="6" className="p-3">
          <h4>{accountPropertyName}</h4>
        </Col>
        <Col xs="12" sm="6" className="p-3">
          <div className="max-1-line ">
            <h4>{publicKey}</h4>
          </div>
        </Col>
      </Row>
      <Row className="info-row">
        <Col xs="12" sm="6" className="p-3">
          <h4>IBT Tokens</h4>
        </Col>
        <Col xs="12" sm="6" className="p-3">
          {tokens !== undefined ? (
            <h4>{tokens}</h4>
          ) : (
            <h4 style={{ opacity: 0.5 }}>Contract not deployed</h4>
          )}
        </Col>
        {displayContractAddress && setContractAddress !== undefined && (
          <>
            <Col xs="12" sm="6" className="p-3">
              <h4>{contractAddressPropertyName}</h4>
            </Col>
            <Col
              xs="12"
              sm="6"
              style={{ justifyContent: "left", display: "flex" }}
              className="p-3"
            >
              <h4 className="max-1-line">
                {contractAddress ? contractAddress : "Contract not deployed"}
              </h4>
            </Col>
          </>
        )}
      </Row>
    </Container>
  );
};

export default UserInformation;

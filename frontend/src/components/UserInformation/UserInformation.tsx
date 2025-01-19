import React from "react";
import "./UserInformation.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

interface Props {
  chainId: string | undefined;
  tokens: number;
  publicKey: string | undefined;
}

const UserInformation = ({ chainId, tokens, publicKey }: Props) => {
  return (
    <Container className="user-information px-3 my-3">
      <Row className="info-row">
        <Col md="6" className="p-3 pb-0">
          <h4>Chain ID</h4>
        </Col>
        <Col md="6" className="p-3 pb-0">
          <h4>{chainId}</h4>
        </Col>
      </Row>
      <Row className="info-row">
        <Col xs="3" md="6" className="p-3 pb-0">
          <h4>Account</h4>
        </Col>
        <Col xs="3" md="6" className="max-1-line p-3 pb-0">
          <h4>{publicKey}</h4>
        </Col>
      </Row>
      <Row className="info-row">
        <Col md="6" className="p-3">
          <h4>IBT Tokens</h4>
        </Col>
        <Col md="6" className="p-3">
          <h4>{tokens}</h4>
        </Col>
      </Row>
    </Container>
  );
};

export default UserInformation;

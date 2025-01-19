import React from "react";
import "./DeployerInformation.css";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";

interface Props {
  contractAddress: string;
  setContractAddress: React.Dispatch<React.SetStateAction<string>>;
}

const DeployerInformation = ({
  contractAddress,
  setContractAddress,
}: Props) => {
  return (
    <Container className="deployer-information">
      <Row>
        <Col>
          <h4>Eth Contract Address:</h4>
        </Col>
        <Col style={{ justifyContent: "left", display: "flex" }}>
          <Form.Control
            type="text"
            placeholder=""
            value={contractAddress}
            onChange={(e) => {
              setContractAddress(e.currentTarget.value);
            }}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default DeployerInformation;

/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import React from "react";
import "./MintBurnComponent.css";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";
import Form from "react-bootstrap/esm/Form";
import Button from "react-bootstrap/esm/Button";

interface Props {
  amount: Number;
  setAmount: React.Dispatch<React.SetStateAction<Number>>;
  address: String | undefined;
  setAddress: React.Dispatch<React.SetStateAction<String | undefined>>;
  operationName: String;
  onOperation: () => Promise<void>;
  buttonText: String;
}

const MintBurnComponent = ({
  amount,
  setAmount,
  address,
  setAddress,
  operationName,
  buttonText,
  onOperation,
}: Props) => {
  return (
    <Row>
      <Col xs="12" sm="6">
        <h4>{operationName}</h4>
      </Col>
      <Col xs="3" sm="2">
        <Form.Control
          type="number"
          placeholder="1 IBT"
          value={amount.toString()}
          onChange={(e) => {
            setAmount(Number(e.currentTarget.value));
          }}
        />
      </Col>
      <Col xs="9" sm="4">
        <Form.Control
          type="text"
          placeholder="Recipient PublicKey"
          value={address !== undefined ? address.toString() : ""}
          onChange={(e) => {
            setAddress(e.currentTarget.value);
          }}
        />
      </Col>
      <Col xs="6" sm="6"></Col>
      <Col xs="6" sm="6" className="ibt-col p-3">
        <Button
          className="btn btn-dark w-100"
          onClick={(e) => {
            e.preventDefault();
            onOperation();
          }}
        >
          {buttonText}
        </Button>
      </Col>
    </Row>
  );
};

export default MintBurnComponent;

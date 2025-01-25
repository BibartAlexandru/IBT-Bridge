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
  useConnectWallet,
  useCurrentWallet,
  useWallets,
  useSignTransaction,
} from "@mysten/dapp-kit";
import { backend_url } from "../../App";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { MultiSigPublicKey, Ed25519PublicKey } from "@mysten/sui/multisig";

const TransferComponent = () => {
  const [ethTokens, setEthTokens] = useState(0);
  const [suiTokens, setSuiTokens] = useState(0);
  const [fromEth, setFromEth] = useState(1);
  const [fromSui, setFromSui] = useState(0);
  const [suiDeployerAddress, setSuiDeployerAddress] = useState("");
  const [isEthContract, setIsEthContract] = useState(false);
  const [suiPackageId, setSuiPackageId] = useState("");
  const [userSignedBurnTransaction, setUserSignedBurnTransaction] =
    useState(undefined);
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
  const suiAccount = useCurrentAccount();
  const suiConnect = useConnectWallet().mutate;
  const suiWallets = useWallets();
  const currentSuiWallet = useCurrentWallet();
  const {
    mutate: userSignTransaction,
    isPending: userTxIsPending,
    isError: userTxIsError,
    isSuccess: userTxIsSuccess,
    variables: userTxVars,
  } = useSignTransaction();

  async function burnSuiFromUser(amount: number) {
    if (!suiAccount) {
      suiConnect({
        wallet: suiWallets[0],
      });
    }
    console.log("connected!");
    const multiSigPubKey = MultiSigPublicKey.fromPublicKeys({
      threshold: 2,
      publicKeys: [
        { publicKey: suiAccount?.publicKey, weight: 1 },
        {
          publicKey: suiDeployerAddress,
          weight: 1,
        },
      ],
    });
    const suiClient = new SuiClient({
      url: "https://fullnode.devnet.sui.io",
    });
    let userCoins = await suiClient.getOwnedObjects({
      owner: suiAccount.address,
      filter: {
        StructType: `0x2::coin::Coin<${suiPackageId}::ibt_token::IBT_TOKEN>`,
      },
    });
    userCoins = userCoins.data;

    let cap = await suiClient.getOwnedObjects({
      owner: suiDeployerAddress,
      filter: {
        StructType: `0x2::coin::TreasuryCap<${suiPackageId}::ibt_token::IBT_TOKEN>`,
      },
      limit: 1,
    });
    cap = cap.data[0];

    const tx = new Transaction();
    tx.moveCall({
      target: `${suiPackageId}::ibt_token::burn`,
      arguments: [
        tx.pure("u64", amount),
        tx.pure("address", suiAccount.address),
        tx.makeMoveVec({
          elements: userCoins.map((coin) => tx.object(coin.data.objectId)),
        }),
        tx.object(cap.data.objectId),
      ],
    });
    tx.setGasBudget(9000000);
    tx.setSender(multiSigPubKey.toSuiAddress());

    userSignTransaction({
      transaction: tx,
      account: suiAccount,
      chain: "sui:devnet",
    });
    // const resp = await fetch(`${backend_url}/sui/deployerSignBurn`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/octet-stream",
    //   },
    //   body: await tx.build({ client: suiClient }),
    // });
  }

  useEffect(() => {
    console.log("transaction sign pending");
  }, [userTxIsPending]);

  useEffect(() => {
    console.log("transaction sign err");
  }, [userTxIsError]);

  async function sendUserSignedBurnTransaction(tx) {
    const suiClient = new SuiClient({
      url: "https://fullnode.devnet.sui.io",
    });
    console.log("sending user transaction to backend!");
    const resp = await fetch(`${backend_url}/sui/deployerSignBurn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: await tx.build({ client: suiClient }),
    });
    console.log(resp);
  }

  useEffect(() => {
    console.log("transaction sign success");
    // sendUserSignedBurnTransaction();
    console.log(userTxVars);
  }, [userTxIsSuccess]);

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
    if (suiAccount) {
      const resp = await fetch(
        `${backend_url}/sui/balance/${suiAccount.address}`,
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
    // resp = await fetch(`${backend_url}/sui/packageId`, {
    //   method: "GET",
    // });
    // if (resp.status === 200) setIsSuiPackage(true);
  }

  async function fetchAndSetSuiPackageId() {
    if (!suiAccount) return;
    const resp = await fetch(`${backend_url}/sui/packageId`, {
      method: "GET",
    });
    if (resp.status !== 200) return;
    const { packageId } = await resp.json();
    setSuiPackageId(packageId);
  }

  async function fetchAndSetSuiDeployerAddress() {
    const resp = await fetch(`${backend_url}/sui/deployerAddress`, {
      method: "GET",
    });
    if (resp.status !== 200) return;
    const { deployerAddress } = await resp.json();
    setSuiDeployerAddress(deployerAddress);
  }

  useEffect(() => {
    fetchAndSetIsContracts();
    fetchAndSetTokens();
    if (suiAccount) fetchAndSetSuiPackageId();
  }, [ethAccount, suiAccount]);

  useEffect(() => {
    if (!ethAccount) connect();
    if (!suiAccount) suiConnect({ wallet: suiWallets[0] });
  }, [connect]);

  useEffect(() => {
    fetchAndSetSuiDeployerAddress();
  }, []);

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
            <img
              src="/exchange-arrows.svg"
              className="normal-img transfer-image"
              onClick={() => {
                "TODO:";
              }}
            />
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
              className="btn btn-dark w-100 h-100"
              onClick={(e) => {
                e.preventDefault();
                connect();
              }}
            >
              <p className="max-1-line">
                {!ethAccount ? "Connect Wallet" : ethAccount}
              </p>
            </Button>
          </Col>
          <Col xs="2"></Col>
          <Col xs="3">
            <ConnectButton
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "0.375rem !important",
              }}
            />
          </Col>
          <Col xs="2"></Col>
        </Row>

        {/* MISSING CONTRACTS POPUP */}
        {(!isEthContract || suiPackageId.length === 0) && (
          <Row>
            <Col></Col>
            <Col xs="8" className="missing-contract p-2">
              <h5>
                Missing: <span>{!isEthContract && "ETH contract"}</span>{" "}
                <span>{suiPackageId.length === 0 && "SUI package"}</span>
              </h5>
            </Col>
            <Col></Col>
          </Row>
        )}
      </Col>
      <Col>
        <Button
          className="btn btn-danger"
          onClick={(e) => {
            e.preventDefault();
            burnSuiFromUser(fromSui);
          }}
        >
          Test Sui Burn
        </Button>
      </Col>
    </Container>
  );
};

export default TransferComponent;

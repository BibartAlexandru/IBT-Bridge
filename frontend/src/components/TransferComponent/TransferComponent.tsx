import { useCallback, useEffect, useRef, useState } from "react";
import "./TransferComponent.css";
import Container from "react-bootstrap/esm/Container";
import Col from "react-bootstrap/esm/Col";
import Row from "react-bootstrap/esm/Row";
import Form from "react-bootstrap/esm/Form";
import { useSDK } from "@metamask/sdk-react";
import { Button } from "react-bootstrap";

//SUI WALLET
import {
  ConnectButton,
  useCurrentAccount,
  useConnectWallet,
  useWallets,
  // useSignTransaction,
  // useSignPersonalMessage,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";

import { backend_url } from "../../App";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import clsx from "clsx";
// import { MultiSigPublicKey } from "@mysten/sui/multisig";
// import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
// import { fromB64, fromBase64 } from "@mysten/sui/utils";
// import { Wallet } from "web3";

interface Transfer {
  id: number;
  fromChain: string;
  toChain: string;
  fromAcc: string;
  toAcc: string;
  amount: number;
  initialFromAmount: number;
  initialToAmount: number;
  time: string;
  status: string;
}

const TransferComponent = () => {
  const [ethTokens, setEthTokens] = useState(0);
  const [suiTokens, setSuiTokens] = useState(0);
  const [fromEth, setFromEth] = useState(1);
  const [fromSui, setFromSui] = useState(0);
  // const [suiDeployerAddress, setSuiDeployerAddress] = useState("");
  const [isEthContract, setIsEthContract] = useState(false);
  const [suiPackageId, setSuiPackageId] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [transferImgSpin, setTransferImgSpin] = useState(false);
  const [flashEth, setFlashEth] = useState(false); // change color
  const [flashSui, setFlashSui] = useState(false); //
  // const [userSignedBurnTransaction, setUserSignedBurnTransaction] =
  // useState(undefined);
  const pollingTransfersFn = useRef(null);
  //METAMASK
  const [ethAccount, setEthAccount] = useState<string>();
  const { sdk } = useSDK();

  const connect = useCallback(async () => {
    try {
      const ethAccounts = await sdk?.connect();
      setEthAccount(ethAccounts?.[0]);
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  }, [sdk]);

  //SUI WALLET
  const { mutate: suiConnect } = useConnectWallet();
  const { mutate: userSignAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const suiWallets = useWallets();
  // const currentSuiWallet = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  // const {
  //   mutate: userSignTransaction,
  //   isPending: userTxIsPending,
  //   isError: userTxIsError,
  //   isSuccess: userTxIsSuccess,
  //   variables: userTxVars,
  // } = useSignTransaction();

  // const { mutate: userSignMessage } = useSignPersonalMessage();

  async function burnSuiFromUser(amount: number) {
    if (!suiAccount) return;

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

    const tx = new Transaction();
    tx.moveCall({
      package: suiPackageId,
      module: "ibt_token",
      function: "join_into_coin_of_amount",
      arguments: [
        tx.pure("u64", amount),
        tx.makeMoveVec({
          elements: userCoins.map((coin) => tx.object(coin.data.objectId)),
        }),
      ],
    });
    tx.setGasBudget(9000000);

    userSignAndExecuteTransaction(
      {
        transaction: tx,
        chain: "sui:devnet",
      },
      {
        onSuccess(data) {
          console.log("user sign done," + data);
        },
        onError(e) {
          console.error(e);
        },
      }
    );

    // const resp = await fetch(`${backend_url}/sui/deployerSignBurn`, {
    //   method: "POST",
    //   headers: {
    // Content-Type": "application/octet-stream",
    //   },
    //   body: await tx.build({ client: suiClient }),
    // });
  }

  // async function sendUserSignedBurnTransaction(tx) {
  //   const suiClient = new SuiClient({
  //     url: "https://fullnode.devnet.sui.io",
  //   });
  //   console.log("sending user transaction to backend!");
  //   const resp = await fetch(`${backend_url}/sui/deployerSignBurn`, {
  //     method: "POST",
  //     headers: {
  //     "Content-Type": "application/octet-stream",
  //     },
  //     body: await tx.build({ client: suiClient }),
  //   });
  //   console.log(resp);
  // }

  const fetchSuiTokens = async (): Promise<number | undefined> => {
    // console.log("fetching SUI T");
    const resp = await fetch(
      `${backend_url}/sui/balance/${suiAccount?.address}`,
      {
        method: "GET",
      }
    );
    if (resp.status === 200) {
      const { balance } = await resp.json();
      return Number(balance);
    }
    return undefined;
  };

  const fetchEthTokens = async (): Promise<number | undefined> => {
    // console.log("fetching ETH T");
    const res = await fetch(`${backend_url}/eth/balanceOf/${ethAccount}`, {
      method: "GET",
    });
    if (res.status === 200) {
      const balance = (await res.json()).balance;
      return Number(balance);
    }
    return undefined;
  };

  const fetchAndSetTokens = async () => {
    if (ethAccount) {
      const prevEth = ethTokens;
      const res = await fetchEthTokens();
      if (res) {
        setEthTokens((prev) => {
          if (res !== prev) toggleEthFlash();
          return res;
        });
      }
    }
    if (suiAccount) {
      const res = await fetchSuiTokens();
      const prevSui = suiTokens;
      if (res && res !== prevSui) {
        setSuiTokens((prev) => {
          if (prev !== res) toggleSuiFlash();
          return res;
        });
      }
    }
  };

  async function fetchAndSetIsEthContract() {
    const resp = await fetch(`${backend_url}/eth/contractAddress`, {
      method: "GET",
    });
    if (resp.status === 200) setIsEthContract(true);
  }

  const fetchAndSetSuiPackageId = async () => {
    if (!suiAccount) return;
    const resp = await fetch(`${backend_url}/sui/packageId`, {
      method: "GET",
    });
    if (resp.status !== 200) return;
    const { packageId } = await resp.json();
    setSuiPackageId(packageId);
  };

  // async function fetchAndSetSuiDeployerAddress() {
  //   const resp = await fetch(`${backend_url}/sui/deployerAddress`, {
  //     method: "GET",
  //   });
  //   if (resp.status !== 200) return;
  //   const { deployerAddress } = await resp.json();
  //   setSuiDeployerAddress(deployerAddress);
  // }

  useEffect(() => {
    if (ethAccount && ethAccount.length !== 0) {
      fetchAndSetIsEthContract();
      fetchAndSetTokens();
    }
  }, [ethAccount]);

  useEffect(() => {
    if (suiAccount) {
      fetchAndSetTokens();
      fetchAndSetSuiPackageId();
    }
  }, [suiAccount]);

  useEffect(() => {
    if (!ethAccount) connect();

    if (!suiAccount)
      suiConnect({
        wallet: suiWallets[0],
      });
    // fetchAndSetSuiDeployerAddress();
  }, [connect, suiConnect, suiWallets]);

  function dateToSQL(date: Date): string {
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  }

  const startPollingTransferOperations = () => {
    const pollAndProcessTransfers = async () => {
      const resp = await fetch(`${backend_url}/db/processTransfers`, {
        method: "GET",
      });
      if (resp.status === 200) {
        fetchAndSetTokens();
      }
    };
    pollingTransfersFn.current = setInterval(() => {
      pollAndProcessTransfers();
      console.log("POLLING");
    }, 10000);
  };

  useEffect(() => {
    if (suiAccount && ethAccount && pollingTransfersFn.current === null)
      startPollingTransferOperations();
    return () => {
      pollingTransfersFn.current = null;
    };
  }, [suiAccount, ethAccount]);

  useEffect(() => {
    connect();
  }, [connect]);

  async function createTransferObject() {
    if (!suiAccount || !suiAccount.address) {
      console.error("sui account not connected");
      return;
    }
    const fromChain = fromEth !== 0 ? "eth" : "sui";
    const ts: Transfer = {
      amount: fromChain === "eth" ? fromEth : fromSui,
      fromAcc: fromChain === "eth" ? ethAccount : suiAccount.address,
      toAcc: fromChain === "eth" ? suiAccount.address : ethAccount,
      fromChain: fromChain,
      toChain: fromChain === "eth" ? "sui" : "eth",
      initialFromAmount: fromChain === "eth" ? ethTokens : suiTokens,
      initialToAmount: fromChain === "eth" ? suiTokens : ethTokens,
      status: "NEW",
      time: dateToSQL(new Date(Date.now())),
    };

    const resp = await fetch(`${backend_url}/db/transfers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transfer: ts }),
    });
    if (resp.status === 200) toggleSuccessModal();
  }

  async function toggleSuccessModal() {
    await setModalVisible(true);
    setTimeout(() => {
      setModalVisible(false);
    }, 2000);
  }

  async function toggleTransferImgSpin() {
    await setTransferImgSpin(true);
    setTimeout(() => {
      setTransferImgSpin(false);
    }, 14000);
  }

  async function toggleEthFlash() {
    await setFlashEth(true);
    setTimeout(() => {
      setFlashEth(false);
    }, 300);
  }

  async function toggleSuiFlash() {
    await setFlashSui(true);
    setTimeout(() => {
      setFlashSui(false);
    }, 300);
  }

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
            <h3 className={flashEth ? "flash-token" : "normal-token"}>
              {ethTokens}
            </h3>
          </Col>
          <Col xs="2"></Col>

          <Col>
            <h3 className={flashSui ? "flash-token" : "normal-token"}>
              {suiTokens}
            </h3>
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
              max={ethTokens}
              type="number"
              onChange={(e) => {
                setFromEth(Number(e.currentTarget.value));
                setFromSui(0);
              }}
              onClick={() => {
                if (fromEth === 0) setFromEth(1);
                setFromSui(0);
              }}
            />
            <h5>{fromEth ? "From" : "To"}</h5>
          </Col>
          <Col>
            <img
              src="/exchange-arrows.svg"
              className={
                "normal-img transfer-image" +
                (transferImgSpin ? " spinning-img" : "")
              }
              onClick={() => {
                createTransferObject();
                toggleTransferImgSpin();
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
              max={suiTokens}
              type="number"
              onChange={(e) => {
                setFromSui(Number(e.currentTarget.value));
                setFromEth(0);
              }}
              onClick={() => {
                if (fromSui === 0) setFromSui(1);
                setFromEth(0);
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
      <Col
        className="mt-3"
        xs="10"
        style={{ display: "flex", justifyContent: "right" }}
      >
        <Button
          className="btn btn-danger"
          style={{ opacity: ".5" }}
          onClick={(e) => {
            e.preventDefault();
            burnSuiFromUser(fromSui);
          }}
        >
          Test Sui Burn
        </Button>
      </Col>
      <Col
        xs="12"
        className={clsx({
          "mt-3 p-3 success-modal": true,
          "success-modal-visible": modalVisible,
          "success-modal-hidden": !modalVisible,
        })}
      >
        <h4>
          <span className="success-text">Successfully</span> created a transfer!
          It might take some time to process...
        </h4>
      </Col>
    </Container>
  );
};

export default TransferComponent;

import { useEffect, useState } from "react";
import { useSDK } from "@metamask/sdk-react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [account, setAccount] = useState<string>();
  const { sdk, connected, connecting, provider, chainId } = useSDK();

  async function getText() {
    const res = await fetch("http://127.0.01:8000/get_text");
    const text = await res.text();
    console.log(text);
    setText(text);
  }

  async function connect() {
    try {
      const accounts = await sdk?.connect();
      setAccount(accounts?.[0]);
    } catch (err) {
      console.error(`Connection to metamask SDK failed. ${err}`);
    }
  }

  useEffect(() => {
    // getText();
  }, []);

  return (
    <>
      <h1>The text is: {text}</h1>
      <button onClick={connect}> Connect</button>
      {connected && (
        <div>
          <h1>Chain ID: {chainId}</h1>
          <h1>Account: {account}</h1>
        </div>
      )}
    </>
  );
}

export default App;

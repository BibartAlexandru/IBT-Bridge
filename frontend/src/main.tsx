import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { MetaMaskProvider } from "@metamask/sdk-react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MetaMaskProvider
      sdkOptions={{
        dappMetadata: {
          name: "IBT Bridge",
          url: window.location.href,
        },
        infuraAPIKey: process.env.REACT_APP_INFURA_API_KEY,
      }}
    >
      <App />
    </MetaMaskProvider>
  </StrictMode>
);

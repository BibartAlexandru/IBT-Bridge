import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

//ETH
import { MetaMaskProvider } from "@metamask/sdk-react";
import EthereumPage from "./components/EthereumPage/EthereumPage.tsx";

//SUI
import SuiPage from "./components/SuiPage/SuiPage.tsx";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TransferComponent from "./components/TransferComponent/TransferComponent.tsx";

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl("localnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});
const queryClient = new QueryClient();

const routes = createBrowserRouter([
  {
    path: "/ethereum/:mode",
    element: <EthereumPage />,
  },
  {
    path: "/sui/:mode",
    element: <SuiPage />,
  },
  {
    path: "/",
    element: <TransferComponent />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="localnet">
        <WalletProvider enableUnsafeBurner={true} autoConnect={true}>
          <MetaMaskProvider
            sdkOptions={{
              dappMetadata: {
                name: "IBT Bridge",
                url: window.location.href,
              },
              infuraAPIKey: "aeb80b09a4fe41429b0e51dc3b1d39ef",
            }}
          >
            <App>
              <RouterProvider router={routes} />
            </App>
          </MetaMaskProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>
);

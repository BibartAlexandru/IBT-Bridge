import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { MetaMaskProvider } from "@metamask/sdk-react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import EthereumPage from "./components/EthereumPage/EthereumPage.tsx";

const routes = createBrowserRouter([
  {
    path: "/ethereum",
    element: <EthereumPage />,
  },
  {
    path: "/",
    element: undefined,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
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
  </StrictMode>
);

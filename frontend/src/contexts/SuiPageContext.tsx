import { createContext } from "react";
import { IBlockchainPageContext } from "./EthereumPageContext";
export const SuiPageContext = createContext<IBlockchainPageContext | undefined>(
  undefined
);

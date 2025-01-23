import { createContext } from "react";
export const EthereumPageContext = createContext<
  IBlockchainPageContext | undefined
>(undefined);

export interface IBlockchainPageContext {
  refreshTokens: () => Promise<void>;
  onBurn(burnAmount: number, burnFromAddress: string): Promise<void>;
  onMint(mintToAddress: string, mintAmount: number): Promise<void>;
}

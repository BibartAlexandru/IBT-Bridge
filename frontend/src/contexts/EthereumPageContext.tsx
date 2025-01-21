import { createContext } from "react";
export const EthereumPageContext = createContext<
  IBlockchainPageContext | undefined
>(undefined);

export interface IBlockchainPageContext {
  refreshTokens: () => Promise<void>;
  onBurn(
    callerPubKey: string,
    burnAmount: number,
    burnFromAddress: string,
    contractAddress: string
  ): Promise<void>;
  onMint(
    callerPubKey: string,
    contractAddress: string,
    mintToAddress: string,
    mintAmount: number
  ): Promise<void>;
}

import { Contract, providers } from "ethers";
import { RPC_URL, RPS_ADDRESS } from "./constants";
import RPS_ABI from "./contracts/RPS_ABI.json";
import { RPS } from "./contracts/RPS";
import { getWallet } from "@rly-network/mobile-sdk";

export const sleep = (ms: number) =>
  new Promise((resolve: any) => setTimeout(resolve, ms));

export const getProvider = () => {
  return new providers.JsonRpcProvider(RPC_URL);
}

export const getRPSContract = () => {
  return new Contract(
    RPS_ADDRESS,
    RPS_ABI,
    getProvider(),
  ) as RPS;
}

export const generateSignatureString = (nonce: number): string => {
  return `May the gods of round ${nonce + 1} be in your favor.`
}

export const getSecretFromNonce = async (nonce: number): Promise<bigint> => {
  const wallet = await getWallet();

  if (!wallet) {
    throw new Error('Wallet not initialized');
  }

  const signature = await wallet.signMessage(generateSignatureString(nonce));
  return BigInt(signature);
}

export const getNonce = async (): Promise<number> => {
  const wallet = await getWallet();
  const rps = getRPSContract();

  if (!wallet) {
    throw new Error('Wallet not initialized');
  }

  const nonce = await rps.getNonce(wallet.address);

  return nonce.toNumber();
}
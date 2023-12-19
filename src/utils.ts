import { Contract, providers } from "ethers";
import { RPC_URL, RPS_ADDRESS } from "./constants";
import RPS_ABI from "./contracts/RPS_ABI.json";
import { RPS } from "./contracts/RPS";
import { getWallet } from "@rly-network/mobile-sdk";
import { Share } from "react-native";

const provider = new providers.JsonRpcProvider(RPC_URL);

const rps = new Contract(
  RPS_ADDRESS,
  RPS_ABI,
  provider,
) as RPS;

export const sleep = (ms: number) =>
  new Promise((resolve: any) => setTimeout(resolve, ms));

export const getProvider = () => {
  return provider;
}

export const getRPSContract = () => {
  return rps;
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

export const moveToEmoji = (move: number): string => {
  switch (move) {
    case 0:
      return '✊';
    case 1:
      return '✋';
    case 2:
      return '✌️';
    default:
      return '❓';
  }
}

export const shareNewRound = async (roundId: number) => {
  await Share.share({
    message: `You've been challenged to a game of Rock Paper Scissors. rlyrps://play/${roundId}`
  });
}
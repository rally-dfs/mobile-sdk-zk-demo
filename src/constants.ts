import { Platform } from "react-native";
import RNFS from "react-native-fs";

export const RPS_ADDRESS = '0x09e0BC0c41cD139a364d8bee5C168f555c335313';
export const RPC_URL = "https://polygon-amoy.infura.io/v3/d4f223c4058d4523b2f5a7f62d934530";

export const ATTEST_VALID_MOVE_ZKEY_PATH =
  (Platform.OS === 'android'
    ? RNFS.DocumentDirectoryPath
    : RNFS.MainBundlePath) + '/attestValidMove.zkey';

export const ATTEST_VALID_MOVE_DAT_PATH =
    (Platform.OS === 'android'
      ? RNFS.DocumentDirectoryPath
      : RNFS.MainBundlePath) + '/attestValidMove.dat'

export const REVEAL_MOVE_ZKEY_PATH =
  (Platform.OS === 'android'
    ? RNFS.DocumentDirectoryPath
    : RNFS.MainBundlePath) + '/revealMove.zkey';

export const REVEAL_MOVE_DAT_PATH =
  (Platform.OS === 'android'
    ? RNFS.DocumentDirectoryPath
    : RNFS.MainBundlePath) + '/revealMove.dat';
    
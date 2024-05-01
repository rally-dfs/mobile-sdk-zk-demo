/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { Platform } from 'react-native';
import { RecoilRoot } from 'recoil';
import RNFS from "react-native-fs";
import { RlyAmoyNetwork, Network } from '@rly-network/mobile-sdk';

import AppRouting from './components/AppRouting';
import ErrorToast from './components/ErrorToast';
import { PrivateConfig } from './private_config';

export const RlyNetwork: Network = RlyAmoyNetwork;

RlyNetwork.setApiKey(PrivateConfig.RALLY_API_KEY);

if (Platform.OS === 'android') {
  writeAssetFilesToDocumentsDirectory();
}

function App(): JSX.Element {
  return (
    <RecoilRoot>
      <AppRouting />
      <ErrorToast />
    </RecoilRoot>
  );
}

function writeAssetFilesToDocumentsDirectory(): Promise<any> {
  return Promise.all([
    RNFS.copyFileAssets(
      'attestValidMove.zkey',
      RNFS.DocumentDirectoryPath + '/attestValidMove.zkey'
    ),
    RNFS.copyFileAssets(
      'attestValidMove.dat',
      RNFS.DocumentDirectoryPath + '/attestValidMove.dat'
    ),
    RNFS.copyFileAssets(
      'revealMove.zkey',
      RNFS.DocumentDirectoryPath + '/revealMove.zkey'
    ),
    RNFS.copyFileAssets(
      'revealMove.dat',
      RNFS.DocumentDirectoryPath + '/revealMove.dat'
    ),
  ]);
}

export default App;

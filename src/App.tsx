/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';

import { RecoilRoot } from 'recoil';
import { RlyAmoyNetwork, Network } from '@rly-network/mobile-sdk';

import AppRouting from './components/AppRouting';
import ErrorToast from './components/ErrorToast';
import { PrivateConfig } from './private_config';

export const RlyNetwork: Network = RlyAmoyNetwork;

RlyNetwork.setApiKey(PrivateConfig.RALLY_API_KEY);

function App(): JSX.Element {
  return (
    <RecoilRoot>
      <AppRouting />
      <ErrorToast />
    </RecoilRoot>
  );
}

export default App;

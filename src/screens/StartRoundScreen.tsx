/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { RlyNetwork } from '../../App';
import InfoButton from '../components/InfoButton';
import ScreenContainer from '../components/ScreenContainer';
import StandardButton from '../components/StandardButton';
import { StandardHeader } from '../components/StandardHeader';
import { balance as balanceState, errorMessage } from '../state';
import { useProofGen } from '../hooks/useProofGen';
import { base64 } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';

export default function StartRoundScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [, setBalance] = useRecoilState(balanceState);
  const setErrorMessage = useSetRecoilState(errorMessage);
  const { calculateProof: calculateAttestProof } = useProofGen<{
    readonly move: BigInt;
    readonly secret: BigInt;
  }>(require('../circuits/attestValidMove.wasm'), require('../circuits/attestValidMove.zkey'), 1);


  const genAttestProof = async (move: BigInt) => {
    try {
      const secret = 123152419872319823719238712098n;
      // TODO: Generate the secret from the on chain nonce and signed with the private key.
      // This is so the secret is essentially stored on chain for the user and doesn't need to be stored on the device.
      const attestResults = await calculateAttestProof({ move, secret });
      console.log('\nAttest valid move proof')
      attestResults.proof.forEach((x: bigint) => console.log("0x" + x.toString(16) + ","));

      let textString = "";
      attestResults.proof.forEach((x: bigint) => {
        textString += base64.encode(BigNumber.from(x).toHexString());
      });
      console.log(textString);

      console.log('\nMove Attestation: ', "0x" + attestResults.publicSignals[0].toString(16));


    } catch (e) {
      console.error(e);
    }
  }

  const claimTokens = async () => {
    setLoading(true);

    setLoading(false);

    //@ts-ignore
    navigation.navigate('Home');
  };
  return (
    <>
      <StandardHeader />
      <ScreenContainer>
        <View
          style={{
            marginTop: 116,
            alignItems: 'center',
            alignSelf: 'center',
          }}
        >
          <View style={{ marginTop: 12 }}>
            <StandardButton
              title="Play Rock"
              onPress={() => {
                genAttestProof(0n);
              }}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <StandardButton
              title="Play Paper"
              onPress={() => {
                genAttestProof(1n);
              }}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <StandardButton
              title="Play Scissors"
              onPress={() => {
                genAttestProof(2n);
              }}
            />
          </View>
        </View>
      </ScreenContainer>
    </>
  );
}

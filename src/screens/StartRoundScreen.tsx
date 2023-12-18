/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import { getAccount } from '@rly-network/mobile-sdk';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, Text, View } from 'react-native';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { RlyNetwork } from '../../App';
import InfoButton from '../components/InfoButton';
import ScreenContainer from '../components/ScreenContainer';
import StandardButton from '../components/StandardButton';
import { StandardHeader } from '../components/StandardHeader';
import { balance as balanceState, errorMessage } from '../state';
import { useProofGen } from '../hooks/useProofGen';
import { BigNumber } from 'ethers';
import { getNonce, getProvider, getRPSContract, getSecretFromNonce } from '../utils';
import { RPS } from '../contracts/RPS';
import { GsnTransactionDetails } from '@rly-network/mobile-sdk/lib/typescript/gsnClient/utils';
import { Move } from './types';

export default function StartRoundScreen() {
  const rps = getRPSContract();
  const provider = getProvider();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState('');
  const [account, setAccount] = useState('');
  const [move, setMove] = useState<Move>(null);
  const [nonce, setNonce] = useState(0);
  const [secret, setSecret] = useState(0n);
  const [moveAttestation, setMoveAttestation] = useState('');
  const [proof, setProof] = useState<BigInt[]>([]);
  const [, setBalance] = useRecoilState(balanceState);
  const setErrorMessage = useSetRecoilState(errorMessage);
  const { calculateProof: calculateAttestProof } = useProofGen<{
    readonly move: BigInt;
    readonly secret: BigInt;
  }>(require('../circuits/attestValidMove.wasm'), require('../circuits/attestValidMove.zkey'), 1);

  const appendStatus = (newStatus: string) => {
    setStatus(status + "\n" + newStatus);
  }

  useEffect(() => {
    const getChainData = async () => {
      setStatus('Getting chain data...');
      const nonce = await getNonce();
      setNonce(nonce);
      const newSecret = await getSecretFromNonce(nonce);
      setSecret(newSecret);

      const fromAccount = await getAccount();

      if (!fromAccount) {
        throw new Error('Wallet not initialized');
      }

      setAccount(fromAccount);
      setStatus('Getting chain data...✅');
    }

    getChainData().catch((e) => {
      setErrorMessage({
        title: 'Unable to get chain data',
        body: 'Error was: ' + e.message,
      });
    });
  }, []);

  useEffect(() => {
    if (move === null || secret === 0n) {
      return;
    }
    const calculateProof = async () => {
      appendStatus('Calculating proof...');
      setLoading(true);
      const attestResults = await calculateAttestProof({ move, secret });
      const newMoveAttestation = "0x" + attestResults.publicSignals[0].toString(16);

      setProof(attestResults.proof);
      setMoveAttestation(newMoveAttestation);
      setLoading(false);
      appendStatus('Calculating proof...✅');
    }

    calculateProof().catch((e) => {
      setLoading(false);
      setErrorMessage({
        title: 'Unable to calculate proof',
        body: 'Error was: ' + e.message,
      });
    })
  }, [move, secret]);


  useEffect(() => {
    if (moveAttestation === "" || proof.length === 0) {
      return;
    }

    const submitToChain = async () => {
      setLoading(true);
      appendStatus('Submitting to chain...');

      const params: RPS.StartParamsStruct = {
        proof: proof.map((x) => BigNumber.from(x)),
        moveAttestation,
        nonce,
        maxRoundTime: 0,
        permitAmount: 0,
        permitDeadline: 0,
        permitV: 0,
        permitR: '0x0000000000000000000000000000000000000000000000000000000000000000',
        permitS: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
      const tx = await rps.populateTransaction.startRound(params);

      const gas = await rps.estimateGas.startRound(params, {
        from: account,
      });

      const { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();

      const gsnTx: GsnTransactionDetails = {
        from: account,
        data: tx.data || "",
        value: "0",
        to: rps.address,
        gas: gas?._hex,
        maxFeePerGas: maxFeePerGas?._hex || "0",
        maxPriorityFeePerGas: maxPriorityFeePerGas?._hex || "0",
      };

      const result = await RlyNetwork.relay?.(gsnTx);

      if (result) {
        setTxHash(result);
      }

      setLoading(false);
      appendStatus('Submitting to chain...✅');
    }

    submitToChain().catch((e) => {
      setErrorMessage({
        title: 'Unable to submit move',
        body: 'Error was: ' + e.message,
      });
    });

  }, [moveAttestation, proof]);

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `You've been challenged to a game of Rock Paper Scissors. rlyrps://play/${txHash}`
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (e: any) {
      setErrorMessage({
        title: 'Unable to share move',
        body: 'Error was: ' + e.message,
      });
    }
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
                setMove(0n);
              }}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <StandardButton
              title="Play Paper"
              onPress={() => {
                setMove(1n);
              }}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <StandardButton
              title="Play Scissors"
              onPress={() => {
                setMove(2n);
              }}
            />
          </View>
          {loading && (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator />
            </View>
          )}
          <View style={{ marginTop: 12 }}>
            <Text>{status}</Text>
          </View>
          {txHash && (
            <>
              <View style={{ marginTop: 12 }}>
                <Text>{txHash}</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <StandardButton
                  title="Share with opponent"
                  onPress={() => {
                    onShare();
                  }}
                />
              </View>
            </>
          )}


        </View>
      </ScreenContainer>
    </>
  );
}

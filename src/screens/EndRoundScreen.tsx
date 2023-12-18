/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import { getAccount } from '@rly-network/mobile-sdk';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../components/AppRouting';
import { Move } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'EndRound'>;

export default function EndRoundScreen({ route, navigation }: Props) {
  const provider = getProvider();
  const rps = getRPSContract();
  const { txHash } = route.params;
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [txMined, setTxMined] = useState(false);
  const [endRoundTxHash, setEndRoundTxHash] = useState('');
  const [account, setAccount] = useState('');
  const [roundId, setRoundId] = useState(0)
  const [winner, setWinner] = useState(0)
  const [moveAttestation, setMoveAttestation] = useState('');
  const [secret, setSecret] = useState(0n);
  const [move, setMove] = useState<Move>(null);
  const [proof, setProof] = useState<BigInt[]>([]);
  const setErrorMessage = useSetRecoilState(errorMessage);
  const { calculateProof: calculateRevealProof } = useProofGen<{
    readonly moveAttestation: BigInt;
    readonly secret: BigInt;
  }>(require('../circuits/revealMove.wasm'), require('../circuits/revealMove.zkey'), 1);

  const appendStatus = (newStatus: string) => {
    setStatus(status + "\n" + newStatus);
  }

  useEffect(() => {
    if (!txMined) {
      return;
    }

    const getChainData = async () => {
      const receipt = await provider.getTransactionReceipt(endRoundTxHash);

      const logs = receipt.logs.filter((x) => x.address === rps.address && x).map((x) => rps.interface.parseLog(x));
      if (logs.length === 0) {
        throw new Error('No logs found');
      }
      const log = logs[0];

      if (log.name !== 'RoundEnded') {
        throw new Error('No RoundEnded event found');
      }

      const winner = log.args.winner as BigNumber;
      setWinner(winner.toNumber());
    }

    getChainData().catch((e) => {
      setErrorMessage({
        title: 'Unable to get chain data',
        body: 'Error was: ' + e.message,
      });
    })
  }, [txMined]);

  useEffect(() => {
    const getChainData = async () => {
      if (!txHash || txHash === '') {
        return;
      }

      setStatus('Getting chain data...');
      const fromAccount = await getAccount();

      if (!fromAccount) {
        throw new Error('Wallet not initialized');
      }

      setAccount(fromAccount);

      const receipt = await provider.getTransactionReceipt(txHash);

      const logs = receipt.logs.filter((x) => x.address === rps.address && x).map((x) => rps.interface.parseLog(x));
      if (logs.length === 0) {
        throw new Error('No logs found');
      }
      const log = logs[0];

      if (log.name !== 'Move2Played') {
        throw new Error('No Move2Played event found');
      }

      const roundId = log.args.roundId as BigNumber

      setRoundId(roundId.toNumber());

      const { nonce, move1Attestation } = await rps.getRound(roundId);

      const newSecret = await getSecretFromNonce(nonce);
      setSecret(newSecret);
      setMoveAttestation(move1Attestation.toString());

      setStatus('Getting chain data...✅');
    }

    getChainData().catch((e) => {
      setErrorMessage({
        title: 'Unable to get chain data',
        body: 'Error was: ' + e.message,
      });
    });
  }, [txHash]);

  useEffect(() => {
    if (moveAttestation === '' || secret === 0n) {
      return;
    }
    const calculateProof = async () => {
      appendStatus('Calculating proof...');
      const revealResults = await calculateRevealProof({ moveAttestation: BigInt(moveAttestation), secret });
      const foundMove = revealResults.publicSignals[0] as Move;

      setProof(revealResults.proof);
      setMove(foundMove);
      appendStatus('Calculating proof...✅');
    }

    calculateProof().catch((e) => {
      setLoading(false);
      setErrorMessage({
        title: 'Unable to calculate proof',
        body: 'Error was: ' + e.message,
      });
    })
  }, [moveAttestation, secret]);

  const submitProof = async () => {
    try {
      setLoading(true);
      appendStatus('Submitting to chain...');

      const params: RPS.EndParamsStruct = {
        proof: proof.map((x) => BigNumber.from(x)),
        roundId,
        move1: BigNumber.from(move),
      };

      const tx = await rps.populateTransaction.endRound(params);

      const gas = await rps.estimateGas.endRound(params, {
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
      if (!result) {
        throw new Error('Unable to relay transaction');
      }

      setEndRoundTxHash(result);
      appendStatus('Submitting to chain...✅');

      provider.waitForTransaction(result).then(() => {
        setTxMined(true);
      }).catch((e) => {
        setLoading(false);
        setErrorMessage({
          title: 'Unable to validate transaction mined',
          body: 'Error was: ' + e.message,
        })
      });
    } catch (e: any) {
      setLoading(false);
      setErrorMessage({
        title: 'Unable to submit proof',
        body: 'Error was: ' + e.message,
      })
    }
  }

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Someone won, check out https://mumbai.polygonscan.com/tx/${endRoundTxHash}#eventlog`
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
  }

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
              title="Find winner!"
              onPress={submitProof}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <Text>{status}</Text>
          </View>
          {loading && (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator />
            </View>
          )}
          {endRoundTxHash && (
            <>
              <View style={{ marginTop: 12 }}>
                <Text>{endRoundTxHash}</Text>
              </View>
              {winner !== 0 &&
                winner === 1 ? (
                <View style={{ marginTop: 12 }}>
                  <Text>You won!</Text>
                </View>
              ) : (
                <View style={{ marginTop: 12 }}>
                  <Text>You lost!</Text>
                </View>
              )
              }
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
// Someone won, check out https://mumbai.polygonscan.com/tx/0x3ccdee26405cf5687096dd279911a82d33dfeba0582958e1d8ec3e00efab1a16#eventlog
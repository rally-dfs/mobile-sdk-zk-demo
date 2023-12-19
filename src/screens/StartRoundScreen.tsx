/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Share, Text, View } from 'react-native';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { RlyNetwork } from '../../App';
import ScreenContainer from '../components/ScreenContainer';
import StandardButton from '../components/StandardButton';
import { StandardHeader } from '../components/StandardHeader';
import { account as accountState, errorMessage } from '../state';
import { useProofGen } from '../hooks/useProofGen';
import { BigNumber } from 'ethers';
import { getProvider, getRPSContract, getSecretFromNonce, shareNewRound } from '../utils';
import { RPS } from '../contracts/RPS';
import { GsnTransactionDetails } from '@rly-network/mobile-sdk/lib/typescript/gsnClient/utils';
import { Move } from './types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../components/AppRouting';

type Props = NativeStackScreenProps<RootStackParamList, 'StartRound'>;

export default function StartRoundScreen({ }: Props) {
  const rps = getRPSContract();
  const provider = getProvider();
  const [loading, setLoading] = useState(false);
  const [txMined, setTxMined] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState('');
  const [move, setMove] = useState<Move>(null);
  const [roundId, setRoundId] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [secret, setSecret] = useState(0n);
  const [moveAttestation, setMoveAttestation] = useState('');
  const [proof, setProof] = useState<BigInt[]>([]);
  const [account] = useRecoilState(accountState);
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
      setStatus('Getting nonce from network...');
      if (!account) {
        throw new Error('No account found');
      }

      const nonce = (await rps.getNonce(account)).toNumber();

      setNonce(nonce);

      const newSecret = await getSecretFromNonce(nonce);
      setSecret(newSecret);

      setStatus('Getting nonce from network...✅');
    }

    getChainData().catch((e) => {
      setErrorMessage({
        title: 'Unable to get chain data',
        body: 'Error was: ' + e.message,
      });
    });
  }, []);

  useEffect(() => {
    if (!txMined) {
      return;
    }

    const getChainData = async () => {
      appendStatus('Waiting for mining...');
      setLoading(true);
      const receipt = await provider.getTransactionReceipt(txHash);

      const logs = receipt.logs.filter((x) => x.address === rps.address && x).map((x) => rps.interface.parseLog(x));
      if (logs.length === 0) {
        throw new Error('No logs found');
      }
      const log = logs[0];

      if (log.name !== 'RoundStarted') {
        throw new Error('No RoundStarted event found');
      }

      const newRoundId = log.args.roundId as BigNumber;
      setRoundId(newRoundId.toNumber());

      appendStatus('Waiting for mining...✅');
      setLoading(false);
    }

    getChainData().catch((e) => {
      setErrorMessage({
        title: 'Unable to get chain data',
        body: 'Error was: ' + e.message,
      });
    })
  }, [txMined]);

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
        from: account || "",
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

      setTxHash(result);

      setLoading(false);
      appendStatus('Submitting to chain...✅');

      provider.waitForTransaction(result).then(() => {
        setTxMined(true);
      }).catch((e) => {
        setLoading(false);
        setErrorMessage({
          title: 'Unable to validate transaction mined',
          body: 'Error was: ' + e.message,
        })
      })
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
      shareNewRound(roundId);
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
          {roundId !== 0 && (
            <>
              <View style={{ marginTop: 12 }}>
                <Text>You started Round #{roundId}.</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <StandardButton
                  title="Invite an opponent to play"
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

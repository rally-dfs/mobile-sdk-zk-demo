/* eslint-disable react-native/no-inline-styles */
import { getAccount } from '@rly-network/mobile-sdk';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Share, Text, View } from 'react-native';
import { useSetRecoilState } from 'recoil';
import { RlyNetwork } from '../../App';
import ScreenContainer from '../components/ScreenContainer';
import StandardButton from '../components/StandardButton';
import { StandardHeader } from '../components/StandardHeader';
import { errorMessage } from '../state';
import { BigNumber } from 'ethers';
import { getProvider, getRPSContract } from '../utils';
import { RPS } from '../contracts/RPS';
import { GsnTransactionDetails } from '@rly-network/mobile-sdk/lib/typescript/gsnClient/utils';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Move } from './types';
import { RootStackParamList } from '../components/AppRouting';


type Props = NativeStackScreenProps<RootStackParamList, 'Move2'>;

export default function Move2Screen({ route, navigation }: Props) {
  const provider = getProvider();
  const rps = getRPSContract();
  const { txHash } = route.params;
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [move, setMove] = useState<Move>(null);
  const [move2TxHash, setMove2TxHash] = useState('');
  const [account, setAccount] = useState('');
  const [roundId, setRoundId] = useState(0);
  const setErrorMessage = useSetRecoilState(errorMessage);

  const appendStatus = (newStatus: string) => {
    setStatus(status + "\n" + newStatus);
  }

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

      if (log.name !== 'RoundStarted') {
        throw new Error('No RoundStarted event found');
      }

      const roundId = log.args.roundId as BigNumber

      setRoundId(roundId.toNumber());

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
    if (move === null || !txHash || txHash === '') {
      return;
    }

    const submitToChain = async () => {
      setLoading(true);
      appendStatus('Submitting to chain...');

      const params: RPS.Move2ParamsStruct = {
        roundId,
        move: BigNumber.from(move),
        permitDeadline: 0,
        permitV: 0,
        permitR: '0x0000000000000000000000000000000000000000000000000000000000000000',
        permitS: '0x0000000000000000000000000000000000000000000000000000000000000000'
      };
      const tx = await rps.populateTransaction.submitMove2(params);

      const gas = await rps.estimateGas.submitMove2(params, {
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
        setMove2TxHash(result);
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

  }, [roundId, move]);

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `I played my move, time to finish up and reveal the winner. rlyrps://finish/${move2TxHash}`
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
          <View style={{ marginTop: 12 }}>
            <Text>{status}</Text>
          </View>
          {loading && (
            <View style={{ marginTop: 12 }}>
              <ActivityIndicator />
            </View>
          )}
          {move2TxHash && (
            <>
              <View style={{ marginTop: 12 }}>
                <Text>{move2TxHash}</Text>
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

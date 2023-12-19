/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import InfoButton from '../components/InfoButton';
import ScreenContainer from '../components/ScreenContainer';
import StandardButton from '../components/StandardButton';
import { StandardHeader } from '../components/StandardHeader';
import { useNavigation } from '@react-navigation/native';
import { getRPSContract, moveToEmoji, shareNewRound } from '../utils';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { account as accountState, errorMessage } from '../state';
import { RPS } from '../contracts/RPS';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BigNumber } from 'ethers';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../components/AppRouting';

type Round = {
  player1: string;
  player2: string;
  move1Attestation: BigNumber;
  wager: BigNumber;
  nonce: number;
  maxRoundTime: BigNumber;
  startedAt: BigNumber;
  move2PlayedAt: BigNumber;
  move1: number;
  move2: number;
  winner: number;
  ended: boolean;
  roundId: number
}

type ItemProps = {
  index: number;
  title: string;
  onPress?: () => void;
  subTitle?: string;
  buttonText?: string
  showButton?: boolean;
};

const Round = ({ index, onPress, title, subTitle, buttonText, showButton }: ItemProps) => (
  <View
    style={{
      flexDirection: 'row',
      flex: 1,
      alignItems: 'stretch',
      paddingHorizontal: 12,
      height: 100,
    }}>
    <Text style={{
      width: 120,
      fontSize: 64,
      flexGrow: 1,
      alignSelf: 'center',
    }}>#{index}</Text>
    <View
      style={{
        alignItems: 'center',
        alignSelf: 'center',
        width: 'auto',
        flexGrow: 1,
      }}>
      <Text>{title}</Text>
      {subTitle && <Text>{subTitle}</Text>}
      {showButton && (
        <View style={{ marginTop: 12 }}>
          <StandardButton
            title={buttonText || ''}
            onPress={() => onPress && onPress()}
          />
        </View>
      )}
    </View>
  </View>
);

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function LogoScreen({ navigation }: Props) {
  const rps = getRPSContract();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(false);
  const [account] = useRecoilState(accountState);
  const setErrorMessage = useSetRecoilState(errorMessage);

  const getChainData = async () => {
    try {
      setLoading(true);
      const newRounds = await rps.getRounds();
      const roundsWithId: Round[] = newRounds.map((round, index) => ({ ...round, roundId: index }))
      const playerRounds = roundsWithId.filter((r) => r.player1 === account || r.player2 === account);

      setRounds(playerRounds);
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      setErrorMessage({
        title: 'Unable to get chain data',
        body: 'Error was: ' + e.message,
      });
    }
  }

  useEffect(() => {
    getChainData()
  }, []);

  const onShare = async (roundId: number) => {
    try {
      shareNewRound(roundId);
    } catch (e: any) {
      setErrorMessage({
        title: 'Unable to share move',
        body: 'Error was: ' + e.message,
      });
    }
  };

  const renderRound = ({ item, index }: { item: Round, index: number }) => {
    const round = item;
    const player1 = round.player1 === account ? 'You' : round.player1.substring(0, 6) + '...';
    let player2 = round.player2 === account ? 'You' : round.player2.substring(0, 6) + '...';


    if (round.player1 === round.player2) {
      player2 = 'Yourself';
    }

    if (round.ended) {
      const winnerAccount = round.winner === 1 ? round.player1 : round.player2;
      const title = `${player1} (${moveToEmoji(round.move1)}) vs ${player2} (${moveToEmoji(round.move2)})`;
      const subTitle = winnerAccount === account ? 'You won!' : winnerAccount.substring(0, 6) + '... won!';

      return (<Round index={round.roundId} title={title} subTitle={subTitle} />);
    }

    if (round.move2PlayedAt.toNumber() !== 0 && !round.ended) {
      if (round.player1 === account) {
        const title = "End round to find winner";
        const buttonText = 'End round';

        return (
          <Round
            index={round.roundId}
            onPress={() => {
              navigation.navigate('EndRound', { roundId: round.roundId });
            }}
            title={title}
            showButton={true}
            buttonText={buttonText}
          />
        );
      } else {
        const title = `Waiting for ${round.player1.substring(0, 6) + '...'} to end round`;

        return (<Round index={round.roundId} title={title} />);
      }
    }

    const title = "Waiting for opponent";
    const buttonText = 'Invite opponent'

    return (
      <Round
        index={round.roundId}
        onPress={() => {
          onShare(round.roundId)
        }}
        title={title}
        showButton={true}
        buttonText={buttonText}
      />
    );
  }

  return (
    <>
      <StandardHeader />
      <FlatList
        data={rounds}
        onRefresh={getChainData}
        refreshing={loading}
        renderItem={renderRound}
        keyExtractor={round => `${round.roundId}`}
        ListEmptyComponent={() => (<Text style={{ fontSize: 24, marginTop: 12 }}>No rounds yet</Text>)}
        ItemSeparatorComponent={() => <View style={{ margin: 12, height: 1, backgroundColor: 'gray' }} />}
        ListHeaderComponent={() => (
          <View
            style={{
              alignItems: 'center',
              alignSelf: 'center',
              marginBottom: 12,
            }}>
            <StandardButton
              title="Start a new round"
              onPress={() => {
                navigation.navigate('StartRound');
              }}
            />
            <Text style={{ fontSize: 24, marginTop: 12 }}>Your rounds: </Text>
          </View>
        )
        }
      />
      <InfoButton>
        <InfoContent />
      </InfoButton>
    </>
  );
}

function InfoContent() {
  return (
    <>
      <Text>This is a demo zero-knowledge game of Rock Paper Scissors.</Text>
      <Text style={{ marginTop: 18 }}>
        Unlike regular in person RPS we need to play with 3 distinct phases.
      </Text>
      <Text style={{ marginTop: 18 }}>
        Phase 1: Choose a move to start a new round. This creates a zero knowledge
        proof of your move and stores it on the blockchain without revealing what
        your move was.
      </Text>
      <Text style={{ marginTop: 18 }}>
        Phase 2: Respond to a challenge. This is submitted to the blockchain
        in the clear since there is no reason to hide your move from your
        original opponent. Their move has already been set in stone.
      </Text>
      <Text style={{ marginTop: 18 }}>
        Phase 3: The original player that started the round must now reveal
        their move. This is done by submitting another zero knowledge proof
        along with move 1 to the blockchain proving that you were originator
        of the first roundof play.
      </Text>
      <Text style={{ marginTop: 18 }}>
        There is now enough information on the blockchain to determine the
        winner and the results can be viewed by all players.
      </Text>
      <Text style={{ marginTop: 18 }}>Learn more at devproperly.com</Text>
    </>
  );
}

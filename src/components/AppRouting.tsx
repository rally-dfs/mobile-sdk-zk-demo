import React, { useEffect, useState } from 'react';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
//@ts-ignore
import {
  createAccount as createRlyAccount,
  getAccount
} from '@rly-network/mobile-sdk';
import ScreenContainer from './ScreenContainer';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import LogoScreen from '../screens/LogoScreen';
import { useRecoilState } from 'recoil';
import { account } from '../state';
import StartRoundScreen from '../screens/StartRoundScreen';
import Move2Screen from '../screens/Move2Screen';
import EndRoundScreen from '../screens/EndRoundScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SeedPhraseScreen from '../screens/SeedPhraseScreen';

export type RootStackParamList = {
  Home: undefined;
  StartRound: undefined;
  Profile: undefined;
  Seed: undefined;
  Move2: { roundId: number };
  EndRound: { roundId: number };
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["rlyrps://"],
  config: {
    initialRouteName: 'Home',
    screens: {
      Move2: 'play/:roundId',
      EndRound: 'finish/:roundId',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
export default function AppRouting() {
  const [hasLoadedAccount, setHasLoadedAccount] = useState(false);
  const [act, setAct] = useRecoilState(account);

  useEffect(() => {
    const loadAccount = async () => {
      let rlyAccount = await getAccount();

      setHasLoadedAccount(true);

      if (!rlyAccount) {
        await createRlyAccount();
        rlyAccount = await getAccount();
      }

      setAct(rlyAccount);
    };
    loadAccount();
  }, [setAct]);

  if (!hasLoadedAccount) {
    return (
      <ScreenContainer>
        <View style={styles.loadingScreenContainer}>
          <ActivityIndicator />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      {hasLoadedAccount && act && (
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{ headerShown: false }}>
          <Stack.Screen name="StartRound" component={StartRoundScreen} />
          <Stack.Screen name="EndRound" component={EndRoundScreen} />
          <Stack.Screen name="Move2" component={Move2Screen} />
          <Stack.Screen name="Home" component={LogoScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Seed" component={SeedPhraseScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

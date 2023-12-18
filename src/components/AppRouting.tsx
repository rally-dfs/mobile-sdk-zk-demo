import React, { useEffect, useState } from 'react';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
//@ts-ignore
import { getAccount } from '@rly-network/mobile-sdk';
import ScreenContainer from './ScreenContainer';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppAccountSignupScreen from '../screens/AppAccountSignupScreen';
import ClaimScreen from '../screens/ClaimScreen';
import LandingScreen from '../screens/LandingScreen';
import LogoScreen from '../screens/LogoScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SeedPhraseScreen from '../screens/SeedPhraseScreen';
import { useRecoilState } from 'recoil';
import { account } from '../state';
import StartRoundScreen from '../screens/StartRoundScreen';
import Move2Screen from '../screens/Move2Screen';
import EndRoundScreen from '../screens/EndRoundScreen';

export type RootStackParamList = {
  Home: undefined;
  StartRound: undefined;
  Move2: { txHash: string };
  EndRound: { txHash: string };
};

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["rlyrps://"],
  config: {
    initialRouteName: 'Home',
    screens: {
      Move2: 'play/:txHash',
      EndRound: 'finish/:txHash',
    },
  },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
export default function AppRouting() {
  const [hasLoadedAccount, setHasLoadedAccount] = useState(false);
  const [act, setAct] = useRecoilState(account);

  useEffect(() => {
    const loadAccount = async () => {
      const rlyAccount = await getAccount();

      setHasLoadedAccount(true);

      if (!rlyAccount) {
        return;
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

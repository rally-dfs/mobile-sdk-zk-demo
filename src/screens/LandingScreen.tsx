/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
// import fastfile from 'fastfile';
import ScreenContainer from '../components/ScreenContainer';
import StandardButton from '../components/StandardButton';
//@ts-ignore Need to address this on the actual SDK repo.
import { createAccount, getAccount } from '@rly-network/mobile-sdk';
import { useRecoilState } from 'recoil';
import { account } from '../state';
import InfoButton from '../components/InfoButton';
import { useProofGen } from '../hooks/useProofGen';
import { BigNumber } from 'ethers';
import { base64 } from 'ethers/lib/utils';

export default function LandingScreen(): JSX.Element {
  const navigation = useNavigation();
  const [takingAction, setTakingAction] = useState(false);
  const [, setRlyAccount] = useRecoilState(account);

  const setupAccount = async () => {
    setTakingAction(true);

    await createAccount();
    const act = await getAccount();

    setRlyAccount(act);

  };

  return (
    <>
      <ScreenContainer>
        <View style={styles.welcomeContainer}>
          <Text>🪨📄✂️</Text>
          <Image
            source={require('../../assets/images/black-logo.png')}
            style={styles.logoImage}
          />
          <View style={{ marginTop: 96 }}>
            <View style={{ marginTop: 12 }}>
              <StandardButton
                title="Setup"
                onPress={setupAccount}
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <StandardButton
                title="Start a new round"
                onPress={() => {
                  //@ts-ignore
                  navigation.navigate('StartRound');
                }}
              />
            </View>
          </View>
          {takingAction && (
            <View style={{ marginTop: 32 }}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      </ScreenContainer>
      <InfoButton>
        <>
          <Text>
            Developers have control over: 1) when to create a crypto account,
            and, 2) whether to link it to an app level account.{' '}
          </Text>
          <Text style={{ marginTop: 18 }}>
            ‘Sign up with app’ allows users to create an app level account.
            Developers can choose when to create a crypto account and map it to
            the app account.
          </Text>
          <Text style={{ marginTop: 18 }}>
            ‘Continue as guest’ allows users to engage with the app without
            signing up. Developers can choose to create a crypto account and map
            it to an app UUID or use the public key as the identifier.
          </Text>
        </>
      </InfoButton>
    </>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 243,
    height: 243,
  },
});

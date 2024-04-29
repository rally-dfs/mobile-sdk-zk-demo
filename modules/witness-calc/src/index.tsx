import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-witness-calc' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const WitnessCalc = NativeModules.WitnessCalc
  ? NativeModules.WitnessCalc
  : new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  );

export function calculateAttestValidMoveWitness(datPath: string, jsonString: string): Promise<string> {
  return WitnessCalc.calculateAttestValidMoveWitness(datPath, jsonString);
}
export function calculateRevealMoveWitness(datPath: string, jsonString: string): Promise<string> {
  return WitnessCalc.calculateRevealMoveWitness(datPath, jsonString);
}

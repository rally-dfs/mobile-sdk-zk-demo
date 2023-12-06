import * as React from 'react';
import { Image } from 'react-native';
import { GenericCircuitInput, useWasmCircomRuntime } from './useWasmCircomRuntime';
import { useZkey } from './useZkey';
import NativeSampleModule from '../../tm/NativeSampleModule';

type State = Readonly<
  | { loading: true }
  | { loading: false; result: number[] }
  | { loading: false; error: Error }
>;

const prove = (wtnsBin: number[], zkeyBytes: number[]): Promise<string[]> => new Promise<string[]>((resolve, reject) => {
  setTimeout(() => {
    try {
      const proof = NativeSampleModule.prove(wtnsBin, zkeyBytes);
      resolve(proof);
    } catch (e) {
      reject(e);
    }
  });
});

export function useProofGen<CircuitInput extends GenericCircuitInput>(wasmModId: number, zkeyModId: number, numSignals: number) {
  const { calculateWTNSBin } = useWasmCircomRuntime<CircuitInput>(wasmModId);
  const zkey = useZkey(zkeyModId);

  const zkeyResult = 'result' in zkey ? zkey.result : undefined;
  const error = 'error' in zkey ? zkey.error : undefined;

  const calculateProof = React.useCallback(
    async (input: CircuitInput, sanityCheck: number = 0) => {
      if (!zkeyResult) throw new Error('Not ready to calculate.');

      const { witness, publicSignals } = calculateWTNSBin(input, numSignals);

      const proofStrings = await prove(Array.from(witness), zkeyResult);
      const proof = proofStrings.map((s) => BigInt(s));

      return { proof, publicSignals };
    },
    [calculateWTNSBin, zkey]
  );

  return { calculateProof };
}


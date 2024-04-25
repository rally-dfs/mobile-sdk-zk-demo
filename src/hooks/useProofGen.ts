import * as React from 'react';
import { GenericCircuitInput, useWasmCircomRuntime } from './useWasmCircomRuntime';
import { base64 } from 'ethers/lib/utils';
import { groth16ProveWithZKeyFilePath } from '@iden3/react-native-rapidsnark';

export type Proof = {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
};

export function useProofGen<CircuitInput extends GenericCircuitInput>(wasmModId: number, zkeyPath: string, numSignals: number) {
  const { calculateWTNSBin, error } = useWasmCircomRuntime<CircuitInput>(wasmModId);

  const calculateProof = React.useCallback(
    async (input: CircuitInput, sanityCheck: number = 0) => {
      
      const witnessResults = calculateWTNSBin(input, numSignals);
      const b64Witness = base64.encode(witnessResults);

      const {proof: proofJsonString, pub_signals: publicSignalsJsonString} = await groth16ProveWithZKeyFilePath(zkeyPath, b64Witness);
      
      const proofObj: Proof = JSON.parse(proofJsonString);
      const publicSignals: string[] = JSON.parse(publicSignalsJsonString);

      const proof: string[] = [];
      proof.push(proofObj.pi_a[0]);
      proof.push(proofObj.pi_a[1]);
      proof.push(proofObj.pi_b[0][1]);
      proof.push(proofObj.pi_b[0][0]);
      proof.push(proofObj.pi_b[1][1]);
      proof.push(proofObj.pi_b[1][0]);
      proof.push(proofObj.pi_c[0]);
      proof.push(proofObj.pi_c[1]);

      return { proof, publicSignals };
    },
    [calculateWTNSBin, zkeyPath, numSignals]
  );

  return { calculateProof };
}


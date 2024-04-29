import * as React from 'react';
import { groth16ProveWithZKeyFilePath } from '@iden3/react-native-rapidsnark';

export type GenericCircuitInput = {
  readonly [key: string]: string;
}

type Proof = {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
};

export function useProofGen<CircuitInput extends GenericCircuitInput>(datPath: string, zkeyPath: string, calcWitness: (datPath: string, input: string) => Promise<string>) {
  const calculateProof = React.useCallback(
    async (input: CircuitInput) => {
      
      const b64Witness = await calcWitness(datPath, JSON.stringify(input));

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
    [datPath, zkeyPath, calcWitness]
  );

  return { calculateProof };
}


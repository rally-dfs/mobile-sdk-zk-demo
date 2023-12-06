import * as React from 'react';
import * as WebAssembly from 'react-native-webassembly';

import { useWasm } from './useWasm';

type Circom = {
  readonly getVersion: () => number;
  readonly getFieldNumLen32: () => number;
  readonly getRawPrime: () => number;
  readonly getInputSize: () => number;
  readonly getWitnessSize: () => number;
  readonly init: (shouldSanityCheck: number) => undefined;
  readonly getInputSignalSize: (a: number, b: number) => number;
  readonly readSharedRWMemory: (a: number) => number;
  readonly writeSharedRWMemory: (a: number, b: number) => undefined;
  readonly setInputSignal: (a: number, b: number, c: number) => undefined;
  readonly getWitness: (a: number) => undefined;
};

export type GenericCircuitInput = {
  readonly [key: string]: BigInt;
};

function fnvHash(str: string) {
  const uint64_max = 18446744073709551616n;
  let hash = 0xCBF29CE484222325n;

  for (var i = 0; i < str.length; i += 1) {
    hash ^= BigInt(str[i].charCodeAt(0));
    hash *= 0x100000001b3n;
    hash %= uint64_max;
  }

  let shash = hash.toString(16);
  let n = 16 - shash.length;

  shash = '0'.repeat(n).concat(shash);

  return shash;
}

function flatArray(a: unknown) {
  if (Array.isArray(a)) return [...a];

  return [a];
}

function fromArray32(arr: Uint32Array): BigInt {
  //returns a BigInt
  var res = 0n;
  const radix = 0x100000000n;
  for (let i = 0; i < arr.length; i++) {
    res = res * radix + BigInt(arr[i]);
  }
  return res;
}

function toArray32(rem: bigint, size: number) {
  const res = [];
  const radix = BigInt(0x100000000);
  while (rem) {
    res.unshift(Number(rem % radix));
    rem = rem / radix;
  }
  if (size) {
    var i = size - res.length;
    while (i > 0) {
      res.unshift(0);
      i--;
    }
  }
  return res;
}

function normalize(n: bigint, prime: bigint) {
  let res = BigInt(n) % prime;
  if (res < 0) res += prime;
  return res;
}

const calculateWTNSBinInternal = ({
  circom,
  input,
  sanityCheck,
  prime,
}: {
  readonly circom: Circom;
  readonly input: GenericCircuitInput;
  readonly sanityCheck: number;
  readonly prime: BigInt;
}) => {
  circom.init(sanityCheck);

  const n32 = circom.getFieldNumLen32();

  var input_counter = 0;

  for (const key of Object.keys(input)) {
    const h = fnvHash(key);
    const hMSB = parseInt(h.slice(0, 8), 16);
    const hLSB = parseInt(h.slice(8, 16), 16);
    const fArr = flatArray(input[key]);

    for (let i = 0; i < fArr.length; i++) {
      const arrFr = toArray32(fArr[i], n32)
      for (let j = 0; j < n32; j++) {
        circom.writeSharedRWMemory(j, arrFr[n32 - 1 - j]);
      }
      try {
        circom.setInputSignal(hMSB, hLSB, i);
        input_counter++;
      } catch (err) {
        // console.log(`After adding signal ${i} of ${key}`)
        throw new Error(err as string);
      }
    }

  }

  if (input_counter < circom.getInputSize()) {
    throw new Error(`Not all inputs have been set. Only ${input_counter} out of ${circom.getInputSize()}`);
  }
};

export function useWasmCircomRuntime<CircuitInput extends GenericCircuitInput>(wasmBuf: Uint8Array | ArrayBuffer | number) {
  const wasm = useWasm<Circom>(
    wasmBuf,
    React.useMemo(
      () => ({
        env: {
          // https://github.com/iden3/circom_runtime/blob/f9de6f7d6efe521b5df6775258779ec9032b5830/js/witness_calculator.js#L27
          memory: new WebAssembly.Memory({ initial: 32767 }),
        },
        runtime: {
          exceptionHandler(value: number) {
            console.warn('got exception', value);
          },
        },
      }),
      []
    )
  );

  const result = 'result' in wasm ? wasm.result : undefined;
  const error = 'error' in wasm ? wasm.error : undefined;

  const calculateWTNSBin = React.useCallback(
    (input: CircuitInput, numSignals: number = 0, sanityCheck: number = 0) => {
      if (!result) throw new Error('Not ready to calculate.');

      const circom: Circom = result.instance.exports;

      const n32 = circom.getFieldNumLen32();
      const witnessSize = circom.getWitnessSize();

      circom.getRawPrime();

      const arr = new Uint32Array(n32);

      for (let i = 0; i < n32; i += 1) {
        arr[n32 - 1 - i] = circom.readSharedRWMemory(i);
      }

      const prime = fromArray32(arr);

      calculateWTNSBinInternal({ circom, input, sanityCheck, prime });

      const buff32 = new Uint32Array(witnessSize * n32);
      const buff = new Uint8Array(buff32.buffer);
      let pos = 0;


      for (let i = 0; i < witnessSize; i++) {
        circom.getWitness(i);
        for (let j = 0; j < n32; j++) {
          buff32[pos + j] = circom.readSharedRWMemory(j);
        }
        pos += n32;
      }

      const publicSignals: BigInt[] = [];

      for (let i = 0; i < numSignals; i++) {
        const signalArr = new Uint32Array(n32);

        for (let j = n32 * (1 + i); j < n32 * (2 + i); j += 1) {
          signalArr[n32 - 1 - j % n32] = buff32[j];
        }

        const signal = fromArray32(signalArr);
        publicSignals.push(signal);
      }

      return { witness: buff, publicSignals };
    },
    [result]
  );

  return { calculateWTNSBin, error };
}

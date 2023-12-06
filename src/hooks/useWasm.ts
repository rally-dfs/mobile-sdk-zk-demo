import * as React from 'react';
import * as WebAssembly from 'react-native-webassembly';
import type { WebassemblyInstantiateResult } from 'react-native-webassembly';

type State<Exports extends object> = Readonly<
  | { loading: true }
  | { loading: false; result: WebassemblyInstantiateResult<Exports> }
  | { loading: false; error: Error }
>;

export function useWasm<Exports extends object>(
  wasmBuf: Uint8Array | ArrayBuffer | number,
  importObject: WebAssembly.WebAssemblyImportObject | undefined = undefined
): State<Exports> {
  const [state, setState] = React.useState<State<Exports>>({
    loading: true,
  });

  React.useEffect(
    () =>
      void (async () => {
        try {
          setState({
            loading: false,
            result: await WebAssembly.instantiate<Exports>(
              wasmBuf,
              importObject
            ),
          });
        } catch (cause) {
          setState({
            loading: false,
            error: new Error(
              `Failed to instantiate.`
            ),
          });
        }
      })(),
    [wasmBuf, importObject]
  );

  return state;
}

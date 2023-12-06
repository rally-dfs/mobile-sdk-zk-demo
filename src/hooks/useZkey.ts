import * as React from 'react';
import { Image } from 'react-native';

type State = Readonly<
  | { loading: true }
  | { loading: false; result: number[] }
  | { loading: false; error: Error }
>;

const fetchRequire = async (moduleId: number): Promise<ArrayBuffer> => {
  const maybeAssetSource = Image.resolveAssetSource(moduleId);

  const maybeUri = maybeAssetSource?.uri;

  if (typeof maybeUri !== 'string' || !maybeUri.length)
    throw new Error(
      `Expected non-empty string uri, encountered "${String(maybeUri)}".`
    );

  return await (await fetch(maybeUri)).arrayBuffer();
}

export function useZkey(
  zkeyModuleId: number,
): State {
  const [state, setState] = React.useState<State>({
    loading: true,
  });

  React.useEffect(
    () =>
      void (async () => {
        try {
          setState({
            loading: false,
            result: Array.from(new Uint8Array(await fetchRequire(zkeyModuleId))),
          });
        } catch (cause) {
          setState({
            loading: false,
            error: new Error(
              `Failed to load zkey from module id ${zkeyModuleId}.`
            ),
          });
        }
      })(),
    [zkeyModuleId]
  );

  return state;
}

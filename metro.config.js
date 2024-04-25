const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const defaultAssetExts = require("metro-config/src/defaults/defaults").assetExts;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    assetExts: [
      ...defaultAssetExts, // <- array spreading defaults
      'wasm',
      'zkey',
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
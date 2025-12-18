const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Allow bundling expo-sqlite's web worker wasm
config.resolver.assetExts.push("wasm");

module.exports = config;

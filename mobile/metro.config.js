// Expo's default Metro config already supports npm workspaces: it watches
// the monorepo root and resolves hoisted packages such as @buggybooks/contracts.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);

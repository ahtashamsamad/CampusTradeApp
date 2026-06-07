const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves the compiled build of `expo-router` (JS runtime
// exports) instead of attempting to load TypeScript source files. This
// prevents runtime export errors for type-only exports (eg. ErrorBoundaryProps)
// and avoids dynamic require.context arguments coming from env vars.
const expoRouterBuild = path.resolve(
	__dirname,
	"node_modules",
	"expo-router",
	"build"
);

config.resolver = {
	...(config.resolver || {}),
	// Map `expo-router` to its compiled build folder so Metro picks up
	// runtime JS instead of TypeScript sources.
	extraNodeModules: {
		...(config.resolver && config.resolver.extraNodeModules ? config.resolver.extraNodeModules : {}),
		"expo-router": expoRouterBuild,
	},
	// Add common ESM/CJS extensions to be safe.
	sourceExts: Array.from(new Set([...(config.resolver && config.resolver.sourceExts ? config.resolver.sourceExts : []), "cjs", "mjs"])),
};

// Keep nativewind wrapper for Tailwind processing.
module.exports = withNativeWind(config, { input: "./global.css" });

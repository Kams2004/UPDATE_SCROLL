module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin", // Required for Reanimated
      "@babel/plugin-proposal-export-namespace-from", // Enables `export * as ns from 'module'`
      ["@babel/plugin-transform-runtime", { regenerator: true }], // Optimizes runtime code
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [
            ".ios.ts",
            ".android.ts",
            ".ts",
            ".ios.tsx",
            ".android.tsx",
            ".tsx",
            ".jsx",
            ".js",
            ".json",
          ],
          alias: {
            "@components": "./src/components",
            "@screens": "./src/screens",
            "@navigation": "./src/navigation",
            "@assets": "./assets",
            "@utils": "./src/utils",
            "@hooks": "./src/hooks",
            "@constants": "./src/constants",
          },
        },
      ],
    ],

    env: {
      production: {
        plugins: ["transform-remove-console"], // Removed any unnecessary plugins
      },
    },
  };
};

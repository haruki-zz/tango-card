/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|expo-router|@expo|@supabase|@tanstack|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-web|react-native-worklets)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Supabase Edge Function 测试使用 Deno（npm run test:functions），避免被 Jest 误加载
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/supabase/tests/"],
};

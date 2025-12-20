const path = require('node:path');

require('ts-node').register({
  project: path.resolve(__dirname, '../tsconfig.main.json'),
  transpileOnly: true
});

require(path.resolve(__dirname, '../src/main/main.ts'));

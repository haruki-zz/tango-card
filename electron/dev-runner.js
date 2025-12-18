const path = require('path');

if (!process.env.TS_NODE_PROJECT) {
  process.env.TS_NODE_PROJECT = path.join(__dirname, 'tsconfig.json');
}

// 注册 ts-node 以便在开发模式下直接运行 TS 主进程与预加载脚本
require('ts-node/register/transpile-only');
require('./main.ts');

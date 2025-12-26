# 架构记录

## 阶段状态
- 已完成实施计划第 1 步，完成环境与配置初始化；尚未创建 `src/main` 与 `src/renderer` 代码骨架，后续步骤将搭建 Electron + React/Vite 主/渲染进程。

## 文件作用
- package.json：项目元数据，使用 ESM，声明 Node >=18 要求与 dev/build/lint/test 占位脚本，标记 private 防止误发。
- package-lock.json：npm 锁定文件（目前无运行时依赖）。
- .gitignore：忽略 node_modules、构建产物、日志与环境变量文件，保持仓库干净。
- .env.local：存放 OpenAI/Google 密钥占位，避免读取缺失时报错，默认不提交。
- CLAUDE.md：仓库当前架构快照，描述目录与文件职责，需随架构变更同步。
- AGENTS.md：贡献规范与全局约束的入口说明。
- prompts/coding-style.md：代码风格与开发流程约定。
- prompts/system-prompt.md：系统级工作规范与思考模式。
- memory-bank/design-document.md：产品功能与数据设计说明。
- memory-bank/implementation-plan.md：分步实施计划，当前执行至第 1 步。
- memory-bank/tech-stack.md：技术栈清单与选型理由。
- memory-bank/progress.md：阶段性变更记录，便于交接。
- memory-bank/architecture.md：架构与文件职责记录（本文件），持续更新各阶段的结构洞察。

# 项目架构快照

- 目标：Electron + React/Vite 日语词汇桌面应用，目前完成环境初始化。
- 目录结构：
  - AGENTS.md：贡献与约束规则。
  - prompts/
    - coding-style.md：代码与流程约定。
    - system-prompt.md：系统级工作规范。
  - memory-bank/
    - architecture.md：架构记录，说明阶段状态与各文件职责。
    - design-document.md：产品设计。
    - implementation-plan.md：分步实施计划。
    - progress.md：进度留档。
    - tech-stack.md：技术栈清单。
  - package.json：npm 元数据，Node 要求 >=18，占位脚本（dev/build/lint/test）。
  - package-lock.json：npm 锁定文件（当前无依赖）。
  - .gitignore：忽略 node_modules、构建产物、日志与环境变量文件。
  - .env.local：OpenAI/Google 密钥占位（本地文件，避免读取缺失）。
- 依赖与模块：尚未添加代码或运行时依赖，后续步骤将搭建 Electron + React/Vite 骨架并扩展主/渲染进程。

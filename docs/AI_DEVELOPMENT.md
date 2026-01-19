# AI Development Guidelines

本文档旨在帮助 GitHub Copilot 及其他 AI 辅助工具理解本项目的开发规范、上下文及最佳实践。在执行代码生成任务前，请优先参考本指南。

## 1. 项目核心原则
- **用户友好**：所有 UI 交互必须简洁直观，符合 B 端管理系统操作习惯。
- **类型安全**：必须使用 TypeScript，严禁使用 `any`，所有接口需定义 Interface。
- **组件化**：遵循原子化设计，通用组件放入 `components/ui`，业务组件放入 `components/business`。

## 2. 代码生成规范 (Coding Standards)

### 2.1 前端规范 (Next.js & React)
- **组件定义**：统一使用 Functional Components。
- **样式方案**：仅使用 Tailwind CSS，禁止书写单独的 `.css` / `.scss` 文件（全局样式除外）。
- **数据获取**：
  - 服务端组件：直接使用 `async/await` 调用 DB 方法。
  - 客户端组件：必须使用 `TanStack Query` (useQuery/useMutation) 进行数据交互。
- **表单处理**：复杂表单必须使用 `react-hook-form` + `zod` 进行验证。

### 2.2 后端规范 (API Routes)
- **路径结构**：遵循 RESTful 风格，如 `app/api/vehicles/[id]/route.ts`。
- **错误处理**：统一使用 `lib/response-helper.ts` 中的工具函数返回标准 JSON 格式：
  ```json
  { "success": boolean, "data": any, "error": string | null }
  ```
- **数据库操作**：所有 DB 操作需封装在 `lib/db/services` 中，API 层仅负责参数校验和调用 Service。

## 3. 常用 Prompt 模板 (Prompt Engineering)

当你请求 AI 生成代码时，可以参考以下结构，AI 会理解得更透彻：

### 场景 A：创建新功能模块
> **Prompt**: "我需要添加一个[车辆维修记录]模块。请基于 `docs/AI_DEVELOPMENT.md` 规范：
> 1. 在 `lib/db/models` 定义 Mongoose Schema。
> 2. 创建对应的 Server Actions 或 API Route。
> 3. 使用 ShadcnUI 的 Table 组件在 `app/dashboard/maintenance` 页面实现列表展示。
> 4. 使用 React Hook Form 实现新增记录的弹窗。"

### 场景 B：优化现有组件
> **Prompt**: "请重构 `VehicleCard` 组件。目前代码有点乱，请将其拆分为 Header, Body, Footer 子组件，并确保使用 Tailwind CSS 适配移动端展示。请保持 TypeScript 类型定义完整。"

## 4. 目录结构说明 (Context)

- `/app`: Next.js App Router 页面及 API 路由。
- `/components/ui`: 基础 UI 组件 (Button, Input 等)。
- `/lib/db`: 数据库连接及 Models 定义。
- `/lib/utils`: 通用工具函数。
- `/types`: 全局 TypeScript 类型定义。

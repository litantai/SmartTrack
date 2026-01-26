# SmartTrack 文档中心 (Documentation Hub)

欢迎来到 SmartTrack 项目文档中心。本目录包含所有技术文档、开发指南和项目规划文档。

---

## 📚 文档索引 (Document Index)

### 🎯 项目规划 (Project Planning)

#### [Phase 1 任务拓扑图](./PHASE1_TASK_TOPOLOGY.md) ⭐ **必读**
> **适用对象**: 项目经理、架构师、开发者  
> **内容**:
> - 完整的任务依赖关系 Mermaid 图
> - 25 个 Issue 的详细定义
> - 并行开发策略和时间线估算
> - 每个任务的 Context、Dependencies、Parallelism 和 AC

#### [Phase 1 Issue 汇总](./PHASE1_ISSUE_SUMMARY.md) ⭐ **必读**
> **适用对象**: 开发者、测试人员  
> **内容**:
> - 所有 25 个 Issue 的快速索引
> - 每个 Issue 的简要描述和 AC
> - Issue 创建模板和标签系统
> - 执行摘要和下一步行动

#### [Phase 1 快速参考](./PHASE1_QUICK_REFERENCE.md) 📖 **推荐**
> **适用对象**: 所有开发者  
> **内容**:
> - 可视化图表（饼图、甘特图）
> - Issue 标签系统说明
> - 依赖关系速查表
> - 开发者快速启动清单
> - 风险提示和沟通协作指南

---

### 🛠️ 技术规范 (Technical Specifications)

#### [AI 开发知识库](./AI_DEVELOPMENT.md) ⭐⭐⭐ **核心文档**
> **适用对象**: 所有开发者、AI 辅助工具  
> **内容**:
> - 核心数据模型定义（User, Vehicle, Venue, Booking）
> - 架构分层设计（数据层、服务层、API层、表现层）
> - XState vs Zen Engine 技术分工
> - API 标准规范和错误码定义
> - 开发工作流（文档 → Service → API → UI → 测试）
> - TDD 测试规范和示例

---

### 🔐 认证与权限 (Authentication & Authorization)

#### [认证实现总结](./AUTH_IMPLEMENTATION_SUMMARY.md)
> **适用对象**: 后端开发者  
> **内容**:
> - NextAuth.js v5 配置说明
> - Credentials Provider 实现
> - 密码加密策略
> - Session 管理

#### [认证使用指南](./AUTH_USAGE.md)
> **适用对象**: 前端开发者  
> **内容**:
> - 如何在页面中使用认证
> - 权限检查方法
> - Protected Routes 配置
> - 客户端和服务端认证示例

---

### 🏗️ 架构设计 (Architecture)

#### [认证设计文档](./architecture/auth_design.md)
> **适用对象**: 架构师、高级开发者  
> **内容**:
> - 认证架构设计
> - 角色权限模型（RBAC）
> - 安全策略

*(更多架构文档将在 Phase 1 开发过程中补充)*

---

## 🚀 快速开始 (Quick Start)

### 新加入的开发者

1. **阅读顺序**:
   ```
   README.md (项目根目录)
     ↓
   AI_DEVELOPMENT.md (技术规范)
     ↓
   PHASE1_QUICK_REFERENCE.md (开发指南)
     ↓
   PHASE1_ISSUE_SUMMARY.md (任务列表)
   ```

2. **环境搭建**:
   ```bash
   # 克隆仓库
   git clone https://github.com/litantai/SmartTrack.git
   cd SmartTrack
   
   # 安装依赖
   npm install
   
   # 配置环境变量
   cp .env.example .env.local
   # 编辑 .env.local 填入数据库连接等信息
   
   # 启动开发服务器
   npm run dev
   ```

3. **领取任务**:
   - 查看 [GitHub Issues](https://github.com/litantai/SmartTrack/issues)
   - 选择标记为 `priority:P0` 且无依赖的任务
   - 在 Issue 中评论 "我来负责" 并分配给自己

---

## 📖 文档编写规范 (Documentation Standards)

### 文档命名规范
- 使用大写字母开头的蛇形命名：`PHASE1_TASK_TOPOLOGY.md`
- 功能文档使用小写：`auth_design.md`
- 使用中英文双语标题：`# SmartTrack 文档中心 (Documentation Hub)`

### Markdown 格式要求
- 使用 Mermaid 绘制流程图和架构图
- 代码块必须指定语言：` ```typescript `
- 重要提示使用引用格式：`> **注意**: ...`
- 使用 Emoji 增强可读性（适度）

### 更新责任
- 每个 Issue 完成后，相关开发者需要更新对应文档
- 架构变更需要在 `architecture/` 目录补充文档
- 新增 API 需要更新 API 文档

---

## 🔄 文档版本管理 (Version Control)

所有文档均通过 Git 管理版本：

```bash
# 更新文档
git add docs/
git commit -m "docs: update PHASE1 issue status"
git push origin main

# 查看文档历史
git log -- docs/PHASE1_TASK_TOPOLOGY.md
```

---

## 📞 文档反馈 (Feedback)

如果你发现文档中的错误或需要补充：

1. 在 GitHub 创建 Issue，标签选择 `documentation`
2. 描述问题或建议
3. 如果你可以修复，欢迎提交 PR

---

## 🗂️ 文档目录结构 (Folder Structure)

```
docs/
├── README.md                         # 本文件 - 文档中心索引
├── AI_DEVELOPMENT.md                 # AI 开发知识库（核心）
├── AUTH_IMPLEMENTATION_SUMMARY.md    # 认证实现总结
├── AUTH_USAGE.md                     # 认证使用指南
├── PHASE1_TASK_TOPOLOGY.md          # Phase 1 任务拓扑图
├── PHASE1_ISSUE_SUMMARY.md          # Phase 1 Issue 汇总
├── PHASE1_QUICK_REFERENCE.md        # Phase 1 快速参考
└── architecture/                     # 架构设计文档
    └── auth_design.md                # 认证架构设计
```

*(随着项目推进，将添加更多文档目录，如 `api/`, `deployment/`, `state-diagrams/` 等)*

---

## 🎯 文档路线图 (Documentation Roadmap)

### Phase 1 期间将补充的文档
- [ ] API 接口文档（基于 OpenAPI 规范）
- [ ] 状态机可视化文档（Mermaid 状态图）
- [ ] 部署指南（Docker、Kubernetes）
- [ ] 测试策略文档
- [ ] 性能优化指南
- [ ] 故障排查手册

### 未来规划
- [ ] 用户手册（面向最终用户）
- [ ] 运维手册（监控、日志、备份）
- [ ] 贡献指南（开源协作规范）
- [ ] 安全审计报告

---

**Last Updated**: 2026-01-26  
**Maintained By**: SmartTrack Dev Team  
**Questions?** Contact via GitHub Issues

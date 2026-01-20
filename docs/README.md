# SmartTrack 文档索引

欢迎来到 SmartTrack 项目文档中心！本文档提供了所有文档的快速导航。

## 📚 文档分类

### 🚀 部署相关文档

SmartTrack 使用 GitHub Actions + Vercel 实现自动化部署。以下文档将帮助你理解和配置部署流程：

#### 快速开始
- **[PR6_合并前必读.md](./PR6_合并前必读.md)** 🔴 重要！PR #6 合并前必读
  - 合并前必须完成的配置
  - GitHub Secrets 配置步骤
  - Vercel Token 创建指南
  - 配置检查清单

- **[DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)** ⭐ 推荐首次阅读
  - 5 分钟快速上手指南
  - 最少配置步骤
  - 常见问题速查
  
#### 详细指南
- **[DEPLOYMENT.md](./DEPLOYMENT.md)**
  - 完整的部署文档
  - 详细配置说明
  - 环境变量配置
  - 最佳实践
  - 安全建议

#### 问题解答
- **[DEPLOYMENT_FAQ.md](./DEPLOYMENT_FAQ.md)**
  - 常见问题解答
  - 故障排查指南
  - 部署时间线说明
  - 错误处理方法

- **[PR5_DEPLOYMENT_EXPLANATION.md](./PR5_DEPLOYMENT_EXPLANATION.md)** ⭐ 特别推荐
  - 解答为什么 PR #5 没有自动部署
  - 详细的工作流说明
  - 如何重新部署 PR #5 内容
  - 建议的开发流程

#### 配置指南
- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)**
  - GitHub Secrets 配置步骤
  - Vercel Token 获取方法
  - 安全最佳实践
  - 常见配置问题

#### 可视化
- **[DEPLOYMENT_WORKFLOW_DIAGRAM.md](./DEPLOYMENT_WORKFLOW_DIAGRAM.md)**
  - 部署流程图解
  - 预览环境 vs 生产环境对比
  - GitHub Actions 步骤详解
  - 回滚和故障处理流程图

### 🔐 认证与授权文档

SmartTrack 使用 NextAuth.js v5 实现完整的认证和基于角色的访问控制（RBAC）：

- **[AUTH_USAGE.md](./AUTH_USAGE.md)**
  - 认证 API 使用示例
  - 会话管理
  - 权限检查方法
  - 客户端和服务端用法

- **[AUTH_IMPLEMENTATION_SUMMARY.md](./AUTH_IMPLEMENTATION_SUMMARY.md)**
  - 实现摘要
  - 快速参考指南
  - 测试指南

- **[architecture/auth_design.md](./architecture/auth_design.md)**
  - 完整的认证系统设计文档
  - 技术选型说明
  - 架构设计
  - 安全考虑

### 🤖 AI 开发指南

为 AI 助手和开发者提供的编码规范和最佳实践：

- **[AI_DEVELOPMENT.md](./AI_DEVELOPMENT.md)**
  - 编码标准和规范
  - 提示词指南
  - 项目结构说明
  - 开发工作流

## 🎯 快速导航

### 我想...

#### 合并 PR #6 之前
1. **必读** [PR6_合并前必读.md](./PR6_合并前必读.md) 
2. 完成 [GitHub Secrets 配置](./GITHUB_SECRETS_SETUP.md)
3. 验证配置是否正确

#### 开始部署
1. 阅读 [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)
2. 配置 [GitHub Secrets](./GITHUB_SECRETS_SETUP.md)
3. 参考 [完整部署文档](./DEPLOYMENT.md)

#### 理解为什么 PR #5 没有自动部署
1. 阅读 [PR5_DEPLOYMENT_EXPLANATION.md](./PR5_DEPLOYMENT_EXPLANATION.md)
2. 了解现在的 [部署工作流](./DEPLOYMENT_WORKFLOW_DIAGRAM.md)

#### 排查部署问题
1. 查看 [FAQ](./DEPLOYMENT_FAQ.md)
2. 参考 [故障排查流程图](./DEPLOYMENT_WORKFLOW_DIAGRAM.md#-故障处理流程)
3. 检查 [Secrets 配置](./GITHUB_SECRETS_SETUP.md)

#### 使用认证功能
1. 阅读 [AUTH_USAGE.md](./AUTH_USAGE.md)
2. 参考 [实现摘要](./AUTH_IMPLEMENTATION_SUMMARY.md)
3. 深入理解 [设计文档](./architecture/auth_design.md)

#### 了解项目开发规范
1. 阅读 [AI_DEVELOPMENT.md](./AI_DEVELOPMENT.md)
2. 遵循编码标准
3. 使用推荐的工作流

## 📊 文档统计

- **部署相关**: 7 个文档（包括 PR #6 合并前须知）
- **认证相关**: 3 个文档
- **开发指南**: 1 个文档
- **总计**: 11 个文档

## 🔄 文档更新日志

### 2026-01-20
- ✅ 添加完整的 Vercel 部署文档体系
- ✅ 添加 PR #5 部署问题说明
- ✅ 添加工作流程图解
- ✅ 添加 GitHub Secrets 配置指南

### 2026-01-19
- ✅ 添加认证系统文档
- ✅ 添加 AI 开发指南

## 📝 文档反馈

如果你发现文档有任何问题或建议：

1. 在 GitHub 仓库创建 Issue
2. 使用标签 `documentation`
3. 详细描述问题或建议

## 🤝 贡献文档

欢迎贡献文档改进：

1. Fork 项目
2. 创建文档分支
3. 提交改进
4. 创建 Pull Request

---

**维护者**: SmartTrack 开发团队  
**最后更新**: 2026-01-20

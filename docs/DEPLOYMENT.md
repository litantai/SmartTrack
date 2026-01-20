# Vercel 部署工作流说明

本文档详细说明了 SmartTrack 项目的 Vercel 部署流程、配置和最佳实践。

## 📋 目录

- [部署流程概述](#部署流程概述)
- [自动化部署配置](#自动化部署配置)
- [部署环境说明](#部署环境说明)
- [设置说明](#设置说明)
- [常见问题](#常见问题)
- [最佳实践](#最佳实践)

## 部署流程概述

SmartTrack 使用 **GitHub Actions + Vercel** 实现完全自动化的 CI/CD 部署流程：

### 🔄 自动化流程

```
代码提交 → GitHub Actions 触发 → 构建项目 → 部署到 Vercel → 通知结果
```

### 📦 两种部署场景

#### 1. 预览环境（Preview Deployment）
- **触发条件**: 创建或更新 Pull Request
- **部署目标**: Vercel 预览环境
- **访问地址**: 自动生成的预览 URL（如 `https://smart-track-git-feature-xxx.vercel.app`）
- **用途**: 
  - 在合并到主分支前测试新功能
  - 代码审查时查看实际效果
  - 与团队成员分享开发进度

#### 2. 生产环境（Production Deployment）
- **触发条件**: 代码合并到 `main` 分支
- **部署目标**: Vercel 生产环境
- **访问地址**: 项目主域名（如 `https://smart-track-nine.vercel.app`）
- **用途**: 
  - 正式对外发布的版本
  - 稳定可靠的服务

## 自动化部署配置

项目使用 GitHub Actions 实现自动化部署，配置文件位于 `.github/workflows/vercel-deploy.yml`。

### 工作流程详解

1. **代码检出**: 获取最新代码
2. **环境准备**: 安装 Node.js 和 Vercel CLI
3. **拉取配置**: 从 Vercel 获取项目配置
4. **构建项目**: 执行 Next.js 构建
5. **部署项目**: 推送到 Vercel
6. **通知结果**: PR 评论通知（仅预览环境）

### 触发条件

```yaml
on:
  push:
    branches:
      - main          # 推送到 main 分支 → 生产部署
  pull_request:
    branches:
      - main          # 针对 main 的 PR → 预览部署
```

## 部署环境说明

### 🌍 生产环境（Production）

- **触发**: 合并 PR 到 `main` 分支或直接推送到 `main`
- **特点**:
  - 稳定版本，对外服务
  - 使用生产环境变量
  - 域名固定不变
  - 自动回滚功能（Vercel 控制台）

### 🧪 预览环境（Preview）

- **触发**: 创建或更新 Pull Request
- **特点**:
  - 每个 PR 独立的预览 URL
  - 可以测试多个功能分支
  - PR 关闭后自动清理
  - 使用预览环境变量

### 📊 环境对比

| 特性 | 生产环境 | 预览环境 |
|------|---------|---------|
| 触发方式 | 推送到 main | 创建/更新 PR |
| URL | 固定生产域名 | 动态预览 URL |
| 环境变量 | Production | Preview |
| 数据库 | 生产数据库 | 测试数据库（推荐） |
| 持久性 | 永久 | PR 生命周期 |

## 设置说明

### 前置条件

1. **Vercel 账号**: 
   - 前往 [Vercel](https://vercel.com) 注册账号
   - 关联 GitHub 账号

2. **导入项目**:
   - 在 Vercel 控制台导入 `litantai/SmartTrack` 仓库
   - 选择 Next.js 框架
   - 配置环境变量

### 必需的 GitHub Secrets

在 GitHub 仓库设置中添加以下 Secrets（Settings → Secrets and variables → Actions）：

#### 1. VERCEL_TOKEN
```bash
# 获取方式：
# 1. 访问 https://vercel.com/account/tokens
# 2. 创建新 Token
# 3. 复制并保存为 GitHub Secret
```

#### 2. VERCEL_ORG_ID
```bash
# 获取方式：
# 1. 进入 Vercel 项目设置
# 2. 在 Settings → General 中找到 "Team ID" 或 "Personal Account ID"
# 3. 复制并保存为 GitHub Secret
```

#### 3. VERCEL_PROJECT_ID
```bash
# 获取方式：
# 1. 进入 Vercel 项目设置
# 2. 在 Settings → General 中找到 "Project ID"
# 3. 复制并保存为 GitHub Secret
```

### 环境变量配置

在 Vercel 项目设置中配置环境变量（Settings → Environment Variables）：

#### 生产环境（Production）
```bash
MONGODB_URI=mongodb+srv://...（生产数据库）
NEXTAUTH_SECRET=...（生产密钥）
NEXTAUTH_URL=https://smart-track-nine.vercel.app
```

#### 预览环境（Preview）
```bash
MONGODB_URI=mongodb+srv://...（测试数据库，推荐）
NEXTAUTH_SECRET=...（可以与生产环境不同）
NEXTAUTH_URL=https://your-preview-url.vercel.app
```

## 常见问题

### Q1: PR 合并后为什么没有自动部署到生产环境？

**可能原因**：
1. GitHub Actions workflow 未正确配置
2. Vercel Token 未设置或已失效
3. 构建失败（查看 Actions 日志）

**解决方案**：
1. 检查 `.github/workflows/vercel-deploy.yml` 文件是否存在
2. 验证 GitHub Secrets 是否正确配置
3. 查看 GitHub Actions 运行日志定位问题

### Q2: 可以手动触发部署吗？

**方案 1**: 通过 Vercel 控制台
- 进入项目页面
- 点击 "Redeploy" 按钮

**方案 2**: 通过 GitHub
- 创建空提交：`git commit --allow-empty -m "Trigger deployment"`
- 推送到 main 分支

### Q3: 预览环境可以访问生产数据库吗？

**强烈不建议**！最佳实践：
- 为预览环境配置独立的测试数据库
- 避免测试代码影响生产数据
- 使用数据库副本或 Mock 数据

### Q4: 如何回滚到之前的版本？

在 Vercel 控制台：
1. 进入项目的 Deployments 页面
2. 找到要回滚的部署版本
3. 点击 "Promote to Production" 即可瞬间回滚

### Q5: GitHub Actions 和 Vercel 自动部署有什么区别？

| 特性 | GitHub Actions | Vercel 自动部署 |
|------|----------------|----------------|
| 触发方式 | 推送代码 | 推送代码 |
| 控制力 | 完全可自定义 | Vercel 默认配置 |
| CI/CD 集成 | 可集成测试、Lint 等 | 仅构建部署 |
| 成本 | 使用 GitHub 免费额度 | 使用 Vercel 免费额度 |
| 推荐场景 | 需要自定义 CI 流程 | 简单项目快速部署 |

**我们的选择**: 使用 GitHub Actions 以获得：
- 完整的 CI/CD 控制
- 可扩展的工作流
- 与 GitHub 生态深度集成

## 最佳实践

### ✅ 推荐的工作流程

1. **功能开发**:
   ```bash
   git checkout -b feature/new-feature
   # 开发代码
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **创建 Pull Request**:
   - 在 GitHub 创建 PR
   - 自动触发预览环境部署
   - 查看预览 URL 测试功能

3. **代码审查**:
   - 团队成员审查代码
   - 在预览环境测试功能
   - 确认无问题后 Approve

4. **合并发布**:
   - 合并 PR 到 main 分支
   - 自动触发生产环境部署
   - 验证生产环境功能正常

### 🚫 避免的做法

- ❌ 直接推送到 main 分支（跳过 PR 审查）
- ❌ 预览环境连接生产数据库
- ❌ 不测试就直接合并到 main
- ❌ 忽略构建失败的警告

### 🔒 安全建议

- ✅ 定期轮换 Vercel Token
- ✅ 使用不同的数据库密钥（生产 vs 预览）
- ✅ 启用 Vercel Password Protection（预览环境）
- ✅ 审计部署日志

### 📈 监控建议

- 设置 Vercel 部署通知（Slack/Email）
- 监控 GitHub Actions 运行状态
- 定期检查 Vercel 使用配额
- 设置错误监控（如 Sentry）

## 📚 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [项目 README](../README.md)

## 🆘 获取帮助

遇到问题时：

1. **查看日志**:
   - GitHub Actions: 仓库 → Actions 标签
   - Vercel: 项目 → Deployments → 查看日志

2. **提交 Issue**:
   - 描述问题和复现步骤
   - 附上相关日志截图

3. **联系团队**:
   - 在 PR 中 @相关成员
   - 团队内部沟通渠道

---

**最后更新**: 2026-01-20  
**维护者**: SmartTrack 开发团队

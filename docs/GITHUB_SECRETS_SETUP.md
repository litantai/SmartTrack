# GitHub Secrets 配置指南

## 📋 概述

为了使 GitHub Actions 能够自动部署到 Vercel，需要在 GitHub 仓库中配置以下 Secrets。

## 🔑 必需的 Secrets

### 1. VERCEL_TOKEN

这是最关键的配置，GitHub Actions 需要它来访问 Vercel API。

#### 获取步骤：

1. 登录 [Vercel](https://vercel.com)
2. 点击右上角头像 → **Settings**
3. 在左侧菜单选择 **Tokens**
4. 点击 **Create Token** 按钮
5. 填写 Token 信息：
   - **Token Name**: `GitHub Actions` 或 `SmartTrack CI/CD`
   - **Scope**: 选择 **Full Account**（或仅选择 SmartTrack 项目）
   - **Expiration**: 建议选择 **No Expiration**（或根据安全策略设置）
6. 点击 **Create**
7. **立即复制** Token（只会显示一次！）

#### 添加到 GitHub：

1. 进入 GitHub 仓库：https://github.com/litantai/SmartTrack
2. 点击 **Settings** 标签
3. 左侧菜单选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret**
5. 填写：
   - **Name**: `VERCEL_TOKEN`
   - **Secret**: 粘贴刚才复制的 Token
6. 点击 **Add secret**

### 2. VERCEL_ORG_ID（可选但推荐）

用于指定 Vercel 组织/个人账户 ID。

#### 获取步骤：

**方法 1: 通过 Vercel CLI（推荐）**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录并获取信息
vercel login
vercel link

# 查看 .vercel/project.json 文件
cat .vercel/project.json
# 其中 "orgId" 就是 VERCEL_ORG_ID
```

**方法 2: 通过 Vercel 控制台**

⚠️ **注意**：`VERCEL_ORG_ID` 在 Vercel 网页界面中可能不显示或难以找到。如果在项目设置的 **Settings** → **General** 页面中没有看到 **Team ID** 或 **Owner ID**，请使用上面的 CLI 方法获取。

#### 添加到 GitHub：

同样的步骤，但 Name 填写 `VERCEL_ORG_ID`

### 3. VERCEL_PROJECT_ID（可选但推荐）

用于指定 Vercel 项目 ID。

#### 获取步骤：

**方法 1: 通过 Vercel CLI**
```bash
# 查看 .vercel/project.json 文件
cat .vercel/project.json
# 其中 "projectId" 就是 VERCEL_PROJECT_ID
```

**方法 2: 通过 Vercel 控制台**
1. 进入 Vercel 项目（smart-track）
2. 点击 **Settings**
3. 在 **General** 页面，找到 **Project ID**
4. 复制该 ID

#### 添加到 GitHub：

同样的步骤，但 Name 填写 `VERCEL_PROJECT_ID`

## ✅ 验证配置

配置完成后，可以通过以下方式验证：

### 方法 1: 触发工作流

1. 创建一个测试分支：
   ```bash
   git checkout -b test/deployment-config
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: verify deployment configuration"
   git push origin test/deployment-config
   ```

2. 创建 Pull Request

3. 查看 GitHub Actions:
   - 进入仓库的 **Actions** 标签
   - 应该看到 "Vercel Deployment" 工作流正在运行
   - 如果成功，说明配置正确

### 方法 2: 检查 Secrets

1. 进入 **Settings** → **Secrets and variables** → **Actions**
2. 确认所有必需的 Secrets 都已添加：
   - ✅ VERCEL_TOKEN
   - ✅ VERCEL_ORG_ID（推荐）
   - ✅ VERCEL_PROJECT_ID（推荐）

## 🔒 安全建议

### Token 管理

- ✅ 定期轮换 Token（建议每 3-6 个月）
- ✅ 使用最小权限原则
- ✅ 不要在代码或日志中暴露 Token
- ✅ 如果 Token 泄露，立即删除并重新创建

### 访问控制

- ✅ 限制能访问 Secrets 的人员
- ✅ 使用团队权限管理
- ✅ 启用双因素认证（2FA）

## 🚨 常见问题

### Q: Token 过期了怎么办？

A: 
1. 在 Vercel 删除旧 Token
2. 创建新 Token
3. 在 GitHub 更新 VERCEL_TOKEN Secret

### Q: 忘记复制 Token 怎么办？

A: Token 只显示一次，无法再次查看。需要：
1. 删除该 Token
2. 重新创建新 Token

### Q: 可以在多个仓库使用同一个 Token 吗？

A: 可以，但不推荐。建议为每个项目创建独立的 Token，便于管理和权限控制。

### Q: VERCEL_ORG_ID 和 VERCEL_PROJECT_ID 必须配置吗？

A: 不是必须的，但强烈推荐。配置后：
- 加快部署速度（不需要自动发现）
- 避免部署到错误的项目
- 更好的错误提示

## 📚 相关文档

- [Vercel Token 管理](https://vercel.com/docs/rest-api#authentication)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [项目部署文档](./DEPLOYMENT.md)

## 🆘 需要帮助？

如果在配置过程中遇到问题：

1. 检查本文档的常见问题部分
2. 查看 GitHub Actions 日志获取详细错误信息
3. 在仓库提 Issue 并 @团队成员
4. 参考 Vercel 官方文档

---

**最后更新**: 2026-01-20  
**维护者**: SmartTrack 开发团队

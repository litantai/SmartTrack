# Vercel 部署常见问题解答

## 🔍 关于 PR #5 的部署问题

### 问题：PR 合并到 main 后，为什么没有自动部署到 Vercel？

这是一个很常见的问题。让我们分析原因和解决方案：

### 原因分析

在 PR #5 之前，SmartTrack 项目**没有配置 GitHub Actions 自动化部署工作流**。

Vercel 确实提供了自动部署功能，但它的默认行为是：

- ✅ **PR 提交时**: Vercel 会自动创建预览环境（这就是为什么你在 PR #5 中看到了 vercel[bot] 的评论）
- ❌ **PR 合并后**: Vercel 的自动部署可能不会立即触发，或者需要额外的 GitHub App 权限配置

### 解决方案

现在我们已经添加了 GitHub Actions 工作流，以后的部署流程将是：

```
PR 创建 → 自动部署预览环境 → PR 合并到 main → 自动部署生产环境
```

### 验证部署是否成功

合并 PR 后，可以通过以下方式确认部署状态：

#### 方法 1: 查看 GitHub Actions

1. 进入仓库页面: https://github.com/litantai/SmartTrack
2. 点击 **Actions** 标签
3. 查找 "Vercel Deployment" 工作流
4. 如果显示绿色 ✅，说明部署成功
5. 如果显示红色 ❌，点击查看错误日志

#### 方法 2: 查看 Vercel 控制台

1. 登录 https://vercel.com
2. 选择 SmartTrack 项目
3. 查看 **Deployments** 页面
4. 最新的 Production 部署应该对应 main 分支的最新提交

#### 方法 3: 直接访问生产地址

访问: https://smart-track-nine.vercel.app

- 如果看到最新的更改，说明部署成功
- 如果还是旧版本，可能需要清除浏览器缓存或等待 CDN 更新

### 如何重新部署 PR #5 的内容？

如果 PR #5 的内容在合并后没有自动部署，可以尝试以下方法：

#### 方法 1: 在 Vercel 控制台手动触发（最快）

1. 登录 Vercel
2. 进入 SmartTrack 项目
3. 找到 **Deployments** 页面
4. 找到 main 分支的最新部署
5. 点击 **Redeploy** 按钮

#### 方法 2: 创建一个空提交触发自动部署

```bash
git checkout main
git pull origin main
git commit --allow-empty -m "chore: trigger deployment for PR #5 changes"
git push origin main
```

这会触发 GitHub Actions 工作流，自动部署到生产环境。

#### 方法 3: 使用 Vercel CLI 手动部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 切换到 main 分支
git checkout main
git pull origin main

# 部署到生产环境
vercel --prod
```

---

## 📚 部署工作流详解

### 当前的工作流（已配置）

#### 1. 预览环境部署流程

```
开发者创建 PR
    ↓
GitHub Actions 检测到 PR
    ↓
运行构建和测试
    ↓
部署到 Vercel 预览环境
    ↓
在 PR 评论中发布预览 URL
```

**特点**：
- 每个 PR 都有独立的预览 URL
- 可以在不影响生产环境的情况下测试
- PR 关闭后，预览环境会被自动清理

#### 2. 生产环境部署流程

```
PR 被合并到 main 分支
    ↓
GitHub Actions 检测到 main 分支更新
    ↓
运行构建和测试
    ↓
部署到 Vercel 生产环境
    ↓
更新 smart-track-nine.vercel.app
```

**特点**：
- 只有 main 分支的变更会触发生产部署
- 生产 URL 固定不变
- 自动化，无需人工干预

### 建议的工作流

基于最佳实践，我们建议：

#### ✅ 推荐：Feature Branch → PR → Preview → Merge → Production

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# 2. 在 GitHub 创建 Pull Request
# 3. 自动触发预览环境部署
# 4. 在预览环境中测试功能
# 5. 代码审查通过后合并到 main
# 6. 自动触发生产环境部署
```

**优点**：
- ✅ 代码审查和测试充分
- ✅ 生产环境更稳定
- ✅ 可以回滚到任意版本
- ✅ 团队协作更流畅

#### ⚠️ 不推荐：直接推送到 main

```bash
git checkout main
git add .
git commit -m "fix: quick fix"
git push origin main
# 直接触发生产部署，跳过审查
```

**缺点**：
- ❌ 跳过代码审查
- ❌ 没有预览环境测试
- ❌ 可能引入未发现的 bug
- ❌ 难以追踪变更历史

#### 🆘 例外：紧急修复（Hotfix）

紧急修复时可以简化流程，但仍然要经过基本的测试：

```bash
# 1. 创建 hotfix 分支
git checkout -b hotfix/critical-bug
git add .
git commit -m "fix: critical bug"
git push origin hotfix/critical-bug

# 2. 创建 PR（即使很急也要创建）
# 3. 快速审查和测试（在预览环境）
# 4. 合并到 main
# 5. 自动部署到生产环境

# 6. 部署后立即验证
curl https://smart-track-nine.vercel.app/health
```

---

## 🔧 配置检查清单

确保以下配置都已正确设置：

### GitHub 配置

- [ ] GitHub Actions 已启用
- [ ] `.github/workflows/vercel-deploy.yml` 文件存在
- [ ] `VERCEL_TOKEN` Secret 已配置
- [ ] `VERCEL_ORG_ID` Secret 已配置（推荐）
- [ ] `VERCEL_PROJECT_ID` Secret 已配置（推荐）

### Vercel 配置

- [ ] 项目已在 Vercel 创建
- [ ] 项目已链接到 GitHub 仓库
- [ ] 生产环境变量已配置
  - [ ] `MONGODB_URI`
  - [ ] `NEXTAUTH_SECRET`
  - [ ] `NEXTAUTH_URL`
- [ ] 预览环境变量已配置（推荐使用测试数据库）

### 测试部署

- [ ] 创建测试 PR，验证预览环境部署
- [ ] 合并测试 PR，验证生产环境部署
- [ ] 访问生产 URL，确认更新已生效

---

## 📊 部署时间线估算

了解部署需要多长时间：

### 预览环境部署

- **GitHub Actions 启动**: ~30 秒
- **依赖安装**: ~1-2 分钟
- **项目构建**: ~2-3 分钟
- **部署到 Vercel**: ~30 秒
- **总计**: **约 4-6 分钟**

### 生产环境部署

- **流程相同**: ~4-6 分钟
- **CDN 缓存更新**: ~1-2 分钟
- **全球节点同步**: ~5-10 分钟
- **总计**: **约 10-15 分钟**（在所有地区生效）

💡 **提示**: 首次部署可能需要更长时间，后续部署会因为缓存而更快。

---

## 🐛 故障排查

### 部署失败常见原因

#### 1. VERCEL_TOKEN 未配置或已失效

**错误信息**：
```
Error: Vercel token is invalid or missing
```

**解决方法**：
1. 在 Vercel 创建新 Token
2. 在 GitHub 更新 `VERCEL_TOKEN` Secret

#### 2. 构建失败

**错误信息**：
```
Error: Build failed
```

**解决方法**：
1. 查看 GitHub Actions 日志
2. 本地运行 `npm run build` 测试
3. 检查环境变量是否缺失
4. 检查依赖是否有冲突

#### 3. 环境变量缺失

**错误信息**：
```
Error: Missing required environment variables
```

**解决方法**：
1. 在 Vercel 项目设置中配置环境变量
2. 确保生产和预览环境都有必要的变量
3. 重新部署

#### 4. 部署超时

**错误信息**：
```
Error: Deployment timeout
```

**解决方法**：
1. 检查构建脚本是否有死循环
2. 优化依赖安装（使用 npm ci 而不是 npm install）
3. 减少构建时间（分离大型依赖）

---

## 📞 需要帮助？

如果遇到本文档未涵盖的问题：

1. **查看日志**：
   - GitHub Actions: 仓库 → Actions 标签
   - Vercel: 项目 → Deployments → 点击具体部署 → Logs

2. **提交 Issue**：
   - 在 GitHub 仓库创建 Issue
   - 包含错误信息和日志截图
   - @ 相关团队成员

3. **参考文档**：
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南
   - [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) - 快速开始
   - [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md) - Secrets 配置

---

**最后更新**: 2026-01-20  
**维护者**: SmartTrack 开发团队

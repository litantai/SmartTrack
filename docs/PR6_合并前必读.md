# PR #6 合并前必读 - 用户操作指南

## 📋 概述

你好！PR #6 添加了自动化部署功能，但在合并之前，**你需要先完成一些配置**，否则自动部署无法正常工作。

## ✅ 合并前必须完成的操作

### 第 1 步：创建 Vercel Token（最重要！）

这是**必须的**，没有这个 Token，GitHub Actions 无法部署到 Vercel。

#### 操作步骤：

1. **登录 Vercel**
   - 访问：https://vercel.com/account/tokens
   - 使用你的 Vercel 账号登录

2. **创建 Token**
   - 点击页面上的 **"Create Token"** 按钮
   - 在弹出的对话框中填写：
     * **Token Name**: `GitHub Actions` 或 `SmartTrack-CI/CD`（名字随意，方便识别即可）
     * **Scope**: 选择 **"Full Account"** 或仅选择 `SmartTrack` 项目
     * **Expiration**: 建议选择 **"No Expiration"**（不过期）

3. **复制 Token**
   - 点击 **"Create"** 按钮后，Token 会显示一次
   - **⚠️ 重要**：这个 Token **只会显示一次**，请立即复制并保存！
   - 如果忘记复制，需要删除这个 Token 重新创建

### 第 2 步：在 GitHub 配置 Secret

将刚才获取的 Token 添加到 GitHub 仓库的 Secrets 中。

#### 操作步骤：

1. **进入仓库设置页面**
   - 访问：https://github.com/litantai/SmartTrack/settings/secrets/actions
   - 或者：在仓库页面点击 **"Settings"** 标签 → 左侧菜单选择 **"Secrets and variables"** → **"Actions"**

2. **添加 VERCEL_TOKEN**
   - 点击 **"New repository secret"** 按钮
   - 填写：
     * **Name**: `VERCEL_TOKEN`（必须完全一致，包括大写）
     * **Secret**: 粘贴刚才复制的 Vercel Token
   - 点击 **"Add secret"** 保存

### 第 3 步（可选但推荐）：配置 Vercel 项目 ID

这一步不是必须的，但强烈推荐配置，可以让部署更快更准确。

#### 方法 1：通过 Vercel 网页获取

1. **登录 Vercel 并进入项目**
   - 访问：https://vercel.com/dashboard
   - 找到并点击 `smart-track` 项目

2. **查看项目设置**
   - 点击 **"Settings"** 标签
   - 在 **"General"** 页面中找到以下信息：
     * **Project ID**: 复制这个 ID
     * **Team ID** 或 **Owner ID**: 也复制下来

3. **添加到 GitHub Secrets**
   - 返回 GitHub Secrets 页面（步骤 2 中的地址）
   - 添加两个新的 Secrets：
     * Name: `VERCEL_PROJECT_ID`，Secret: 粘贴项目 ID
     * Name: `VERCEL_ORG_ID`，Secret: 粘贴 Team/Owner ID

#### 方法 2：通过 Vercel CLI 获取（适合技术人员）

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 链接项目（在项目根目录执行）
cd /path/to/SmartTrack
vercel link

# 4. 查看配置文件
cat .vercel/project.json
```

在 `.vercel/project.json` 文件中可以找到：
- `"projectId"`: 这就是 `VERCEL_PROJECT_ID`
- `"orgId"`: 这就是 `VERCEL_ORG_ID`

将这两个值添加到 GitHub Secrets 中。

### 第 4 步：检查 Vercel 环境变量

确保在 Vercel 项目中配置了必要的环境变量（应该已经配置过了，但请确认一下）。

#### 操作步骤：

1. **进入 Vercel 项目设置**
   - 访问：https://vercel.com/dashboard
   - 选择 `smart-track` 项目
   - 点击 **"Settings"** 标签
   - 选择 **"Environment Variables"**

2. **确认以下变量存在**
   - ✅ `MONGODB_URI` - 数据库连接字符串
   - ✅ `NEXTAUTH_SECRET` - 认证密钥
   - ✅ `NEXTAUTH_URL` - 应用访问地址

3. **如果缺少变量**
   - 点击 **"Add"** 按钮添加
   - 为每个变量选择适用的环境：
     * **Production**: 生产环境（必选）
     * **Preview**: 预览环境（推荐也配置）

## 📝 配置完成后的检查清单

在合并 PR #6 之前，请确认以下所有项目：

- [ ] 已在 Vercel 创建了 Token
- [ ] 已在 GitHub 添加了 `VERCEL_TOKEN` Secret
- [ ] （推荐）已在 GitHub 添加了 `VERCEL_PROJECT_ID` Secret
- [ ] （推荐）已在 GitHub 添加了 `VERCEL_ORG_ID` Secret
- [ ] 已确认 Vercel 项目中配置了所有必要的环境变量
- [ ] 阅读并理解了自动部署工作流程

## 🎯 合并后会发生什么？

配置完成并合并 PR #6 后：

### 立即生效：
- ✅ 每次创建 PR 时，会自动部署到**预览环境**
- ✅ 每次合并到 main 分支时，会自动部署到**生产环境**
- ✅ 在 PR 评论中会自动显示预览环境的访问链接
- ✅ 可以在 GitHub Actions 标签页查看部署状态

### 工作流程：
```
开发功能 → 创建 PR → 自动部署预览环境 → 测试 → 代码审查 → 合并到 main → 自动部署生产环境
```

## ⚠️ 注意事项

1. **Token 安全**
   - Token 具有完整的 Vercel 账号权限，请妥善保管
   - 不要在代码中暴露 Token
   - 如果 Token 泄露，立即在 Vercel 删除并重新创建

2. **首次部署**
   - 合并 PR 后，可能需要 5-10 分钟才能完成首次部署
   - 可以在 GitHub Actions 页面实时查看部署进度

3. **部署失败**
   - 如果部署失败，查看 GitHub Actions 的日志
   - 常见原因：Token 配置错误、环境变量缺失、构建错误

## 🆘 遇到问题？

### 找不到 Vercel Token 创建页面
- 直接访问：https://vercel.com/account/tokens
- 确保已登录 Vercel 账号

### 忘记复制 Token
- 无法再次查看，需要删除旧 Token 并创建新的

### GitHub Secrets 页面找不到
- 确保你有仓库的 Admin 或 Settings 权限
- 直接访问：https://github.com/litantai/SmartTrack/settings/secrets/actions

### 不确定环境变量是否正确
- 参考 `.env.example` 文件
- 查看之前的手动部署配置

## 📚 更多信息

配置完成后，建议阅读以下文档了解详细的使用方法：

- [快速开始指南](./DEPLOYMENT_QUICKSTART.md) - 5 分钟了解部署流程
- [详细部署文档](./DEPLOYMENT.md) - 完整的部署说明
- [常见问题解答](./DEPLOYMENT_FAQ.md) - 遇到问题时查看
- [Secrets 配置详解](./GITHUB_SECRETS_SETUP.md) - 深入了解配置细节

## 💡 快速验证配置是否成功

配置完成后，可以用以下方法快速验证：

### 方法 1：创建测试 PR

```bash
# 1. 创建测试分支
git checkout -b test/verify-deployment
echo "# 测试部署" >> README.md
git add README.md
git commit -m "test: verify deployment configuration"
git push origin test/verify-deployment

# 2. 在 GitHub 创建 PR
# 3. 查看 PR 页面，应该会看到：
#    - GitHub Actions 开始运行
#    - 几分钟后，PR 评论中会出现预览环境链接
```

### 方法 2：检查 Secrets 配置

在 https://github.com/litantai/SmartTrack/settings/secrets/actions 页面：
- ✅ VERCEL_TOKEN 应该显示为已添加
- ✅ （可选）VERCEL_PROJECT_ID 应该显示为已添加
- ✅ （可选）VERCEL_ORG_ID 应该显示为已添加

## ✨ 总结

### 最少必须做的事情（核心步骤）：
1. ✅ 在 Vercel 创建 Token
2. ✅ 在 GitHub 添加 `VERCEL_TOKEN` Secret

### 推荐额外做的事情：
3. ✅ 在 GitHub 添加 `VERCEL_PROJECT_ID` 和 `VERCEL_ORG_ID` Secrets
4. ✅ 确认 Vercel 环境变量配置正确

**完成这些配置后，就可以放心合并 PR #6 了！**

---

**需要帮助？** 
- 在 PR #6 中评论 @团队成员
- 或在仓库创建新 Issue 说明问题

**文档创建时间**: 2026-01-20  
**相关 PR**: #6  
**维护者**: SmartTrack 开发团队

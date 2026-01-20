# ⚠️ PR #6 合并前须知

## 🎯 快速回答：你需要做什么？

在合并 PR #6 之前，你需要完成以下**2个核心步骤**：

### ✅ 步骤 1：创建 Vercel Token

1. 访问：https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 复制生成的 Token（⚠️ 只显示一次！）

### ✅ 步骤 2：添加到 GitHub Secrets

1. 访问：https://github.com/litantai/SmartTrack/settings/secrets/actions
2. 点击 "New repository secret"
3. 填写：
   - Name: `VERCEL_TOKEN`
   - Secret: 粘贴步骤1的Token
4. 点击 "Add secret"

## 📖 详细说明

完整的操作指南请查看：**[docs/PR6_合并前必读.md](./docs/PR6_合并前必读.md)**

这份文档包含：
- ✅ 详细的配置步骤（包括截图位置说明）
- ✅ 可选但推荐的额外配置（VERCEL_PROJECT_ID 和 VERCEL_ORG_ID）
- ✅ 配置检查清单
- ✅ 常见问题解答
- ✅ 配置验证方法

## ❓ 为什么需要这些配置？

PR #6 添加了 GitHub Actions 自动部署工作流。这个工作流需要：
- 使用 `VERCEL_TOKEN` 来访问你的 Vercel 账号
- 自动将代码部署到 Vercel 的预览环境和生产环境

没有这个配置，工作流会失败，无法自动部署。

## 🚀 配置完成后的效果

配置完成并合并 PR #6 后：
- ✅ **每次创建 PR** → 自动部署到预览环境
- ✅ **每次合并到 main** → 自动部署到生产环境
- ✅ 不再需要手动部署！

## 💡 快速链接

- 📚 [完整操作指南](./docs/PR6_合并前必读.md) - 详细步骤
- 🔧 [GitHub Secrets 配置详解](./docs/GITHUB_SECRETS_SETUP.md) - 高级配置
- 🚀 [部署快速指南](./docs/DEPLOYMENT_QUICKSTART.md) - 了解部署流程
- ❓ [常见问题解答](./docs/DEPLOYMENT_FAQ.md) - 遇到问题时查看

---

**需要帮助？** 在 PR #6 中评论或查看 [完整文档](./docs/PR6_合并前必读.md)

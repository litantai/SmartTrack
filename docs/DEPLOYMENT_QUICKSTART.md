# Vercel 部署快速指南

## 🚀 TL;DR（太长不看版）

- **PR 提交** → 自动部署到**预览环境**（测试用）
- **合并到 main** → 自动部署到**生产环境**（对外服务）
- 现在已经配置好了自动化 GitHub Actions 工作流

## 📋 快速设置（仅需一次）

### 步骤 1: 获取 Vercel Token

1. 访问 https://vercel.com/account/tokens
2. 点击 "Create Token"
3. 命名为 "GitHub Actions"
4. 复制生成的 Token

### 步骤 2: 配置 GitHub Secrets

在 GitHub 仓库中：

```
Settings → Secrets and variables → Actions → New repository secret
```

添加以下 Secret：

```
名称: VERCEL_TOKEN
值: （粘贴刚才复制的 Token）
```

### 步骤 3: 获取项目 ID（可选）

如果使用自定义工作流，还需要：

1. 在 Vercel 项目设置中找到 Project ID
2. 添加为 GitHub Secret: `VERCEL_PROJECT_ID`

## ✨ 使用方法

### 方式 1: 通过 Pull Request（推荐）

```bash
# 1. 创建功能分支
git checkout -b feature/my-feature

# 2. 开发并提交代码
git add .
git commit -m "feat: add new feature"
git push origin feature/my-feature

# 3. 在 GitHub 创建 Pull Request
# → 自动触发预览环境部署
# → 在 PR 评论中获得预览链接
```

### 方式 2: 直接推送到 main（谨慎使用）

```bash
# 直接推送到 main 会触发生产环境部署
git push origin main
# → 自动部署到生产环境
```

## 🔍 查看部署状态

### GitHub Actions

```
仓库页面 → Actions 标签 → Vercel Deployment
```

### Vercel 控制台

```
https://vercel.com/dashboard → 选择项目 → Deployments
```

## 💡 工作流建议

### 日常开发（推荐流程）

```
功能分支 → PR → 预览测试 → 代码审查 → 合并到 main → 生产部署
```

1. ✅ 在功能分支开发
2. ✅ 创建 PR 触发预览部署
3. ✅ 在预览环境测试
4. ✅ 代码审查通过后合并
5. ✅ 自动部署到生产环境

### 紧急修复

```
创建 hotfix 分支 → 快速修复 → PR → 测试 → 快速合并 → 生产部署
```

## ⚠️ 注意事项

### 环境变量

确保在 Vercel 中配置了必要的环境变量：

- `MONGODB_URI` - 数据库连接字符串
- `NEXTAUTH_SECRET` - 认证密钥
- `NEXTAUTH_URL` - 应用 URL

**建议**: 生产环境和预览环境使用不同的数据库！

### 部署失败排查

1. 检查 GitHub Actions 日志
2. 检查 Vercel 部署日志
3. 验证环境变量是否配置
4. 确认 Vercel Token 是否有效

## 🤔 常见问题

**Q: PR 合并后多久能看到生产环境更新？**  
A: 通常 2-5 分钟，取决于构建时间。

**Q: 可以回滚吗？**  
A: 可以！在 Vercel 控制台找到之前的部署，点击 "Promote to Production"。

**Q: 预览环境会自动删除吗？**  
A: 会的，PR 关闭后 Vercel 会自动清理预览部署。

**Q: 如何查看部署日志？**  
A: GitHub Actions 页面或 Vercel 控制台的 Deployments 部分。

## 📚 更多信息

详细文档请参考：[docs/DEPLOYMENT.md](./DEPLOYMENT.md)

---

**问题反馈**: 在仓库提 Issue 或联系团队成员

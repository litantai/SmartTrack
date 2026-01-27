# GitHub Actions 工作流 (GitHub Actions Workflows)

本目录包含 SmartTrack 项目的所有 GitHub Actions 工作流配置文件。

---

## 📁 文件列表

### 工作流文件 (Workflow Files)

#### `init-issues.yml` - 批量创建 GitHub Issues
**功能**: 从 `docs/issues/` 目录的 Markdown 文件批量创建 GitHub Issues

**触发方式**: 手动触发（`workflow_dispatch`）

**特性**:
- ✅ **自动创建缺失的标签** - 在创建 Issue 前自动检查并创建所需的 Labels
- ✅ 自动读取所有 Markdown 文件
- ✅ 提取文件标题和标签
- ✅ 防止重复创建（可选）
- ✅ 详细的执行日志和统计报告

**自动创建的标签**:
- `infrastructure` - 基础设施和工具任务
- `data-layer` - 数据模型和数据库架构
- `documentation` - 文档改进
- `priority:P0` - 最高优先级（必须首先完成）
- `priority:P1` - 高优先级（重要任务）
- `complexity:high` - 高复杂度任务
- `complexity:medium` - 中等复杂度任务
- `parallel:yes` - 可以并行工作
- `auto-created` - 自动创建的 Issue（默认标签）

**使用方法**: 参见 [HOW_TO_RUN.md](./HOW_TO_RUN.md)

---

### 文档文件 (Documentation Files)

#### `HOW_TO_RUN.md` - 快速开始指南 ⭐
**内容**: 图文并茂的工作流触发步骤指南

**推荐阅读**: 如果你是第一次使用，请先阅读此文档

#### `USAGE_GUIDE.md` - 详细使用指南
**内容**: 
- 工作流功能详解
- 多种触发方式（Web UI / CLI / API）
- 配置参数说明
- 故障排查指南

---

## 🚀 快速开始

### 1. 批量创建 Issues

**第一步**: 确保 `docs/issues/` 目录下有 Markdown 文件

```bash
ls -la docs/issues/
```

**第二步**: 访问 GitHub Actions 页面

```
https://github.com/litantai/SmartTrack/actions
```

**第三步**: 选择 "批量创建 GitHub Issues" 工作流

**第四步**: 点击 "Run workflow" → 选择分支 → 点击运行

**详细步骤**: 请参阅 [HOW_TO_RUN.md](./HOW_TO_RUN.md)

---

## 📋 工作流权限说明

所有工作流都需要以下权限（已在工作流文件中配置）：

- ✅ `contents: read` - 读取仓库文件
- ✅ `issues: write` - 创建和管理 Issues

### 如何配置权限

如果工作流运行失败并提示权限错误，请按以下步骤配置：

1. 进入仓库 **Settings** → **Actions** → **General**
2. 找到 **Workflow permissions** 部分
3. 选择 **"Read and write permissions"**
4. 点击 **Save** 保存

---

## 🔍 查看工作流运行历史

### 方法 1: GitHub Web UI

访问：
```
https://github.com/litantai/SmartTrack/actions
```

### 方法 2: GitHub CLI

```bash
# 列出所有工作流运行记录
gh run list

# 列出特定工作流的运行记录
gh run list --workflow="init-issues.yml"

# 查看最新运行的详细日志
gh run view --log
```

---

## 📚 相关资源

### 项目文档
- **Issue 模板目录**: [`docs/issues/`](../../docs/issues/)
- **Issue 创建指南**: [`docs/issues/README.md`](../../docs/issues/README.md)

### GitHub 官方文档
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [工作流语法参考](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub CLI 文档](https://cli.github.com/)

---

## 🤝 贡献指南

如果你想添加新的工作流或改进现有工作流，请：

1. 在 `.github/workflows/` 目录创建新的 `.yml` 文件
2. 遵循现有工作流的命名和注释风格
3. 添加详细的使用文档
4. 测试工作流语法：
   ```bash
   yamllint .github/workflows/your-workflow.yml
   ```
5. 提交 Pull Request

---

## ⚠️ 注意事项

1. **工作流文件必须在主分支上**才能在 Actions UI 中显示
2. **不要在工作流中硬编码敏感信息**，使用 Secrets 管理
3. **定期检查工作流运行日志**，及时发现问题
4. **使用有意义的工作流名称**，便于团队成员理解
5. **Label 自动创建**: 工作流会自动创建缺失的标签，无需手动创建

---

## 🔧 故障排查

### 问题: 工作流运行失败，提示 "Label does not exist"

**解决方案**: 此问题已在最新版本中修复。工作流现在会自动检查并创建所有必需的标签。如果仍然遇到问题：

1. 确认您使用的是最新版本的 `init-issues.yml`
2. 检查工作流的 Step 2 是否正常执行（"检查并创建 Labels"）
3. 验证 GITHUB_TOKEN 是否有创建标签的权限

### 问题: 标签颜色或描述需要修改

**解决方案**: 编辑 `.github/workflows/init-issues.yml` 文件中的 `REQUIRED_LABELS` 数组：

```yaml
declare -a REQUIRED_LABELS=(
  "label-name|COLOR_CODE|Description"
)
```

其中 `COLOR_CODE` 是 6 位十六进制颜色代码（不含 `#` 前缀）

---

**最后更新**: 2026-01-27  
**维护者**: SmartTrack Team

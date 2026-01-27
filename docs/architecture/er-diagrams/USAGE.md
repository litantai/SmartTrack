# ER 图使用指南 (ER Diagrams Usage Guide)

## 如何查看 ER 图

### 在 GitHub 上查看

GitHub 原生支持 Mermaid 语法渲染。在 GitHub 仓库中打开任何 `.md` 文件，Mermaid 代码块会自动渲染为可视化图表。

**访问路径**: 
- [用户权限系统](./01-user-permission-system.md)
- [车辆系统](./02-vehicle-system.md)
- [场地系统](./03-venue-system.md)
- [预约系统](./04-booking-system.md)
- [系统概览](./README.md)

### 在本地查看

#### 方案 1: 使用 VS Code (推荐)

1. 安装 VS Code 插件: [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid)
2. 打开 `.md` 文件
3. 按 `Ctrl+Shift+V` (Windows/Linux) 或 `Cmd+Shift+V` (Mac) 打开预览

#### 方案 2: 使用 Mermaid Live Editor

1. 访问 [Mermaid Live Editor](https://mermaid.live/)
2. 复制 ER 图代码块（去除 \`\`\`mermaid 标记）
3. 粘贴到编辑器中查看渲染结果

#### 方案 3: 使用命令行工具

```bash
# 安装 Mermaid CLI
npm install -g @mermaid-js/mermaid-cli

# 将 Markdown 文件转换为 PNG/SVG
mmdc -i docs/architecture/er-diagrams/01-user-permission-system.md -o output.png
```

## ER 图关系符号说明

### Mermaid ER 图语法

| 符号 | 含义 | 示例 | 解释 |
|------|------|------|------|
| `\|\|--o{` | One-to-Many (1:N) | `User \|\|--o{ Booking` | 一个用户可以有多个预约 |
| `}o--\|\|` | Many-to-One (N:1) | `Booking }o--\|\| User` | 多个预约可以由同一用户创建 |
| `\|\|--\|\|` | One-to-One (1:1) | `Booking \|\|--\|\| Payment` | 一个预约对应一个支付记录 |
| `}o--o{` | Many-to-Many (N:M) | `Venue }o--o{ VenueFeature` | 场地和特性是多对多关系 |

### 基数符号

- `\|\|` : 必须有一个 (exactly one)
- `o\|` : 零或一个 (zero or one)
- `}\|` : 一个或多个 (one or more)
- `}o` : 零个或多个 (zero or more)

### 实体属性符号

| 符号 | 含义 |
|------|------|
| PK | Primary Key (主键) |
| FK | Foreign Key (外键) |
| UK | Unique Key (唯一键) |

## ER 图结构说明

每个 ER 图文档包含以下部分：

1. **系统概述**: 子系统的功能和职责
2. **实体关系图**: Mermaid 格式的 ER 图代码
3. **关系说明**: 详细解释实体间的关系类型和外键约束
4. **核心字段说明**: 列出关键字段及其类型、约束
5. **索引策略**: 数据库索引配置建议
6. **状态机定义**: XState 状态流转图
7. **业务规则**: Zen Engine 规则配置示例
8. **使用示例**: 实际代码示例
9. **数据完整性约束**: 数据校验规则
10. **性能优化建议**: 查询优化和缓存策略

## 开发流程中的使用

### 阶段 1: 需求分析

在开发新功能前，先查阅相关的 ER 图，了解：
- 涉及哪些实体
- 实体间的关系
- 需要哪些字段
- 是否需要新增实体或关系

### 阶段 2: 数据库设计

根据 ER 图创建或修改数据库模型：
1. 在 `lib/db/models/` 中定义 Mongoose Schema
2. 确保外键关系正确配置
3. 创建必要的索引

### 阶段 3: Service 层开发

参考 ER 图的业务规则部分：
1. 在 `lib/db/services/` 中实现业务逻辑
2. 使用 XState 管理状态流转
3. 使用 Zen Engine 实现可配置的业务规则

### 阶段 4: API 开发

根据 ER 图的使用示例：
1. 在 `app/api/` 中创建 API Routes
2. 实现 CRUD 操作
3. 添加必要的权限检查

### 阶段 5: 前端开发

参考 ER 图的核心字段说明：
1. 创建表单组件
2. 实现数据展示和交互
3. 集成状态管理

## 常见问题

### Q1: 如何添加新的实体？

1. 在对应子系统的 ER 图中添加新实体
2. 定义实体的字段和关系
3. 更新 `README.md` 中的系统概览
4. 在代码中实现对应的 Model 和 Service

### Q2: 如何修改现有关系？

1. 在 ER 图中更新关系符号
2. 更新关系说明部分
3. 修改数据库模型中的外键配置
4. 更新相关的 Service 层代码

### Q3: ER 图与代码不一致怎么办？

ER 图应作为设计文档优先级最高，代码应与 ER 图保持一致。如果发现不一致：
1. 首先确认 ER 图是否是最新版本
2. 如果 ER 图过时，更新 ER 图
3. 如果代码过时，修改代码以符合 ER 图设计

### Q4: 如何生成数据库迁移脚本？

目前系统使用 Mongoose 自动管理 Schema，不需要手动迁移。但建议：
1. 在 `lib/db/migrations/` 目录下记录重要的 Schema 变更
2. 使用版本控制追踪变更历史

## 贡献指南

### 修改 ER 图

如果需要修改 ER 图：
1. Fork 仓库
2. 修改对应的 `.md` 文件
3. 确保 Mermaid 语法正确
4. 更新相关说明文档
5. 提交 Pull Request

### ER 图审查清单

在提交 ER 图变更前，请确认：
- [ ] Mermaid 语法正确，可以正常渲染
- [ ] 所有关系类型正确标注（1:1, 1:N, N:M）
- [ ] 核心字段已包含且类型正确
- [ ] 外键字段已标注 FK
- [ ] 主键字段已标注 PK
- [ ] 唯一键字段已标注 UK
- [ ] 索引策略已说明
- [ ] 业务规则已描述
- [ ] 使用示例代码可运行

## 相关资源

- [Mermaid 官方文档](https://mermaid.js.org/)
- [Mermaid ER Diagram 语法](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)
- [MongoDB Schema 设计最佳实践](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)
- [Mongoose Schema 文档](https://mongoosejs.com/docs/guide.html)

## 联系方式

如有问题或建议，请：
- 提交 Issue: [GitHub Issues](https://github.com/litantai/SmartTrack/issues)
- 参与讨论: [GitHub Discussions](https://github.com/litantai/SmartTrack/discussions)

---

**最后更新**: 2026-01-26  
**维护团队**: SmartTrack Development Team

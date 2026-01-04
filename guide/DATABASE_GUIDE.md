# 数据库初始化与字段添加指南

## 📋 数据库结构初始化流程

### 1. Prisma Schema 定义（`prisma/schema.prisma`）

数据库结构首先在 `prisma/schema.prisma` 文件中定义，这是数据库的"蓝图"。

```prisma
model User {
  id         Int      @id @default(autoincrement())
  username   String
  password   String
  name       String?
  email      String?
  createDate DateTime @default(now())
}
```

### 2. 数据库迁移（Migrations）

有两种方式将 schema 应用到数据库：

#### 方式 A：使用 `prisma db push`（开发环境，快速原型）
```bash
npx prisma db push
```
- ✅ 快速，直接同步 schema 到数据库
- ⚠️ 不会生成迁移文件
- ⚠️ 不适合生产环境

#### 方式 B：使用 `prisma migrate`（生产环境，推荐）
```bash
# 创建迁移
npx prisma migrate dev --name add_new_field

# 应用迁移（生产环境）
npx prisma migrate deploy
```
- ✅ 生成迁移文件，可版本控制
- ✅ 适合团队协作和生产环境
- ✅ 可以回滚

### 3. 生成 Prisma Client

每次修改 schema 后，需要重新生成 Prisma Client：
```bash
npx prisma generate
```

### 4. 初始化数据（`server/plugins/initdata.ts`）

应用启动时会自动执行初始化：
- 创建系统设置（SystemSetting）
- 初始化类型转换关系（TypeRelation）
- 修复数据完整性（如设置默认值）

---

## 🔧 如何向数据库添加字段

### 步骤 1：修改 Prisma Schema

在 `prisma/schema.prisma` 中修改对应的 model：

```prisma
model User {
  id         Int      @id @default(autoincrement())
  username   String
  password   String
  name       String?
  email      String?
  createDate DateTime @default(now())
  // 👇 添加新字段
  phone      String?  // 可选字段
  age        Int?     // 可选数字字段
  isActive   Boolean  @default(true)  // 必填字段，带默认值
}
```

### 步骤 2：应用更改到数据库

#### 开发环境（推荐）：
```bash
npx prisma db push
```

#### 生产环境（推荐）：
```bash
# 创建迁移文件
npx prisma migrate dev --name add_user_fields

# 这会：
# 1. 创建迁移文件在 prisma/migrations/ 目录
# 2. 应用迁移到数据库
# 3. 自动运行 prisma generate
```

### 步骤 3：重新生成 Prisma Client

如果使用 `db push`，需要手动生成：
```bash
npx prisma generate
```

如果使用 `migrate dev`，会自动生成。

---

## 📝 实际示例：添加字段到 User 表

### 示例 1：添加手机号字段

**1. 修改 `prisma/schema.prisma`：**
```prisma
model User {
  id         Int      @id @default(autoincrement())
  username   String
  password   String
  name       String?
  email      String?
  phone      String?  // 👈 新增字段
  createDate DateTime @default(now())
}
```

**2. 应用更改：**
```bash
npx prisma db push
```

**3. 在代码中使用：**
```typescript
// 创建用户时包含新字段
await prisma.user.create({
  data: {
    username: "test",
    password: "123456",
    phone: "13800138000"  // 👈 使用新字段
  }
});

// 查询时也可以使用
const user = await prisma.user.findFirst({
  where: { phone: "13800138000" }
});
```

### 示例 2：添加必填字段（带默认值）

**1. 修改 schema：**
```prisma
model User {
  id         Int      @id @default(autoincrement())
  username   String
  password   String
  name       String?
  email      String?
  isVip      Boolean  @default(false)  // 👈 必填字段，默认 false
  createDate DateTime @default(now())
}
```

**2. 应用更改：**
```bash
npx prisma db push
```

---

## 🔄 迁移文件说明

迁移文件位于 `prisma/migrations/` 目录，按时间戳命名：

```
prisma/migrations/
├── 20250116134313_init/              # 初始迁移
│   └── migration.sql
├── 20250206090137_update_user_email/  # 更新用户邮箱字段
│   └── migration.sql
├── 20250315083738_add_budget/        # 添加预算功能
│   └── migration.sql
└── migration_lock.toml               # 锁定文件，防止并发迁移
```

每个迁移文件包含 SQL 语句，例如：
```sql
-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
```

---

## ⚠️ 注意事项

### 1. 字段类型选择

- `String?` - 可选字符串
- `String` - 必填字符串
- `Int?` - 可选整数
- `Int @default(0)` - 必填整数，默认值 0
- `Boolean @default(false)` - 布尔值，默认 false
- `DateTime @default(now())` - 日期时间，默认当前时间

### 2. 添加必填字段到已有数据

如果表中有数据，添加必填字段需要：
- 提供默认值：`field String @default("default")`
- 或者先添加为可选，再迁移数据，最后改为必填

### 3. 删除字段

```prisma
// 从 schema 中删除字段
model User {
  id         Int      @id @default(autoincrement())
  username   String
  // phone      String?  // 👈 删除这行
}
```

然后运行：
```bash
npx prisma db push
# 或
npx prisma migrate dev --name remove_phone_field
```

### 4. 重命名字段

Prisma 不支持直接重命名，需要：
1. 添加新字段
2. 迁移数据
3. 删除旧字段

或使用 `@map` 属性：
```prisma
model User {
  newName String @map("old_name")  // 数据库用 old_name，代码用 newName
}
```

---

## 🚀 完整工作流程

```bash
# 1. 修改 prisma/schema.prisma

# 2. 应用更改（开发环境）
npx prisma db push

# 或创建迁移（生产环境）
npx prisma migrate dev --name your_migration_name

# 3. 如果使用 db push，需要手动生成 client
npx prisma generate

# 4. 重启应用（如果正在运行）
npm run dev
```

---

## 📚 参考资源

- [Prisma Schema 文档](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate 文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)


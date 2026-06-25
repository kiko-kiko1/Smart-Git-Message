#!/usr/bin/env bash
# Smart Git Commit 测试环境准备脚本
# 作用：创建一个 mock git 仓库，包含历史 commit 和暂存区变更，用于测试工具

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

TEST_DIR="/tmp/smart-git-commit-test-$(date +%s)"

echo -e "${CYAN}🚀 正在创建测试环境...${NC}"
echo ""

# 创建测试目录
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# 初始化 git 仓库
git init -q
git config user.name "Test User"
git config user.email "test@example.com"

echo -e "${GREEN}✓${NC} 初始化 Git 仓库: $TEST_DIR"

# 创建初始文件
cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "description": "A test project for smart-git-commit",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
EOF

cat > README.md << 'EOF'
# Test Project

This is a test project.

## Getting Started

Install dependencies and run the project.
EOF

mkdir -p src
cat > src/index.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
EOF

git add .
git commit -q -m "feat: 初始化项目结构

- 创建 package.json 配置文件
- 添加 express 基础服务框架
- 编写 README 项目说明文档"

echo -e "${GREEN}✓${NC} 初始提交完成"

# 创建第二个 commit：新增功能
cat > src/utils.js << 'EOF'
// 工具函数集合

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

module.exports = {
  formatDate,
  generateId,
  validateEmail,
};
EOF

cat > src/user.js << 'EOF'
const { generateId, validateEmail } = require('./utils');

class User {
  constructor(name, email) {
    this.id = generateId();
    this.name = name;
    this.email = email;
    this.createdAt = new Date();
  }

  isValid() {
    return this.name && validateEmail(this.email);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
    };
  }
}

module.exports = User;
EOF

git add .
git commit -q -m "feat(user): 添加用户模块和工具函数

- 新增 utils.js 提供日期格式化、ID生成、邮箱验证工具
- 新增 User 类，支持用户数据验证和序列化
- 遵循模块化设计，职责分离"

echo -e "${GREEN}✓${NC} 用户模块提交完成"

# 第三个 commit：修复 bug
cat > src/index.js << 'EOF'
const express = require('express');
const User = require('./user');
const { formatDate } = require('./utils');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
    date: formatDate(new Date()),
  });
});

app.post('/users', (req, res) => {
  const { name, email } = req.body;
  const user = new User(name, email);

  if (!user.isValid()) {
    return res.status(400).json({ error: '无效的用户数据' });
  }

  res.status(201).json(user.toJSON());
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
EOF

git add .
git commit -q -m "fix(api): 修复用户创建接口的验证逻辑

- 修复无效用户数据仍返回 200 的问题
- 添加 400 状态码和错误信息
- 根路径返回 JSON 格式而非纯文本"

echo -e "${GREEN}✓${NC} Bug 修复提交完成"

# 第四个 commit：文档更新
cat > README.md << 'EOF'
# Test Project

这是一个用于测试 smart-git-commit 工具的示例项目。

## 功能特性

- 用户管理 API
- 工具函数库
- Express 服务框架

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

### API 接口

- `GET /` - 健康检查
- `POST /users` - 创建用户

## 项目结构

```
src/
├── index.js    # 服务入口
├── user.js     # 用户模块
└── utils.js    # 工具函数
```
EOF

git add .
git commit -q -m "docs: 更新 README 文档，添加 API 说明

- 补充功能特性介绍
- 添加快速开始指南
- 新增 API 接口文档
- 更新项目结构说明"

echo -e "${GREEN}✓${NC} 文档更新提交完成"

# 第五个 commit：重构
mkdir -p src/routes
cat > src/routes/userRoutes.js << 'EOF'
const express = require('express');
const User = require('../user');

const router = express.Router();

router.post('/', (req, res) => {
  const { name, email } = req.body;
  const user = new User(name, email);

  if (!user.isValid()) {
    return res.status(400).json({ error: '无效的用户数据' });
  }

  res.status(201).json(user.toJSON());
});

router.get('/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: '示例用户',
    email: 'user@example.com',
  });
});

module.exports = router;
EOF

cat > src/index.js << 'EOF'
const express = require('express');
const { formatDate } = require('./utils');
const userRoutes = require('./routes/userRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// 健康检查
app.get('/', (req, res) => {
  res.json({
    message: 'Hello World!',
    date: formatDate(new Date()),
  });
});

// 用户路由
app.use('/users', userRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
EOF

git add .
git commit -q -m "refactor: 将用户路由抽离到独立模块

- 新增 routes/userRoutes.js 管理用户相关路由
- 主入口文件更简洁，专注于中间件和路由注册
- 新增 GET /users/:id 接口框架
- 为后续功能扩展打下基础"

echo -e "${GREEN}✓${NC} 重构提交完成"

echo ""
echo -e "${CYAN}📋 历史 commit 记录：${NC}"
echo ""
git log --oneline
echo ""

# ========== 创建暂存区变更（用于测试生成 commit message）==========
echo -e "${YELLOW}📝 正在创建暂存区变更...${NC}"
echo ""

mkdir -p src/middleware

# 变更1：新增认证模块
cat > src/middleware/auth.js << 'EOF'
// 认证中间件

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '缺少认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的令牌' });
  }
}

module.exports = {
  generateToken,
  authMiddleware,
};
EOF

# 变更2：更新用户路由，添加认证
cat > src/routes/userRoutes.js << 'EOF'
const express = require('express');
const User = require('../user');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 创建用户（公开接口）
router.post('/', (req, res) => {
  const { name, email } = req.body;
  const user = new User(name, email);

  if (!user.isValid()) {
    return res.status(400).json({ error: '无效的用户数据' });
  }

  res.status(201).json(user.toJSON());
});

// 获取用户信息（需要认证）
router.get('/:id', authMiddleware, (req, res) => {
  res.json({
    id: req.params.id,
    name: '示例用户',
    email: 'user@example.com',
  });
});

// 更新用户信息（需要认证）
router.put('/:id', authMiddleware, (req, res) => {
  const { name, email } = req.body;
  res.json({
    id: req.params.id,
    name: name || '更新后的用户名',
    email: email || 'updated@example.com',
  });
});

module.exports = router;
EOF

# 变更3：更新 package.json 添加 jwt 依赖
cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.1.0",
  "description": "A test project for smart-git-commit",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "jsonwebtoken": "^9.0.0"
  }
}
EOF

# 变更4：更新 README
cat > README.md << 'EOF'
# Test Project

这是一个用于测试 smart-git-commit 工具的示例项目。

## 功能特性

- 用户管理 API
- JWT 认证机制
- 工具函数库
- Express 服务框架

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

### 环境变量

- `PORT` - 服务端口，默认 3000
- `JWT_SECRET` - JWT 签名密钥

## API 接口

### 公开接口

- `GET /` - 健康检查
- `POST /users` - 创建用户

### 需要认证

- `GET /users/:id` - 获取用户信息
- `PUT /users/:id` - 更新用户信息

## 项目结构

```
src/
├── index.js          # 服务入口
├── user.js           # 用户模块
├── utils.js          # 工具函数
├── middleware/
│   └── auth.js       # 认证中间件
└── routes/
    └── userRoutes.js # 用户路由
```
EOF

# 添加到暂存区
git add .

echo -e "${GREEN}✓${NC} 暂存区变更已创建"
echo ""

# 显示暂存区状态
echo -e "${CYAN}📊 暂存区文件列表：${NC}"
echo ""
git diff --cached --stat
echo ""

# 输出使用说明
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}🎉 测试环境准备完成！${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "测试目录: ${CYAN}$TEST_DIR${NC}"
echo ""
echo -e "${YELLOW}测试步骤：${NC}"
echo ""
echo -e "  1. 进入测试目录："
echo -e "     ${CYAN}cd $TEST_DIR${NC}"
echo ""
echo -e "  2. 配置 API（如果还没配置）："
echo -e "     ${CYAN}smart-git-commit --config${NC}"
echo ""
echo -e "  3. 运行工具生成 commit message："
echo -e "     ${CYAN}smart-git-commit${NC}"
echo ""
echo -e "  4. 或者使用静默模式直接提交："
echo -e "     ${CYAN}smart-git-commit -s${NC}"
echo ""
echo -e "${YELLOW}提示：${NC}"
echo -e "  - 历史 commit 使用 Conventional Commits + 中文风格"
echo -e "  - 暂存区有 4 个文件变更（新增认证模块、更新路由等）"
echo -e "  - 工具应该能识别出项目风格并生成类似的 commit message"
echo ""
echo -e "${YELLOW}清理环境：${NC}"
echo -e "  ${CYAN}rm -rf $TEST_DIR${NC}"
echo ""

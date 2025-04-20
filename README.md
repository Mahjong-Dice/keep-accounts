
# 多人记账小程序

这是一个基于微信小程序的多人记账应用，旨在帮助朋友、家人或团队成员轻松管理共同账目。

## 功能特点

- **房间管理**：创建和管理记账房间，邀请他人加入
- **成员管理**：查看房间成员，房主可踢出成员
- **转账功能**：成员之间可以进行转账操作
- **余额查看**：实时显示每个成员的余额状态
- **交易历史**：查看房间内的所有交易记录
- **分享功能**：生成房间二维码，方便分享给他人加入

## 技术栈

### 前端
- Taro 4.0.x (React框架)
- TypeScript
- React Query
- Taro Hooks

### 后端
- Node.js + Express
- Prisma (ORM)
- Docker 容器化部署
- 微信小程序API集成
- PostgreSql 数据库

## 开发环境准备

### 环境要求
- Node.js 14+
- pnpm
- 微信开发者工具

### 安装依赖
```bash
pnpm install
```

### 启动开发服务
```bash
# 开发微信小程序
pnpm dev:weapp

# 开发H5版本
pnpm dev:h5

# 开发其他平台
# 支持 weapp/swan/alipay/tt/h5/rn/qq/jd/quickapp
pnpm dev:[platform]
```

### 构建生产版本
```bash
pnpm build:weapp
```

## 后端服务

### 启动后端服务
```bash
cd server
pnpm install
pnpm dev
```

### 使用Docker启动
```bash
cd server
docker-compose up -d
```

## 项目结构
```
├── src # 前端源代码
│ ├── apis # API接口
│ ├── components # 通用组件
│ ├── hooks # 自定义Hooks
│ ├── pages # 页面
│ │ ├── index # 首页/登录页
│ │ ├── room # 房间/记账页面
│ │ └── profile # 个人信息页面
│ └── styles # 样式文件
├── server # 后端服务
│ ├── app # 应用逻辑
│ ├── middleware # 中间件
│ ├── prisma # 数据库模型
│ ├── services # 业务服务
│ └── utils # 工具函数
└── config # 项目配置
```

## 微信认证流程

1. 通过 `Taro.login` 获取 `code`
2. 后端使用 `code` 调用微信API获取 `openid` 和 `access_token`
3. 将 `openid` 作为用户唯一标识存储

## 路由说明

1. `Taro.navigateTo`：用于页面跳转，可传参，不可跳转tabbar页面
2. `Taro.switchTab`：用于tabbar页面间跳转，不可传参
3. `Taro.reLaunch`：重新加载页面，可跳转任意页面

## 别名配置
1. 在config/index.ts中配置vite的alias即可

## 部署说明

1. 前端部署到微信小程序平台
2. 后端服务使用Docker部署到云服务器

## 常见问题

### Q: 如何处理余额不足的情况？
A: 系统允许负数余额，方便记录欠款情况。

### Q: 如何将房间成员余额清零？
A: 目前需要通过转账方式手动平账，未来版本将添加一键平账功能。

### Q: 房主退出房间后会发生什么？
A: 房主不能直接退出，需要先将房主权限转让给其他成员或者直接删除房间。

## 项目规划

- [ ] 支持多种货币
- [ ] 添加账单分类功能
- [ ] 导出账单为Excel
- [ ] 集成图表统计功能
- [ ] 支持自定义房间主题
- [ ] 添加消息提醒功能

## 版本历史

### v1.0.0
- 基础记账功能
- 成员管理系统
- 转账功能
- 交易历史记录
- 房间分享功能

## 安全说明

- 用户数据仅存储在微信小程序和后端服务器中
- 采用Token验证确保API调用安全
- 定期备份数据库防止数据丢失
- 严格的权限控制确保只有房主可以管理成员

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建Pull Request

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交Issue
- 发送邮件至：[your-email@example.com]

## 致谢

感谢所有为项目贡献代码和意见的开发者。

## 许可证

MIT


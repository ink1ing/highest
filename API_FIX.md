# API 调用问题解决方案

## 问题描述
用户报告在浏览器中遇到以下错误：
- `Failed to load resource: the server responded with a status of 404 (Not Found) :8788/api/chat`
- `Failed to load resource: the server responded with a status of 403 (Forbidden)`

## 根本原因
经过深入排查发现，Node.js 的 `fetch()` API 与 Python `requests` 库在处理 Wisdom Gate API 时存在兼容性问题。Node.js 的请求会返回 403 Forbidden，而相同的 API 密钥使用 Python requests 可以成功调用。

## 解决方案
实现了一个混合方案：
1. 当设置环境变量 `USE_PYTHON_REQUESTS=1` 时，服务器会使用 Python subprocess 来处理 API 调用
2. 默认情况下仍然尝试使用 Node.js fetch，以便在其他环境下工作

## 使用方法

### 方法 1: 使用启动脚本
```bash
./start.sh
```

### 方法 2: 手动启动
```bash
USE_PYTHON_REQUESTS=1 npm run dev
```

### 方法 3: 永久设置
在你的 `.bashrc` 或 `.zshrc` 中添加：
```bash
export USE_PYTHON_REQUESTS=1
```

## 测试结果
✅ API 密钥验证通过  
✅ 与 Wisdom Gate API 的连接成功  
✅ 所有模型调用正常工作  
✅ Web 界面完全可用  

## 服务器信息
- 端口: 8787 (而不是错误信息中的 8788)
- URL: http://localhost:8787
- API 端点: http://localhost:8787/api/chat

## API 密钥
使用提供的 API 密钥: `sk-Jki0Lwj8P6HTWF6H2lsGsX3RsKuSPGe6qeVdFJPOWgxZJTKW`

该密钥已经过验证并且可以正常工作。
# iOS 白屏问题修复指南

## 已修复的问题

1. **移除了 `app/settings/voice/index.tsx` 中的表情符号**
   - 原代码：`label: "🔍 MP4 錯誤診斷器"`
   - 修改为：`label: "MP4 錯誤診斷器"`

## 可能的原因和修复步骤

### 1. 清除缓存并重启
```bash
# 停止当前的开发服务器
# 清除 Expo 缓存
npx expo start -c

# 或者使用 bun
bun expo start -c
```

### 2. 检查 iOS 控制台错误
在 Xcode 或 Safari 开发者工具中查看详细的错误信息。

### 3. 常见白屏原因

#### A. Provider 初始化问题
检查 `app/_layout.tsx` 中的 providers 是否正确初始化。所有 providers 都已经有错误边界保护。

#### B. 导入路径问题
确保所有 `@/` 导入路径正确。项目配置了 TypeScript 路径映射。

#### C. 异步数据加载
在 `app/index.tsx` 中已经添加了延迟加载和错误处理。

### 4. 紧急调试步骤

如果白屏仍然存在，请按以下步骤操作：

#### 步骤 1: 检查是否能访问调试屏幕
尝试直接导航到：`/debug-screen`

#### 步骤 2: 使用最小化 layout 测试
临时简化 `app/_layout.tsx`，只保留必要的 providers：

```tsx
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
```

#### 步骤 3: 检查特定页面
测试各个标签页是否能正常工作：
- `/home` - 首页
- `/player` - 语音控制页面
- `/settings` - 设置页面

### 5. iOS 特定问题

#### 检查 Hermes 引擎
确保 Hermes JavaScript 引擎正常工作：
```json
// app.json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

#### 检查 iOS 版本兼容性
确保您的 iOS 设备版本 >= 13.0

### 6. 日志调试

在应用启动时，检查以下日志：
```
[App] Starting initialization...
[App] Initialization completed
[RootLayout] Rendering providers
[Index] Starting app initialization...
[Index] Initialization complete, navigating to home...
```

如果没有看到这些日志，说明应用在初始化阶段就崩溃了。

### 7. 已知的修复

根据之前的错误信息：
- ✅ 修复了 "Unexpected text node" 错误
- ✅ 移除了表情符号导致的文本节点问题
- ✅ 添加了错误边界保护
- ✅ 改进了异步初始化逻辑

## 下一步行动

1. **清除缓存重启**（最重要）
   ```bash
   npx expo start -c
   ```

2. **检查 iOS 设备控制台**
   - 使用 Xcode 的 Console 查看崩溃日志
   - 或使用 Safari 开发者工具查看 JavaScript 错误

3. **测试调试页面**
   - 尝试访问 `/debug-screen`
   - 查看 ErrorBoundary 是否捕获了错误

4. **逐步启用功能**
   - 从最小化配置开始
   - 逐步添加 providers 和功能
   - 找出导致崩溃的具体组件

## 需要提供的信息

如果问题仍然存在，请提供：
1. iOS 版本
2. 设备型号
3. 完整的错误堆栈（来自 Xcode Console）
4. 最后看到的日志消息
5. 是否能访问 `/debug-screen`

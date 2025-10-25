# Procrastination Killer - 番茄钟应用

一个功能强大、设计精美的番茄工作法（Pomodoro Technique）计时器应用，帮助你保持专注，提高工作效率。

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ 主要功能

### 🎯 核心功能
- **番茄钟计时**：专注时间（默认25分钟）和休息时间（默认5分钟）
- **自动切换**：专注结束后自动切换到休息，休息结束后自动切换回专注
- **状态管理**：支持开始、暂停、继续、重置等操作
- **数据持久化**：配置自动保存到 localStorage

### 🎨 多样化显示风格
提供 5 种精美的倒计时显示方式：
- **Counter Display**：大数字翻转式显示
- **Circular Display**：圆形进度环显示
- **Progress Display**：横向进度条显示
- **Minimal Display**：极简风格显示
- **Digital Display**：数码管风格显示

### 🌓 主题支持
- **亮色主题**：适合日间使用
- **暗色主题**：适合夜间使用，护眼配色
- **系统主题**：自动跟随系统设置
- **实时切换**：支持运行时切换主题

### ⚙️ 个性化设置
- **自定义时长**：调整专注和休息的时长（1-120分钟）
- **主题切换**：在亮色、暗色、系统三种主题间切换
- **显示样式**：选择最喜欢的倒计时显示方式

## 🛠️ 技术栈

### 核心框架
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

### UI 组件
- **Tailwind CSS 4** - 原子化 CSS 框架
- **shadcn/ui** - 高质量组件库
- **Radix UI** - 无障碍组件基座
- **Lucide React** - 图标库

### 动画与交互
- **Motion (Framer Motion)** - 流畅的动画效果
- **CSS Transitions** - 平滑的过渡效果

### 工具库
- **class-variance-authority** - 变体管理
- **clsx** - 条件类名拼接
- **tailwind-merge** - Tailwind 类名合并

## 📦 安装与运行

### 前置要求
- Node.js >= 18
- pnpm >= 8

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```
应用将在 `http://localhost:5173` 启动（端口可能不同）

### 构建生产版本
```bash
pnpm build
```
构建产物将输出到 `dist` 目录

### 预览生产版本
```bash
pnpm preview
```

## 🏗️ 项目结构

```
src/
├── components/          # React 组件
│   ├── timer-displays/  # 倒计时显示组件
│   │   ├── counter-display.tsx
│   │   ├── circular-display.tsx
│   │   ├── progress-display.tsx
│   │   ├── minimal-display.tsx
│   │   └── digital-display.tsx
│   ├── motions/         # 动画组件
│   │   └── counter.tsx
│   ├── settings/        # 设置组件
│   │   └── setting.tsx
│   └── ui/              # UI 基础组件
├── hooks/               # 自定义 Hooks
│   ├── use-countdown.ts
│   ├── use-pomodoro.ts
│   └── use-mobile.ts
├── lib/                 # 工具函数
└── App.tsx              # 主应用组件
```

## 🎯 核心特性详解

### 性能优化
- ✅ 使用 `React.memo` 避免不必要的重新渲染
- ✅ 使用 `useMemo` 缓存计算结果
- ✅ 使用 `useCallback` 稳定回调引用
- ✅ 使用 `useRef` 避免闭包陷阱

### 内存管理
- ✅ 自动清理定时器，防止内存泄漏
- ✅ 自动清理事件监听器
- ✅ 自动清理 MutationObserver

### 代码质量
- ✅ TypeScript 严格类型检查
- ✅ ESLint 代码规范检查
- ✅ 优化的依赖管理
- ✅ 响应式设计支持

## 🔧 配置选项

### localStorage 键名
- `theme`: 主题模式（"light" | "dark" | "system"）
- `focusMinutes`: 专注时长（分钟）
- `breakMinutes`: 休息时长（分钟）
- `displayType`: 显示样式类型

## 📱 响应式支持

应用采用响应式设计，支持多种设备：
- 桌面端：1920px+
- 平板端：768px - 1919px
- 移动端：< 768px

## 🌈 主题配色

### 亮色主题
- 背景：浅灰色
- 文字：深蓝灰色
- 强调色：蓝色

### 暗色主题
- 背景：深蓝黑色
- 文字：浅灰色
- 强调色：柔和的绿青色

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ using React + TypeScript + Vite

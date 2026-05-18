# VoiceMind App - GitHub 在线编译指南

## 🎯 快速开始（5分钟）

### 步骤 1: 创建 GitHub 仓库

1. 打开 https://github.com/new
2. 仓库名称: `voicemind-app`
3. 选择 **Private** (私有)
4. 点击 **Create repository**

### 步骤 2: 上传代码

在创建好的仓库页面：

1. 点击 **uploading an existing file**
2. 将本文件夹的所有文件拖入上传区域
3. 点击 **Commit changes**

### 步骤 3: 触发构建

1. 进入仓库的 **Actions** 标签
2. 点击 **I understand my workflows, go ahead and enable them**
3. 点击左侧 **Build Android APK**
4. 点击 **Run workflow** → **Run workflow**
5. 等待构建完成（约10-15分钟）

### 步骤 4: 下载 APK

1. 构建完成后，点击 workflow 运行
2. 在 **Artifacts** 部分点击 **voicemind-apk**
3. APK 会自动下载

---

## 📁 文件说明

```
├── .github/workflows/build-apk.yml  # GitHub Actions 自动构建配置
├── src/pages/voicemind/             # 应用页面源码
│   ├── VoiceMindHome.tsx           # 首页
│   ├── RecordingsScreen.tsx         # 录音记录
│   ├── AIChatScreen.tsx            # AI对话
│   ├── PersonsScreen.tsx           # 人物管理
│   └── SettingsScreen.tsx         # 设置页面
├── android/                         # Android 原生代码
│   └── app/src/main/java/fun/upup/musicfree/voicemind/
│       ├── VoiceModule.java         # 录音原生模块
│       └── VoiceModulePackage.java  # 模块注册
└── Voicemind-APP/                  # 需求文档
    └── requirements.md
```

---

## 🔧 自定义配置

### 修改应用名称

编辑 `android/app/src/main/res/values/strings.xml`：
```xml
<string name="app_name">你的应用名</string>
```

### 修改包名

编辑 `android/app/build.gradle`：
```gradle
namespace "com.yourcompany.voicemind"
applicationId "com.yourcompany.voicemind"
```

### 修改图标

替换 `android/app/src/main/res/mipmap-*/` 下的图标文件

---

## 📱 已实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| 录音功能 | ✅ | 一键开始/停止录音 |
| 录音记录 | ✅ | 查看和管理录音 |
| AI对话 | ✅ | 智能问答界面 |
| 人物管理 | ✅ | 联系人管理 |
| 设置中心 | ✅ | 录音和主题设置 |
| 深色模式 | ✅ | 明暗主题切换 |
| 本地存储 | ✅ | 数据不上云 |

---

## 🛠️ 本地开发

如果需要本地调试：

```bash
# 安装依赖
npm install
# 或
yarn install

# 运行调试
npm run android
# 或
yarn android

# 打包 APK
cd android
./gradlew assembleDebug
```

---

## 📞 问题排查

### 构建失败？

检查：
1. Workflow 日志中的具体错误信息
2. 是否缺少必要的 secrets
3. Android SDK 版本是否正确

### APK 无法安装？

1. 确认手机已开启"安装未知来源应用"
2. 检查 APK 签名是否匹配
3. 确认 Android 版本兼容性

---

## 🎉 完成！

按照以上步骤，你将获得一个可以直接安装的 APK 文件。

**祝你使用愉快！** 🚀

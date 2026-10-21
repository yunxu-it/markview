# 项目手册

把项目说明、开发笔记和任务清单，整理成清晰易读的文档。

## 项目概览

这份示例展示 **墨览 · MarkView** 的阅读界面：章节目录和文件树自由切换，正文充分利用可用宽度。

### 本周计划

- [x] 整理项目说明
- [x] 完成接口文档
- [ ] 更新发布记录

### 模块清单

| 模块 | 内容 | 状态 |
| --- | --- | --- |
| 文档中心 | 使用指南与开发手册 | 已完成 |
| 阅读体验 | 章节导航与可折叠目录 | 已完成 |
| 发布计划 | 文档校对与版本归档 | 进行中 |

## 开发笔记

### 配置示例

```javascript
const project = {
  name: "MarkView",
  version: "1.3.0",
  local: true
};
```

### 阅读提示

> 点击左侧章节标题快速跳转。收起目录后，正文会自动占满可用宽度。

## 发布记录

### 1.3.0

- 点击扩展图标调整界面语言、五套主题和正文宽度
- 设置保存后同步到已打开的预览页
- 从当前文档打开打印预览，再选择“另存为 PDF”
- 保留文件树、目录记忆与阅读位置恢复

## 双语与代码

切换到 English 后，这段正文仍然保留中文。Code and file names stay in their original language.

```powershell
$deviceSerial = 'demo-001'
if ([string]::IsNullOrWhiteSpace($deviceSerial)) {
    Write-Warning "请设置设备：$deviceSerial"
}
```
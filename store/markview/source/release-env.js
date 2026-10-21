/* 仅用于商店素材：模拟扩展 API，界面与文档均由当前运行源码渲染；不随扩展打包。 */
(() => {
  const script = new URL(document.currentScript.src);
  const options = new URLSearchParams(location.search || script.search);
  const language = options.get('language') === 'en' ? 'en' : 'zh-CN';
  const theme = ['github', 'warm', 'dark', 'report', 'bear'].includes(options.get('theme')) ? options.get('theme') : 'github';
  const root = new URL('../../../markdown-preview/', script);
  const settings = { language, theme, articleMaxWidth: 0, sidebarHidden: false };
  const listeners = new Set();
  globalThis.chrome = {
    i18n: { getUILanguage: () => language },
    storage: {
      local: {
        get: async keys => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(key => [key, settings[key]])),
        set: async values => {
          const changes = Object.fromEntries(Object.entries(values).map(([key, newValue]) => [key, { oldValue: settings[key], newValue }]));
          Object.assign(settings, values);
          listeners.forEach(listener => listener(changes, 'local'));
        },
        remove: async key => { delete settings[key]; }
      },
      onChanged: { addListener: listener => listeners.add(listener) }
    },
    runtime: {
      id: 'markview-store-preview',
      getURL: path => new URL(path, root).href,
      onMessage: { addListener() {} },
      sendMessage: async message => message.type === 'markview:pdf:status' ? { canExport: true, documentVersion: 1 } : { ok: true, top: 0 }
    },
    tabs: {
      query: async () => [{ id: 1 }], getCurrent: async () => ({ id: 1 }), create: async () => ({ id: 2 }),
      sendMessage: async () => ({ canExport: true, documentVersion: 1 })
    }
  };
  const source = document.querySelector('body > pre');
  if (source && language === 'en') source.textContent = '# Project handbook\n\nRead project notes, browse local files, and keep your preferred reading style.\n\n## Overview\n\nMarkView brings your Markdown documents into a focused reading view. Use **Outline** to jump between sections or **Files** to browse a folder.\n\n### Release checklist\n\n- [x] Add English and Chinese interfaces\n- [x] Provide five reading themes\n- [x] Adjust the maximum content width\n- [ ] Review the final PDF before sharing\n\n### Reading styles\n\n| Theme | Best suited for |\n| --- | --- |\n| Classic Light | Project documentation |\n| Warm Paper | Long notes and articles |\n| Soft Dark | Low-light reading |\n| Serif Report | Formal documents |\n| Crimson Minimal | Compact reading |\n\n## Code notes\n\n```javascript\nconst document = {\n  name: "Project handbook",\n  version: "1.3.0",\n  local: true\n};\nfunction openDocument(file) {\n  return file.text();\n}\n```\n\n## Save a PDF\n\n> Open reading settings from the extension icon, choose Export PDF, and then select Save as PDF in print preview.\n\nYour document text and code remain in their original language.';
  if (source && options.get('scene') === 'code') source.textContent = language === 'en'
    ? '# Development notes\n\nRead code with compact blocks and copy the original text.\n\n## JavaScript\n\n```javascript\nconst options = { name: "MarkView", version: "1.3.0" };\nasync function readDocument(file) {\n  // Keep document content on this device.\n  return await file.text();\n}\n```\n\n## PowerShell\n\n```powershell\n$deviceSerial = "demo-001"\n$appPid = adb -s $deviceSerial shell pidof com.example.app\nif ([string]::IsNullOrWhiteSpace($appPid) -or $appPid -eq $null) {\n    Write-Warning "Process not found: $deviceSerial"\n} else {\n    adb -s $deviceSerial logcat "--pid=$appPid"\n}\n```\n\n## Share a PDF\n\n> Export PDF opens browser print preview. Choose Save as PDF and review the page layout before saving.'
    : '# 开发笔记\n\n用紧凑的代码块阅读示例，复制时保留代码原文。\n\n## JavaScript\n\n```javascript\nconst options = { name: "MarkView", version: "1.3.0" };\nasync function readDocument(file) {\n  // 文档内容仅在当前设备处理。\n  return await file.text();\n}\n```\n\n## PowerShell\n\n```powershell\n$deviceSerial = "demo-001"\n$appPid = adb -s $deviceSerial shell pidof com.example.app\nif ([string]::IsNullOrWhiteSpace($appPid) -or $appPid -eq $null) {\n    Write-Warning "未找到进程：$deviceSerial"\n} else {\n    adb -s $deviceSerial logcat "--pid=$appPid"\n}\n```\n\n## 分享 PDF\n\n> 导出 PDF 会打开浏览器打印预览。选择“另存为 PDF”，并在保存前检查页面排版。';
  globalThis.MarkViewStoreDemo = { language, scene: options.get('scene'), source: source?.textContent };
})();
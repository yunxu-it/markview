/* 公开示例通过现有兼容文件选择入口呈现文件树，不模拟操作系统授权结果。 */
(() => {
  if (globalThis.MarkViewStoreDemo.scene !== 'files') return;
  const documents = [
    ['项目手册/README.md', MarkViewStoreDemo.source],
    ['项目手册/指南/快速开始.md', '# 快速开始\n\n选择文件或文件夹，开始阅读。'],
    ['项目手册/指南/阅读技巧.md', '# 阅读技巧\n\n切换主题、宽度与语言，选择合适的阅读方式。'],
    ['项目手册/开发/接口说明.md', '# 接口说明\n\n项目接口的请求与响应示例。'],
    ['项目手册/开发/配置指南.md', '# 配置指南\n\n本地项目配置说明。'],
    ['项目手册/CHANGELOG.md', '# 更新记录\n\n## 1.3.0\n\n阅读设置、主题、双语界面和 PDF 打印入口。']
  ];
  const transfer = new DataTransfer();
  for (const [path, text] of documents) {
    const file = new File([text], path.split('/').pop(), { type: 'text/markdown' });
    Object.defineProperty(file, 'webkitRelativePath', { value: path });
    transfer.items.add(file);
  }
  const input = document.getElementById('folder-input');
  input.files = transfer.files;
  document.getElementById('view-files').click();
  input.dispatchEvent(new Event('change'));
  document.querySelectorAll('#files details').forEach(details => { details.open = true; });
  [...document.querySelectorAll('#files button')].find(button => button.textContent === 'README.md').click();
})();
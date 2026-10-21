/* 商店截图入口：公开演示文件通过兼容选择器注入，界面由实际扩展源码渲染。 */
(() => {
  const source = document.querySelector('pre').textContent;
  globalThis.chrome ??= {};
  chrome.runtime ??= { getURL: () => new URL('../../../markdown-preview/', location.href).href };
  document.addEventListener('DOMContentLoaded', () => {
    const documents = [
      ['项目手册/README.md', source],
      ['项目手册/指南/快速开始.md', '# 快速开始\n\n选择文件或文件夹，开始阅读。'],
      ['项目手册/指南/阅读技巧.md', '# 阅读技巧\n\n切换章节与文件树，快速定位文档。'],
      ['项目手册/开发/接口说明.md', '# 接口说明\n\n项目接口的请求与响应示例。'],
      ['项目手册/开发/配置指南.md', '# 配置指南\n\n本地项目配置说明。'],
      ['项目手册/CHANGELOG.md', '# 更新记录\n\n## 1.2.0\n\n文件树、目录记忆与侧栏样式更新。']
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
  });
})();
/* 读取真实 popup.html，在截图专用 iframe 中提供演示 API，不重写或拼接产品控件。 */
(async () => {
  const query = location.search;
  document.querySelector('.reader').src = 'release-scene.html' + query;
  const base = new URL('../../../markdown-preview/', location.href).href;
  const environment = new URL('release-env.js' + query, location.href).href;
  const response = await fetch(new URL('popup.html', base));
  const html = await response.text();
  document.querySelector('.settings').srcdoc = html.replace('<head>', '<head><base href="' + base + '"><script src="' + environment + '"></script>');
})();
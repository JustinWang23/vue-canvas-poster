// 重写alert框 去掉头部IP信息
window.alert = function (name) {
  var iframe = document.createElement('IFRAME')
  iframe.style.display = 'none'
  iframe.setAttribute('src', 'data:text/plain,')
  document.documentElement.appendChild(iframe)
  window.frames[0].window.alert(name)
  iframe.parentNode.removeChild(iframe)
}
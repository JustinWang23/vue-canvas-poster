<template>
  <div id="app">
    <!-- <img src="./assets/logo.png"> -->
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App',
  created () {
    // 禁止在微信浏览器中的回弹效果
    document.querySelector('body').addEventListener('touchmove', (ev) => {
      ev.preventDefault()
    }, false)
  }
}
</script>

<style>
* {
  padding: 0;
  margin: 0;
}
html,body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
  width: 100%;
}
</style>

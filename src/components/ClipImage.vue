<template>
  <div class="full-screen">
    <canvas ref="myCanvas" v-show="!imgIsLoaded"></canvas>
    <img class="full-screen" ref="myImg" v-show="imgIsLoaded"/>
    <div class="cover full-screen fixed" v-show="hintIsShow" @click="closeHint">
      <img class="save_hint" src="../assets/save.png">
    </div>
    <div class="toolkit fixed" v-show="!nameIsLoaded && !imgIsLoaded">
      <div class="tookit_item" @click="goBack">
        <img class="arrow" src="../assets/arrow.png">
      </div>
      <div class="tookit_item">
        <img class="template_background" :class="{'checked': templateIndex === 1}" src="../assets/template1.png" @click="changeTemplate(1)">
      </div>
      <div class="tookit_item">
        <img class="template_background" :class="{'checked': templateIndex === 2}" src="../assets/template2.png" @click="changeTemplate(2)">
      </div>
      <div class="tookit_item">
        <img class="template_background" :class="{'checked': templateIndex === 3}" src="../assets/template3.png" @click="changeTemplate(3)">
      </div>
      <div class="tookit_item" @click="saveImage">
        <span class="next">下一步</span>
      </div>
    </div>
    <div class="toolkit fixed" v-show="nameIsLoaded">
      <div class="tookit_item" @click="goPrevious">
        <img class="arrow" src="../assets/arrow.png">
      </div>
      <div class="tookit_item"></div>
      <div class="tookit_item"></div>
      <div class="tookit_item"></div>
      <div class="tookit_item" @click="generatePost">
        <span class="next">下一步</span>
      </div>
    </div>
    <div class="keyword fixed" :class="keywordClass" @click="editName" v-show="nameIsLoaded">
      <input ref="keyword" type="text" v-model="keyword" @blur.prevent="handleKeyword" @focus="handleKeywordFocus">
    </div>
  </div>
</template>

<script>
import '../utils.js'

export default {
  name: 'ClipImage',
  data () {
    return {
      canvas: null,
      ctx: null,
      img: new Image(),
      bgimg: new Image(),
      imgIsLoaded: false,
      nameIsLoaded: false,
      hintIsShow: false,
      imgX: 0,
      imgY: 0,
      imgWidth: 0,
      imgHeight: 0,
      imgScale: 1,
      backgroundImage: require('../assets/template1.png'),
      keyword: '请输入您的姓名',
      templateIndex: 1
    }
  },
  mounted () {
    this.canvas = this.$refs.myCanvas
    // 获取屏幕可见宽度和高度 防止在有导航栏的情况下 全屏拉伸导致的比例问题
    this.canvas.width = document.documentElement.clientWidth * window.devicePixelRatio
    this.canvas.height = document.documentElement.clientHeight * window.devicePixelRatio
    // 再通过css将canvas缩放到全屏 防止canvas的内容失真
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.ctx = this.canvas.getContext('2d')

    this.loadImg()
    this.loadTemplate()
  },
  watch: {
    keyword (nv, ov) {
      this.drawImage()
    }
  },
  computed: {
    keywordClass () {
      return {
        right_1: this.templateIndex === 1,
        left_2: this.templateIndex === 2,
        left_3: this.templateIndex === 3
      }
    }
  },
  methods: {
    loadImg () {
      // 加载底层上传的图片
      this.img.src = sessionStorage.getItem('uploadImage')
      // 解决上传非项目路径下图片的跨域问题
      this.img.crossOrigin = 'Anonymous'
      // this.img.src = require('../assets/test.jpeg')
      this.img.onload = ($this) => {
        // 获取长宽各自撑满全屏的缩放比
        var maxScaleX = 750 / this.img.width
        var maxScaleY = 1334 / this.img.height
        // 取两者中大的值
        let maxScale = maxScaleX > maxScaleY ? maxScaleX : maxScaleY
        // 根据缩放比 进行缩放 保证长和宽都撑满屏幕
        this.imgWidth = this.img.width * maxScale
        this.imgHeight = this.img.height * maxScale

        this.drawImage()
        this.drag()
      }
    },
    loadTemplate () {
      // 加载上层模版
      this.bgimg.src = this.backgroundImage
      this.bgimg.onload = ($this) => {
        this.drawTemplate()
      }
    },
    drawImage () {
      // 清除canvas内容
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // 绘画底层上传图片
      this.ctx.drawImage(this.img, this.imgX, this.imgY, this.imgWidth * this.imgScale, this.imgHeight * this.imgScale)
      // 绘画上层模版
      this.drawTemplate()
    },
    drawTemplate () {
      this.ctx.drawImage(this.bgimg, 0, 0, this.canvas.width, this.canvas.height)
    },
    drawName () {
      // 设置文字的字体大小
      var fontSize = 16 * window.devicePixelRatio
      this.ctx.font = 'bold ' + fontSize + 'px SimSun'
      // 设置文字的颜色
      this.ctx.fillStyle = '#172A88'
      // 设置文字的对齐方式
      this.ctx.textAlign = 'center'
      // 设置文字具体坐标位置
      var textX
      var textY
      switch (this.templateIndex) {
        case 1:
          textX = this.canvas.width * 3.16 / 4
          textY = this.canvas.height * 6.08 / 11
          break
        case 2:
          textX = this.canvas.width * 0.68 / 4
          textY = this.canvas.height * 6.03 / 11
          break
        case 3:
          textX = this.canvas.width * 0.80 / 4
          textY = this.canvas.height * 5.93 / 11
          break
        default:
      }
      // 绘画字体
      this.ctx.fillText(this.keyword, textX, textY)
    },
    drag () {
      let draging = false

      // 记录初始点击的pageX，pageY。用于记录位移
      let pageX = 0
      let pageY = 0

      // 初始位移
      let startX = 0
      let startY = 0

      // 记录双指缩放的距离
      let scaleX = 0
      let scaleY = 0

      this.canvas.addEventListener('touchstart', (ev, $this) => {
        let e = ev.touches[0]
        let e2 = ev.touches[1]
        let finger = ev.touches.length

        draging = true

        if (finger === 2) {
          this.imgWidth = this.imgWidth * this.imgScale
          this.imgHeight = this.imgHeight * this.imgScale

          scaleX = Math.pow(e.pageX - e2.pageX, 2) + Math.pow(e.pageY - e2.pageY, 2)
        } else if (finger === 1) {
          pageX = e.pageX
          pageY = e.pageY

          startX = this.imgX
          startY = this.imgY
        }
      })

      this.canvas.addEventListener('touchmove', (ev, $this) => {
        let e = ev.touches[0]
        let e2 = ev.touches[1]
        let finger = ev.touches.length

        if (draging) {
          if (finger === 2) {
            scaleY = Math.pow(e.pageX - e2.pageX, 2) + Math.pow(e.pageY - e2.pageY, 2)
            this.imgScale = Math.sqrt(scaleY) / Math.sqrt(scaleX)
          } else if (finger === 1) {
            this.imgX = e.pageX - pageX + startX
            this.imgY = e.pageY - pageY + startY
          }

          this.drawImage()
        }
      })
      this.canvas.addEventListener('touchend', ($this) => {
        draging = false
      })
    },
    changeTemplate (index) {
      switch (index) {
        case 1:
          this.backgroundImage = require('../assets/template1.png')
          this.templateIndex = 1
          break
        case 2:
          this.backgroundImage = require('../assets/template2.png')
          this.templateIndex = 2
          break
        case 3:
          this.backgroundImage = require('../assets/template3.png')
          this.templateIndex = 3
          break
        default:
      }
      this.bgimg.src = this.backgroundImage
      this.bgimg.onload = ($this) => {
        this.drawImage()
      }
    },
    editName () {
      if (this.keyword === '请输入您的姓名') {
        this.keyword = ''
      }
    },
    goBack () {
      this.$router.go(-1)
    },
    goPrevious () {
      this.changeTemplate(this.templateIndex)
      this.nameIsLoaded = false
    },
    saveImage () {
      switch (this.templateIndex) {
        case 1:
          this.backgroundImage = require('../assets/1.png')
          break
        case 2:
          this.backgroundImage = require('../assets/2.png')
          break
        case 3:
          this.backgroundImage = require('../assets/3.png')
          break
        default:
      }
      this.bgimg.src = this.backgroundImage
      this.bgimg.onload = ($this) => {
        this.drawImage()
        this.nameIsLoaded = true
      }
    },
    generatePost () {
      if (this.keyword !== '请输入您的姓名') {
        if (this.keyword.length > 10) {
          alert('最多输入10个字')
          return
        }
        this.drawName()
      } else {
        alert('请填写姓名～')
        return
      }
      this.$refs.myImg.src = this.canvas.toDataURL('image/png')
      this.imgIsLoaded = true
      this.nameIsLoaded = false
      this.hintIsShow = true
    },
    closeHint () {
      this.hintIsShow = false
    },
    // 当输入姓名为空是 重置输入框文字
    handleKeyword () {
      if (this.keyword === '') {
        this.keyword = '请输入您的姓名'
      }
    },
    // 点击输入框的时候 停止动画
    handleKeywordFocus () {
      // iOS的animation-play-state设置pause无效 因此直接覆盖animation属性为none 来停止动画
      this.$refs.keyword.style.animation = 'none'
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.full-screen {
  width: 100%;
  height: 100%;
}
.cover {
  top: 0;
  left: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}
.toolkit {
  bottom: 0;
  background: linear-gradient(rgba(255,255,255,0), rgba(0,0,0,0.9));
  height: 90px;
  width: 100%;
  display: flex;
}
.tookit_item {
  width: 20%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 17px;
}
.checked {
  border: 2px solid;
  border-color: #BD204F;
}
.template_background {
  width: 30px;
  height: 50px;
  background-color: white;
}
.fixed {
  position: fixed;
}
.next {
  margin-left: -15px;
}
.save_hint {
  margin-top: -20px;
  width: 240px;
  height: 75px;
}
.arrow {
  width: 20px;
  height: 20px;
}
.keyword {
  width: 120px;
  color: #000;
  height: 23px;
  background-color: #fff;
}
.right_1 {
  right: 5.3%;
  top: 52.5%;
}
.left_2 {
  left: 1%;
  top: 52%;
}
.left_3 {
  left: 3%;
  top: 51.2%;
}
.keyword input {
  text-align: center;
  width: 120px;
  background-color: transparent;
  border-color: transparent;
  animation: fade 2.5s infinite;
}
@keyframes fade {
  from {opacity: 1.0;}
  50% {opacity: 0;}
  to {opacity: 1.0;}
}
</style>

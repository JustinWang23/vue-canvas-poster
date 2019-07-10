<template>
  <div class="wrapper" :style="wrapper">
    <span class="fileinput_button" :style="uploadDiv">
      <span>上传</span>
      <input type="file" accept="image/gif,image/jpeg,image/jpg,image/png" name="img" @change="uploadImage($event)"/>
    </span>
  </div>
</template>

<script>
import EXIF from '../utils/exif.js'

export default {
  name: 'UploadFile',
  data () {
    return {
      wrapper: {
        backgroundImage: 'url(' + require('../assets/background.png') + ')',
        backgroundSize: '100% 100%'
      },
      uploadDiv: {
        backgroundImage: 'url(' + require('../assets/upload.png') + ')',
        backgroundSize: '100% 100%'
      },
      img: new Image(),
      orientation: null
    }
  },
  methods: {
    uploadImage (event) {
      let t = this
      let reader = new FileReader()
      let file = event.target.files[0]
      // 图片大小的控制
      if (file.size > 3 * 1024 * 1024) {
        alert('上传的图片过大，请重新选择')
        return
      }
      // 获取上传图片的朝向
      EXIF.getData(file, function () {
        t.orientation = EXIF.getTag(this, 'Orientation')
      })

      reader.onload = (e) => {
        t.img.src = e.target.result
        t.img.onload = () => {
          var imgWidth = t.img.width
          var imgHeight = t.img.height
          // 控制上传图片的宽高
          if (imgWidth > imgHeight && imgWidth > 750) {
            imgWidth = 750
            imgHeight = Math.ceil(750 * t.img.height / t.img.width)
          } else if (imgWidth < imgHeight && imgHeight > 1334) {
            imgWidth = Math.ceil(1334 * t.img.width / t.img.height)
            imgHeight = 1334
          }

          var canvas = document.createElement('canvas')
          var ctx = canvas.getContext('2d')
          canvas.width = imgWidth
          canvas.height = imgHeight

          // 针对某些机型上取到图片朝向不对的处理
          if (t.orientation && t.orientation !== 1) {
            switch (t.orientation) {
              case 6: // 旋转90度
                canvas.width = imgHeight
                canvas.height = imgWidth
                ctx.rotate(Math.PI / 2)
                // (0,-imgHeight) 从旋转原理图那里获得的起始点
                ctx.drawImage(t.img, 0, -imgHeight, imgWidth, imgHeight)
                break
              case 3: // 旋转180度
                ctx.rotate(Math.PI)
                ctx.drawImage(t.img, -imgWidth, -imgHeight, imgWidth, imgHeight)
                break
              case 8: // 旋转-90度
                canvas.width = imgHeight
                canvas.height = imgWidth
                ctx.rotate(3 * Math.PI / 2)
                ctx.drawImage(t.img, -imgWidth, 0, imgWidth, imgHeight)
                break
            }
          } else {
            ctx.drawImage(t.img, 0, 0, imgWidth, imgHeight)
          }
          // 生成图片的base64 并进行压缩
          sessionStorage.setItem('uploadImage', canvas.toDataURL('image/png', 0.5))
          // 路由跳转
          this.$router.push('/ClipImage')
        }
      }
      // 读取上传的文件
      reader.readAsDataURL(file)
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fileinput_button {
  position: relative;
  display: inline-block;
  overflow: hidden;
  width: 160px;
  height: 50px;
  margin-top: 28%;
}
.fileinput_button input {
  position: absolute;
  right: 0;
  top: 0;
  opacity: 0;
  width: 160px;
  height: 50px;
}
.fileinput_button span {
  visibility: hidden;
}
</style>

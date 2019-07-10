# Vue通过Canvas生成海报

前几天公司年会要做一个需求，在移动端上传图片并生成封面海报，中间还涉及图片的移动和缩放。

由于之前的海报都是交给后台JAVA来生产的，原理类似于打水印，正巧前段时间看了Canvas，很有意思，所以这个需求就用纯前端实现了一下。

这几天整理了一下代码，总结一下中间遇到的坑和经验。

## 演示

[在线演示](https://justinwang23.github.io/Vue-Canvas-Poster/)

## 安装

``` bash
# 安装依赖
npm install

# 启动本地调试环境
npm run dev

# 生成打包部署文件
npm run build
```

## 获取图片

### 上传

很简单 一个类型为file的input就可以搞定了

``` 
<input type="file" accept="image/gif,image/jpeg,image/jpg,image/png" name="img" @change="uploadImage($event)"/>

```

accept属性用来限制上传的图片类型，可以是图片也可以是视频，这里需求只要求图片，因此只接受gif，jpg，jpeg和png格式的图片

<b>其实也可以用accept="image/*"来实现，但在实际使用中，发现这么写会导致一定的卡顿，原因大致是在作判断前需要先遍历一遍所有的image类型，所以这里指定了几个图片类型。</b>

至于上传按钮的样式，可以通过CSS进行处理，来达到你想要的效果。

### 接收

这里用到了FileReader的readAsDataURL方法,将上传的图片转化成一串URL，也就是图片的Base64编码。

```
let reader = new FileReader()
let file = event.target.files[0]
// 读取上传的文件
reader.readAsDataURL(file)
reader.onload = (e) => {
	// 获取图片的Base64编码
	t.img.src = e.target.result
}
```

### 处理

获取到图片后，接下来还要进行一下处理，比如，限制一下图片的大小。

```
// 图片大小的控制，不能超过3M
if (file.size > 3 * 1024 * 1024) {
	alert('上传的图片过大，请重新选择')
	return
}
```

将图片的宽高进行一下同比缩放，更好的适应手机的屏幕。

```
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
}
```

<b>本来以为这样就结束了，但是在后期测试的时候，发现在某些iOS和android手机上，上传的图片会被翻转90度，查了一下，是某些机型的bug，因此，需要将图片再翻转回来。

由于后续生成海报的话还需要在上传图片的基础上再覆盖一层模版，所以无法简单的通过之后的手势来进行图片的旋转。

因此这里我们在上传的时候就对图片进行处理，用到了一个exif.js，用于判断图片的orientation，再根据orientation将图片翻转一下。</b>

```
// 获取上传图片的朝向
EXIF.getData(file, function () {
	t.orientation = EXIF.getTag(this, 'Orientation')
})

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
```
<b>这里还要注意一下翻转后的坐标，由于翻转后可视区域变了，因此要将坐标做相应的平移。</b>

### 图片压缩

由于手机拍出来的照片可能过大，并且转成base64后会导致图片的Size进一步变大，因此，通过 canvas.toDataURL() 方法来压缩照片质量。

```
canvas.toDataURL('image/png', 0.5)
```

toDataURL() 方法一共有两个参数，第一个参数为图片格式，默认为 image/png。第二个参数为压缩质量，可以从 0 到 1 的区间内选择图片的质量。

## 图片编辑

### 创建Canvas

首先，需要先创建一个Canvas对象，将图片绘画上去。

```
<canvas ref="myCanvas"></canvas>

mounted () {
	this.canvas = this.$refs.myCanvas
	// 获取屏幕可见宽度和高度 防止在有导航栏的情况下 全屏拉伸导致的比例问题
	this.canvas.width = document.documentElement.clientWidth * window.devicePixelRatio
	this.canvas.height = document.documentElement.clientHeight * window.devicePixelRatio
	// 再通过css将canvas缩放到全屏 防止canvas的内容失真
	this.canvas.style.width = '100%'
	this.canvas.style.height = '100%'
	this.ctx = this.canvas.getContext('2d')
}
```

<b>这里最早直接通过CSS将Canvas的width和height设置成全屏，也就是100%之后，发现绘出来的图片非常模糊，而且图片的比例也不对，原因是，Canvas默认是300px\*150px的，CSS改变宽高其实是先生成了一个300px\*150px的Canvas，然后再拉伸到CSS设置的宽度和高度，自然会模糊以及比例不对。

解决方案也很简单，先设置Canvas的宽高属性，可以设置为实际大小的2倍，再通过css缩小到实际大小，我们这里设置为可见区域的像素值乘以屏幕的像素比。</b>

### 绘制图片

接着，将图片绘制到Canvas中，通过Canvas里content对象的drawImage方法。

```
this.img.src = sessionStorage.getItem('uploadImage')
this.img.onload = ($this) => {
	this.drawImage()
	this.drag()
}

drawImage () {
	// 清除canvas内容
	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	// 绘画底层上传图片
	this.ctx.drawImage(this.img, this.imgX, this.imgY, this.imgWidth * 	this.imgScale, this.imgHeight * this.imgScale)
	// 绘画上层模版
	this.drawTemplate()
}
```

drawImage一共有三个方法，分别是：

```
drawImage(img, X, Y)

drawImage(img, X, Y, newWidth, newHeight)

drawImage(img, clipX, clipY, clipWidth, clipHeight, X, Y, newWidth, newHeight)
```

由于我们不需要对图片进行剪裁，所以我们选择了第二个方法，对图片的起点坐标和大小进行修改。

需要对图片进行剪裁的话，请选择第三个方法。

### 绘制模版

在绘制完图片之后，再绘制模版，这里顺序要注意，后绘制的东西会在上层。

```
drawTemplate () {
	this.ctx.drawImage(this.bgimg, 0, 0, this.canvas.width, this.canvas.height)
}
```

### 添加手势

绘制完成后，就要添加手势操作了，让图片可以调整位置和大小。

首先是图片的位置

```
let draging = false

// 记录初始点击的pageX，pageY。用于记录位移
let pageX = 0
let pageY = 0

// 初始位移
let startX = 0
let startY = 0

this.canvas.addEventListener('touchstart', (ev, $this) => {
	let e = ev.touches[0]

	draging = true

	pageX = e.pageX
	pageY = e.pageY

	startX = this.imgX
	startY = this.imgY
})

this.canvas.addEventListener('touchmove', (ev, $this) => {
	let e = ev.touches[0]
	
	if (draging) {
		this.imgX = e.pageX - pageX + startX
		this.imgY = e.pageY - pageY + startY
		this.drawImage()
	}
})

this.canvas.addEventListener('touchend', ($this) => {
	draging = false
})
```

这里，用到了移动端的touch事件，在touchstart的时候，将上一次图片的起始坐标赋给startX、startY，而pageX、pageY用于记录手指拖动的起始坐标。

在touchmove的时候，将手指拖动后的坐标减去拖动前的初始坐标再加上图片本身的初始坐标，就是拖拽后的实际坐标了。

接着是手势缩放

```
let draging = false

// 记录双指缩放的距离
let scaleX = 0
let scaleY = 0

this.canvas.addEventListener('touchstart', (ev, $this) => {
	let e = ev.touches[0]
	let e2 = ev.touches[1]

	draging = true

	this.imgWidth = this.imgWidth * this.imgScale
	this.imgHeight = this.imgHeight * this.imgScale

	scaleX = Math.pow(e.pageX - e2.pageX, 2) + Math.pow(e.pageY - e2.pageY, 2)
})

this.canvas.addEventListener('touchmove', (ev, $this) => {
	let e = ev.touches[0]
	let e2 = ev.touches[1]

	if (draging) {
		scaleY = Math.pow(e.pageX - e2.pageX, 2) + Math.pow(e.pageY - e2.pageY, 2)
		this.imgScale = Math.sqrt(scaleY) / Math.sqrt(scaleX)

		this.drawImage()
	}
})
this.canvas.addEventListener('touchend', ($this) => {
	draging = false
})
```

原理也很简单，就是先计算手势缩放前两个手指间的距离，再计算缩放后两个手指间的距离，最后将两个距离相除，得出缩放的比例，在绘制图片的时候，将图片的长和宽分别乘以比例就行了。

最终，完整的代码如下：

```
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
}
```

### 绘制文字

在绘制文字的时候，canvas提供了一个属性叫textAlign，可以使绘制的文字根据给定的坐标居中绘制，只需要计算中轴线的X坐标即可，方便了许多。

```
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
}
```

这里由于需求有三个模版，因此按屏幕比例给定了三个不同的文字起始坐标，实际的坐标可以根据具体情况自行进行计算。

### 生成海报

同样通过toDataURL()方法将canvas的内容转化成包含图片展示的 data URI，再将这个URI赋给图片的src。

```
generatePost () {
	this.$refs.myImg.src = this.canvas.toDataURL('image/png')
}
```
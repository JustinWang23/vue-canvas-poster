import Vue from 'vue'
import Router from 'vue-router'
import UploadFile from '@/components/UploadFile'
import ClipImage from '@/components/ClipImage'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'UploadFile',
      component: UploadFile
    },
    {
      path: '/clipImage',
      name: 'ClipImage',
      component: ClipImage
    }
  ]
})

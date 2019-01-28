import Vue from 'vue'
import Router from 'vue-router'
import Login from '@/components/login'
import Home from '@/components/Layout/Layout'
import Setting from '@/components/usersManagement'

Vue.use(Router)


const router = new Router({
  routes: [
    {
      path: '/',
      name:'layout',
      meta:{
        requireAuth:true
      },
      component:Home
    },{
      path:'/login',
      component:Login
    },{
      path:'/usersManagement',
      component:Setting,
      meta:{
        requireAuth:true
      }
    }
  ]
})


//判断是否需要登录权限、以及是否登录
/*router.beforeEach((to, from, next) => {
  // 若userkey不存在并且前往页面不是登陆页面，进入登陆
  // 若userkey存在并且前往登陆页面，进入主页
  const userKey = window.sessionStorage.getItem('userName')
  if (!userKey && to.path !== '/login') {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (userKey && to.path === '/login') {
    next({ path: '/' })
  } else {
    next()
  }
})
*/

export default router

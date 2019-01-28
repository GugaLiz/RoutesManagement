// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import Element from 'element-ui'
import axios from 'axios'
import 'element-ui/lib/theme-chalk/index.css'
import './assets/style.less'
import {
  Message,
  Loading
} from 'element-ui'

Vue.config.productionTip = false

Vue.use(Element)
Vue.use(Loading)

Vue.prototype.$message = Message

let instance = axios.create({
  baseURL: "http://localhost:13399/",
  //baseURL:"http://61.143.60.84:63667/",
  //withCredentials: true,
  timeout: 30000
});
/*
instance.interceptors.request.use(function(config){
  return config;
},function(err){
  console.info(err)
  return Promise.reject(err);
});*/
instance.interceptors.response.use(function (res) {
  return res;
}, function (err) {
  //console.info(err)
  Message.error("网络请求错误:" + err);
  return Promise.reject(err);
})

Vue.prototype.$http = instance



/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: {
    App
  }
})

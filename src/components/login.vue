<template>
<div class="login" :style="loginOffset">
<el-card class="loginBox" :style="loginSize">
  <el-form :model="ruleForm2" status-icon :rules="rules2" ref="ruleForm2" label-width="100px" class="demo-ruleForm" >
  <h3>
    <span class="title">系统登录</span>
  </h3>
  <el-form-item  prop="username" style="margin-left:-60px;">
    <el-input type="text" v-model="ruleForm2.username" auto-complete="on" placeholder="请输入用户名" prefix-icon="el-icon-fa-user"></el-input>
  </el-form-item>
  <el-form-item  prop="password" style="margin-left:-60px;">
    <el-input type="password" v-model="ruleForm2.password" auto-complete="off" @keyup.enter.native="submitForm('ruleForm2')" placeholder="请输入不少于6位数的密码" prefix-icon="el-icon-fa-lock">
    </el-input>
  </el-form-item>
  <el-form-item  >
  <el-checkbox style="margin-left:-60px;" v-model="checked">记住密码</el-checkbox>
  </el-form-item>
  <el-form-item style="margin-left:-60px;">
    <el-button type="primary" @click="submitForm('ruleForm2')" style="width:40%">登录</el-button>
    <el-button  @click="resetForm('ruleForm2')" style="width:40%">重置</el-button>
  </el-form-item>
</el-form>
</el-card>
</div>
</template>
<script>
export default{
    data() {
      var validateUsername = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入用户名'));
        } else {
          callback();
        }
      };
      var validatePassword = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入密码'));
        } else if (value.length < 6){
          callback(new Error('密码不能小于6位'))
        }else {
          callback();
        }
      };
      return {
        checked:false,
        loginSize:{
          width:'',
          height:'',
        },
        loginOffset:{
          position:'absolute',
          left:'',
          top:''
        },
        ruleForm2: {
          username: '',
          password: '',
        },
        rules2: {
          username: [
            { validator: validateUsername, trigger: 'blur' }
          ],
          password: [
            { validator: validatePassword, trigger: 'blur' }
          ],
        }
      };
    },
    created () {
    this.setSize()
  },
  mounted(){
    this.getCookie();
  },
    methods: {
      setSize:function(){
        this.loginSize.width = 380 + 'px';
        this.loginSize.height = 360 + 'px';
        this.loginOffset.left = window.innerWidth * 0.5 -190 + 'px';
        this.loginOffset.top = window.innerHeight * 0.5 - 190 + 'px';
      },
      submitForm:function(formName) {
        this.$refs[formName].validate((valid) => {
          if (valid) {

            var obj = this.ruleForm2;
            var d = {
              UserName: obj.username,
              Password: obj.password
            }

            //判断是否记住密码
            if(this.checked = true){
              this.setCookie(obj.username,obj.password);
            }

            //用户验证
            this.loading = true;

            this.$http.post("/Signin/Check/", d).then(resp=> {
              //loading.close()
              this.loading = false;
              if(resp.data.success){
                //若验证成功跳转
                window.sessionStorage.setItem('userName',obj.username);
               var redirect = decodeURIComponent(this.$route.query.redirect || '/')
               this.$router.push({
                          //  你需要接受路由的参数再跳转
                          path: redirect
                        })

              } else {
                this.$message.error("用户名或密码错误");
              }
            }).catch(err=>{
              this.loading = false;
            });

          } else {
            console.log('error submit!!');
            return false;
          }
        });
      },
      resetForm:function(formName) {
        this.$refs[formName].resetFields();
        this.clearCookie();
      },
      setCookie:function(name,pwd){
        window.document.cookie = "UserName" + "=" +name+";path=/;";
        window.document.cookie = "Password" + "=" +pwd+";path=/;";
      },
      getCookie:function(){
        if(document.cookie.length > 0){
          this.checked = true;
          var arr = document.cookie.split(';');
          for(var i = 0;i<arr.length;i++){
            var arr2 = arr[i].split('=');
             if(arr2[0] == ' Password'){ //这里Password前面的空格不要删去，否则无法匹配
              this.ruleForm2.password = arr2[1];
            }else if(arr2[0] == 'UserName'){
              this.ruleForm2.username = arr2[1];
            }
          }
        }
      },
      clearCookie:function(){
        this.setCookie("","");
        this.checked = false;
      },

  }
}
</script>
<style scoped>
.el-input, .el-input__inner{
  width:85%;
}

.title{
  margin-left:40%;
  color:#878D99;
}

.el-form-item__error{
  left:60px;
}
</style>
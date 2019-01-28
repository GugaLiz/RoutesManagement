<template>
<div>
    <div class="left" style="float:left">
        <i class="el-icon-fa-bars " v-on:click="showCollapse"  id="nbars"></i>
        <span>
           <el-breadcrumb separator="/" style="margin:-36px 0px 0px 40px">
           <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
           </el-breadcrumb>
        </span>

    </div>

    <div class="right" style="text-align: right; font-size: 12px">
    <span v-model="username">{{username}},你好</span>
      <el-dropdown>
        <i class="el-icon-caret-bottom"></i>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item><span v-on:click="userSetting">设置</span></el-dropdown-item>
          <el-dropdown-item><span v-on:click="logOut">退出</span></el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      </div>

</div>
</template>
<script>

export default {
    data() {
      return {
        isCollapse:false,
        tableData: Array(20).fill(item),
        username:'',
      }
    },

    mounted:function(){
      this.getUserName();
      //console.log(this.username)
    },
    methods: {
      getUserName:function(){
        if(document.cookie.length > 0){
          var arr = document.cookie.split(';');
          for(var i = 0;i<arr.length;i++){
            var arr2 = arr[i].split('=');
              if(arr2[0] == 'UserName'){
              this.username = arr2[1];
            }
          }
        }
      },
        showCollapse:function(){
            this.isCollapse = !this.isCollapse;
        },
        userSetting:function(){
          this.$router.push({path:'usersManagement'});
        },
        logOut:function(){
          this.$confirm('您确定退出吗？','退出管理平台',{
            confirmButtonText:'确定',
            cancelButtonText:'取消'
          }).then(() => {
            window.sessionStorage.removeItem('userName')
            this.$message({
              type:'success',
              message:'成功退出'
            })
              this.$router.push({path:'login'})
          }).catch(() => {
            this.$message({
              type:'info',
              message:'取消退出'
            })
          })
        }
    },
  };
</script>
<style>
  .el-header {
    background-color: #B3C0D1;
    color: #333;
    line-height: 60px;
  }

  .el-icon-fa-bars:hover{
    transform:rotate(90deg);
  }


</style>
<template>
<div>
<el-container style="height: 100%; border: 1px solid #eee">
    <el-header >
    <HeaderForm></HeaderForm>
    </el-header>

    <el-main>
    <MainForm></MainForm>
    </el-main>

</el-container>
</div>
</template>
<script>
import HeaderForm from './Header'
import MainForm from '../routesManagement'

export default {
    components:{
        MainForm,HeaderForm
    },
  };
</script>
<style scoped>

  .el-aside {
    color: #333;
  }

  .el-main{
    padding:0px 0px 0px 6px;
  }

</style>
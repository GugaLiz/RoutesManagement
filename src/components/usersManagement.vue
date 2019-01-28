<template>
<div>
<el-container style="border: 1px solid #eee;" :style="containSize">
    <el-header >
    <HeaderForm></HeaderForm>
    </el-header>
<el-main>
<div style="padding-bottom:10px">
      <el-row :gutter="20">
          <el-col :span="16">
            <el-button type="primary" @click="addUser"><i class="el-icon-fa-user-plus"></i><span>添加用户</span></el-button>

            <el-button type="primary" @click="deleteUser"><i class="el-icon-fa-trash"></i><span>删除用户</span></el-button>
            <el-button type="primary"><a href="javascript:;" id="download" style="text-decoration:none;color:#fff;" @click="download()" download="download.csv"><i class="el-icon-fa-download"></i><span>导出用户</span></a></el-button>
          </el-col>
          <el-col :span="8">
            <el-input prefix-icon="el-icon-search" placeholder="搜索" style="width: 260px;" v-model="s_box">
            </el-input>
            </el-col>

        </el-row>
</div>
  <el-table
    ref="multipleTable"
    @selection-change="handleSelectionChange"
    :data="userData"
    stripe
    border
    style="width: 100%;text-align:center">
    <el-table-column
      type="selection"
      width="55">
    </el-table-column>
    <el-table-column
      label="账号"
      width="250">
      <template slot-scope="scope">{{ scope.row.account }}</template>
    </el-table-column>
    <el-table-column
      label="邮箱"
      width="250">
      <template scope="scope">
      <span style="margin-left: 10px">{{ scope.row.email }}</span>
      </template>
    </el-table-column>
    <el-table-column label="操作">
      <template scope="scope">
        <el-button
          size="small"
          @click="handleEdit(scope.$index, scope.row)">编辑</el-button>
        <el-button
          size="small"
          type="danger"
          @click="handleDelete(scope.$index, scope.row)">删除</el-button>
      </template>
    </el-table-column>
  </el-table>
        </el-main>
        <el-footer>
          <div class="block">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="totals">
            </el-pagination>
        </div>
        </el-footer>


<el-dialog title="修改个人信息" :visible.sync="editFormVisible" style="text-align:center;width:800px">
      <el-form ref="editForm" :model="editForm" :label-position="labelPosition" :rules="rules1">
        <el-form-item label="用户账号:" prop="account" >
          <el-input v-model="editForm.account" value="userData.account"></el-input>
        </el-form-item>
        <el-form-item label="用户邮箱:" prop="email">
          <el-input v-model="editForm.email"></el-input>
        </el-form-item>
        <el-form-item label="重设密码:" prop="password">
          <el-input type="password" v-model="editForm.password"></el-input>
        </el-form-item>
        <el-form-item label="确认密码:" prop="checkPwd">
          <el-input type="password" v-model="editForm.checkPwd"></el-input>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="handleSave(1)" :loading="editLoading">修改</el-button>
          <el-button @click="editFormVisible = false">取消</el-button>
        </div>
    </el-dialog>

    <el-dialog title="新增个人信息" :visible.sync="newFormVisible" style="text-align:center;width:800px">
      <el-form ref="editForm" :model="newForm" :label-position="labelPosition" :rules="rules">
        <el-form-item label="用户账号:" prop="account" >
          <el-input v-model="newForm.account" value="userData.account"></el-input>
        </el-form-item>
        <el-form-item label="用户邮箱:" prop="email">
          <el-input v-model="newForm.email"></el-input>
        </el-form-item>
        <el-form-item label="设置密码:" prop="password">
          <el-input type="password" v-model="newForm.password"></el-input>
        </el-form-item>
        <el-form-item label="确认密码:" prop="checkPwd">
          <el-input type="password" v-model="newForm.checkPwd"></el-input>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="handleSave(2)" :loading="editLoading">新增</el-button>
          <el-button @click="newFormVisible = false">取消</el-button>
        </div>
    </el-dialog>
    </el-container>

        </div>
</template>

<script>
import HeaderForm from './Layout/Header'
  export default {
    components:{
        HeaderForm
    },
    data() {

      var validatePassword = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请输入密码'));
        } else {
         if(this.newForm.checkPwd !== '')
          {
            this.$refs.newForm.validateField('checkPwd');
          }else{
            callback();
          }

        }
      };
      var validatePassword1 = (rule1, value, callback) => {
        if (value === '') {
          callback(new Error('请输入密码'));
        } else {
          if (this.editForm.checkPwd !== '') {
            this.$refs.editForm.validateField('checkPwd');
          }else{
            callback();
          }

        }
      };
      var validateCheckPwd = (rule, value, callback) => {
        if (value === '') {
          callback(new Error('请再次输入密码'));
        } else if (value !== this.newForm.password) {
          callback(new Error('两次输入密码不一致!'));
        } else {
          callback();
        }
      };
      var validateCheckPwd1 = (rule1, value, callback) => {
        if (value === '') {
          callback(new Error('请再次输入密码'));
        } else if (value !== this.editForm.password) {
          callback(new Error('两次输入密码不一致!'));
        } else {
          callback();
        }
      };
      return {
        userData: [],
        labelPosition:'right',
        totals:'',
        editFormVisible: false,
        newFormVisible:false,
        editLoading: false,
        editForm: {
          account: '',
          email: '',
          password: '',
          checkPwd:''
        },
        newForm:{
          account:'',
          email:'',
          password:'',
          checkPwd:'',
          id:''
        },
        checkedVal:'',
        s_box:'',
        rules: {
          account: [
            { required:true,message:'账号不能为空', trigger: 'blur' }
          ],
          email: [
            { required:true, message: '请输入邮箱地址', trigger: 'blur' },
            { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur,change' }
          ],
          password: [
            { required:true, validator: validatePassword, trigger: 'blur' }
          ],
          checkPwd: [
            { required:true,validator: validateCheckPwd, trigger: 'blur' }
          ]
        },
        rules1: {
          account: [
            { required:true,message:'账号不能为空', trigger: 'blur' }
          ],
          email: [
            { required:true, message: '请输入邮箱地址', trigger: 'blur' },
            { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur,change' }
          ],
          password: [
            { required:true, validator: validatePassword1, trigger: 'blur' }
          ],
          checkPwd: [
            { required:true,validator: validateCheckPwd1, trigger: 'blur' }
          ]
        },
        currentPage: 1,
        containSize:{
          width:'',
          height:''
        }
      };

    },
    created () {
    this.setSize();
  },
    mounted:function(){
      this.getUserData()
    },
    methods:{
      setSize:function(){
        this.containSize.height = window.innerHeight -16 + 'px';
      },
      getUserData:function(){
        var d= new FormData();
           d.append("start", 0);
           d.append("limit", 1000);
        this.$http.post('/Account/ListUser', d).then(resp=>{
          //console.log(resp);
                if(resp.data.success){
                    var rows = resp.data.data;
                    this.totals = rows.length;
                    for(var i in rows){
                        var item = rows[i];
                        var userData = {
                          "account":item.Account,
                          "email":item.Email,
                          "id":item.Id
                        };
                        this.userData.push(userData);
                    }
                    //console.log(userData);
                }else{
                  this.$message.error("发生错误");
                  console.info(resp);
                }
            })
      },

      handleEdit:function(index,row){
        this.editFormVisible = true;
        this.editForm.account = this.userData[index].account;
        this.editForm.email = this.userData[index].email;
        this.editForm.id = this.userData[index].id;
        this.editForm.password = '';
        this.editForm.checkPwd = '';

      },
      handleDelete:function(index,row){
        //var item = this.user[index];
        var item = this.userData[index];
        this.$http.get('/Account/DeleteUser/'+ item.id).then
        (resp => {
          if(resp.data.success){
            this.$message({
            message:'操作成功',
            type:'success'
          });
          //this.userData.splice(index,1);
          this.userData = [];
          this.getUserData();
            }else{
              this.$message.error("删除发生错误");
              console.info(resp);
            }
          })

      },
      handleSave:function(type) {
        this.$confirm('确认提交吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          cancelButtonClass: 'cancel'
        }).then(() => {
          this.editLoading = true;
          //修改为新的用户信息
          if(type == 1){
          var editUser = new FormData();
          editUser.append("Account",this.editForm.account);
          editUser.append("Email",this.editForm.email);
          editUser.append("Password",this.editForm.password);
          editUser.append("Id",this.editForm.id);
          console.log(this.editForm);
          this.$http.post("Account/UpdateUser",
            editUser).then(res => {
              if(res.status === 200) {
                if(res.data.success) {
                  this.$message({
                    message:"修改成功",
                    type:"success"
                  });
                  this.userData = [];
                  this.getUserData();
                }else {
                  this.$message.error("修改发生错误");
                  console.info(res);
                }
              }
            });
          }else{
            var newUser = new FormData();
            newUser.append("Account",this.newForm.account);
            newUser.append("Email",this.newForm.email);
            newUser.append("Password",this.newForm.password);
            newUser.append("Id",0);
            console.log(this.newForm);
            this.$http.post("Account/AddUser",
              newUser).then(res => {
                if(res.status === 200) {
                  if(res.data.success) {
                    this.$message({
                      message:"新增成功",
                      type:"success"
                    });
                    this.userData = [];
                    this.getUserData();
                  }else {
                    this.$message.error("新增发生错误");
                    console.info(res);
                  }
                }
              });
          }

          this.editLoading = false;
          this.editFormVisible = false;
          this.newFormVisible = false;
        }).catch(() => {

        });
      },
      addUser:function(){
        this.newFormVisible = true;
        this.newForm.account = '';
        this.newForm.email = '';
        this.newForm.password = '';
        this.newForm.checkPwd = '';
      },
      handleSelectionChange:function(val) {
        this.multipleSelection = val;
        this.checkedVal = val;
      },
      deleteUser:function(){
        var vals = this.checkedVal;
        if( vals.length != 0){
          for(var i in vals){
          var item = vals[i];
          console.log(item.id);
          this.$http.get('/Account/DeleteUser/'+ item.id).then
          (resp => {
            if(resp.data.success){
              this.$message({
              message:'操作成功',
              type:'success'
            });
              }else{
                this.$message.error("删除发生错误");
                console.info(resp);
              }
            })
        }
        this.userData = [];
        this.getUserData();
        }else{
          this.$message('没有选中的用户，请重新勾选。');
        }
      },
      download: function() {
        var obj = document.getElementById('download');
        var str = "账号,邮箱\n";
        for (var i = 0; i < this.userData.length; i++) {
          var item = this.userData[i];
          str += item.account + ',' + item.email;
          str += "\n";
        }
        str = encodeURIComponent(str);
        obj.href = "data:text/csv;charset=utf-8,\ufeff" + str;
        var myDate = new Date();
        var dt = myDate.toLocaleDateString();
        obj.download = "User_"+dt+".csv";
      },
    },
    computed:{
      newUsers:function(){
        var that = this;
        return that.userData.fliter(function(){

        })
      }
    }

  }
</script>
<style>

.el-table th>.cell{
  text-align:center;
}

.el-pagination{
  text-align:center;
}

.el-dialog__footer{
  text-align:center;
}

.el-input{
  width:260px;
}


</style>
<template>
 <div style="display:" class="addFile">
        <el-dialog :visible.sync="visible" :before-close="close">
        <el-form >
        <el-form-item label="路线类型：" >
        <el-radio style="margin-top:12px;" v-model="routeType" label="1">高铁</el-radio>
        <el-radio v-model="routeType" label="2">地铁</el-radio>
        </el-form-item>
        <el-form-item label="文件名称：">
        <el-input v-model="saveRouteName"></el-input>
        </el-form-item>
        <el-form-item label="上传文件：">
        <input type="file" class="el-button el-button--primary el-button--small"
         @change="fileDoChange" value="选择文件" />
        </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer" style="text-align:center">
        <el-button @click="fileSave" >保 存</el-button>
        </div>
        </el-dialog>
        </div>
</template>
<script>
export default {
  data() {
    return {
      saveRouteName: "",
      routeType: "1"
      //show: false
    };
  },
  props: ["visible"],
  methods: {
    close: function() {
      this.$emit("close");
      //this.visible = false;
    },
    fileDoChange: function(t) {
      this._upFile = t.target.files[0];
      var name = this._upFile.name;
      this.saveRouteName = name;
    },
    fileSave: function() {
      let formData = new FormData();
      formData.append("Name", this.saveRouteName);
      formData.append("RouteType", this.routeType);
      formData.append("GroupId", 0);
      formData.append("Id", 0);
      formData.append("File", this._upFile);
      let cfg = {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      };

      this.loading = true;
      this.$http.post("/Route/SaveRoute", formData, cfg).then(res=> {
        this.loading = false;
        if (res.status === 200) {
          if (res.data.success) {
            this.$message({
              message: "上传成功",
              type: "success"
            });
            var data = res.data;
            this.$emit("close");
            this.$emit("upload_success", data.RouteType);
          } else {
            this.$message.error("上传发生错误");
            console.info(res);
          }
        }
      });
    }
  }
};
</script>

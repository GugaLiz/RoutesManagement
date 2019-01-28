<template>
    <div class="routesManagement"  >
    <el-container :style="mainSize">
        <el-aside width="260px" v-show="show">
            <span>
                <input @change="fileSelected()" id="fileToUpload" name="file" style="display:none" type="file"/>
                <el-button class="addRoute" @click="addFile"  type="text">
                    <i class="el-icon-fa-plus-square">
                        导入路线
                    </i>
                </el-button>
                <el-button  type="text" >
                    <i @click="showPanel" class="el-icon-fa-step-backward" style="width: 0;margin-left:150px">
                </i>
                </el-button>

            </span>
            <el-tabs>
                <el-tab-pane>
                    <span slot="label" >
                        <i class="el-icon-fa-train">
                        </i>
                        高铁
                    </span>
                    <el-input icon="search" placeholder="搜索" style="width: 260px;" v-model="nameBox">
                    </el-input>
                    <el-table :data="newNames" :show-header="false">
                        <el-table-column width="200">
                            <template scope="scope">
                                <i class="el-icon-fa-train">
                                </i>
                                <span @click="showTrainRoute(scope.$index)" style="margin-left: 10px">
                                    {{scope.row}}
                                </span>
                            </template>
                        </el-table-column>
                        <el-table-column width="58">
                            <template scope="scope">
                                <i class="el-icon-delete" @click="handleDeleteTrain(scope.$index, scope.row)">
                                    </i>

                                     <a name="download" style="color: #169bd5;font-size: 14px;padding-top: 7px" @click="downloadTrain(scope.$index)" download="download.geojson" :id=scope.$index><i class="el-icon-fa-arrow-down" ></i></a>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
                <el-tab-pane>
                    <span slot="label" >
                        <i class="el-icon-fa-subway">
                        </i>
                        地铁
                    </span>
                    <el-input icon="search" placeholder="搜索" style="width: 260px;" v-model="s_nameBox">
                    </el-input>
                    <el-table :data="subways" :show-header="false">
                        <el-table-column type="expand" >
                            <template scope="scope" >
                            <div v-for="(val,key) in (scope.row.Lines)" v-bind:key="key" >
                                            <i class="el-icon-fa-subway">
                                            </i>
                                            <span @click="showSubwayRoute(scope.row.Id, val)">
                                                {{val}}
                                            </span>

                                            </div>
                            </template>
                        </el-table-column>
                        <el-table-column>
                            <template scope="scope">
                                <span>
                                    {{scope.row.Name}}
                                </span>
                                <i class="el-icon-delete" @click="handleDeleteSubway(scope.row.Id)" >
                                                </i>
                                 <a style="color: #169bd5;font-size: 14px;padding-top: 7px" @click="downloadSubway(scope.row.Id,scope.row.Name)" download="download.geojson" :id=scope.row.Id><i class="el-icon-fa-arrow-down" ></i></a>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-tab-pane>
            </el-tabs>
        </el-aside>
        <el-main id="leaflet-map">

        </el-main>
        <upload-file :visible.sync="fileDialogVisible" @close="uploadClose"
        @upload_success="uploadSuccess"></upload-file>

        <div class="editAttribute">
            <el-dialog title="编辑路线信息" :visible.sync="dialogFormVisible">
            <el-form :label-position="labelPosition" :model="formLabelAlign">
            <el-form-item label="路线类型：" >
        <el-radio style="margin-top:12px;" v-model="formLabelAlign.routeType" label="1">高铁</el-radio>
        <el-radio v-model="formLabelAlign.routeType" label="2">地铁</el-radio>
        </el-form-item>
          <el-form-item label="路线名称:">
            <el-input v-model="formLabelAlign.name"  @keyup.enter.native="saveRoutes"></el-input>
          </el-form-item>
          <el-form-item label="地铁线名:" v-show="formLabelAlign.show">
            <el-input v-model="formLabelAlign.line"  @keyup.enter.native="saveRoutes"></el-input>
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
            <el-button @click="dialogFormVisible = false">取 消</el-button>
            <el-button type="primary" @click="saveRoutes">确 定</el-button>
          </div>
            </el-dialog>
        </div>

    </el-container>
    </div>
</template>
<script>
import Leaflet from 'leaflet'
import axios from 'axios'
import "../../node_modules/leaflet/dist/leaflet.css"
import 'leaflet-draw'
import '../../node_modules/leaflet-draw/dist/leaflet.draw.css'
import '../../node_modules/leaflet-draw/dist/leaflet.draw.js'
import 'leaflet.measurecontrol'
import '../../node_modules/leaflet.measurecontrol/docs/leaflet.measurecontrol.css'
import '../../node_modules/leaflet.measurecontrol/leaflet.measurecontrol.js'
import 'leaflet-contextmenu'
import '../../node_modules/leaflet-contextmenu/dist/leaflet.contextmenu.css'
import '../../node_modules/leaflet-contextmenu/dist/leaflet.contextmenu.js'
import uploadFile from './uploadFile'

delete Leaflet.Icon.Default.prototype._getIconUrl
Leaflet.Icon.Default.imagePath = ''
Leaflet.Icon.Default.mergeOptions({
  iconRetinaUrl: require('../assets/markers/marker-icon.png'),
  iconUrl: require('../assets/markers/marker-icon.png'),
  shadowUrl: require('../assets/markers/marker-shadow.png'),
  iconSize:[13,21],
  iconAnchor:[6,21],
  shadowSize:[33,21],
  shadowAnchor:[6,21]
})

  export default {
       components:{uploadFile},
    data() {
      return {
        fileDialogVisible: false,
        dialogFormVisible: false,
        labelPosition: 'right',
        formLabelAlign: {
          name: '',
          routeType:'1',
          line:'',
          show:false
        },
        dialogVisible:false,
        mainSize:{
          height:'',
        },
        formLabelWidth: '100px',
        map:null,
        map_config:{
            url:'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            center:[37.5,106],
            zoom:4,
            minZoom:2,
            maxZoom:18,
            zoomControl:false,
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        },

        nameBox:'',
        s_nameBox:'',
        show:true,
        disabled:false,
        formLabelWidth:'120px',
        fts:[],
        trainGeojsons:[],//每一条高铁路线信息
        trains: [], //当前高铁列表
        trainName:[],
        trainFeatureLayer:[],

        subwayGeojsons:[],//每一条地铁路线的信息
        subways: [], //当前地铁列表
        subwayNameData:[],
        cityName:[],
        subwayFeatureLayer:[],
        subwayGeojson:[],//一个城市的路线信息

        geojsons:[],//每一条导入的.geojson文件信息

        editableLayers:null,

        pathLayer:'',//被选中路线图层
        newContent:[],
        fts_content:[],
        fts_name:[],
        sub_names: [],
      }
    },
    created () {
    this.setSize()
  },
    mounted:function(){
        this.initMap();
        this.initPanel();
        this.initDrawPanel();
        this.listRoutes(1);
        this.listRoutes(2);
    },
    methods: {
        listRoutes: function(routeType){
           var d= new FormData();
           d.append("start", 0);
           d.append("limit", 1000);
           var names = [];
           var lines = [];
           if(routeType == 1){
                names = this.trainName;
                lines = this.trains;
           }else{
                names = this.sub_names ;
                lines = this.subways;
           }
            names.splice(0);
            lines.splice(0);
            this.$http.post('/Route/ListRoute?type='+routeType, d).then(resp=>{
                if(resp.data.success){
                    var rows = resp.data.data;
                    for(var i in rows){
                        var item = rows[i];
                        var name = item.Name;
                        if(item.Lines){
                            item.Lines = item.Lines.split("$_$_$");
                        }
                        names.push(name);
                        lines.push(item);
                    }
                }
            })
        },
        uploadSuccess: function(routeType){
            this.listRoutes(routeType)
        },
        uploadClose: function(){
            this.fileDialogVisible = false;
        },
        setSize:function(){
            this.mainSize.height = window.innerHeight - 78 +'px';
        },
        initMap:function(){
            this.map = new L.map('leaflet-map',{
                center:this.map_config.center,
                zoom:this.map_config.zoom,
                minZoom:this.map_config.minZoom,
                maxZoom:this.map_config.maxZoom,
                zoomControl:this.map_config.zoomControl
            });
            L.tileLayer(this.map_config.url,{
                attribution:this.map_config.attribution

            }).addTo(this.map);

            L.control.scale().addTo(this.map);
            L.Control.measureControl({position:'topright'}).addTo(this.map);
        },
        initDrawPanel:function(){
            var editableLayers = new L.FeatureGroup().addTo(this.map);

            var options = {
                position:'topright',
                draw:{
                    //marker:false
                },
                edit:{
                    featureGroup:editableLayers,
                    remove:true,
                }
            };

            var drawControl = new L.Control.Draw(options);
            this.map.addControl(drawControl);
            let vm = this;
            //建新图层
            this.map.on(L.Draw.Event.CREATED, function (e) {
                var layer = e.layer;
                var content = JSON.stringify(e.layer.toGeoJSON());
                var fts_content = JSON.parse(content);
                vm.newContent.push(fts_content);

                editableLayers.addLayer(layer);

                layer.bindContextMenu({
                    contextmenu:true,
                    contextmenuItems:[{
                        text:'保存路线',
                        callback:vm.proPanel
                    }]
                });

            });
            //编辑图层
            this.map.on('draw:edited',function(e){
                //let vm = this;
                var layers = e.layers;
                var content = null;
                layers.eachLayer(function(layer){
                    content = JSON.stringify(layer.toGeoJSON());
                    //console.log(content);
                var fts_content = JSON.parse(content);
                var layerId = layer.id;
                var layerType = layer.routeType;
                if(layerType == 1){
                    var editGeojson = {
                    "type":"FeatureCollection",
                    "features":[fts_content]
                };

                var newGeo = JSON.stringify(editGeojson);

                var edietRoute = new FormData();
                //edietRoute.append("Name", this.saveRouteName);
                edietRoute.append("RouteType",layerType);
                edietRoute.append("Id", layerId);
                edietRoute.append("Geo", newGeo);

                  //console.log(newGeo);
                  //this.loading = true;
                  vm.$http.post("/Route/UpdateRoute", edietRoute).then(res=> {
                    //this.loading = false;
                   // console.log(res);
                    if (res.status === 200) {
                      if (res.data.success) {
                        vm.$message({
                          message: "修改成功",
                          type: "success"
                        });
                      } else {
                        vm.$message.error("修改发生错误");
                        console.info(res);
                      }
                    }
                  });
              }else{
                console.log(layer);
              }

               });
            });

            //删除
            this.map.on('draw:deleted',function(e){
                var layers = e.layers;
                    layers.eachLayer(function(layer){
                        vm.$http.get("/Route/RemoveRoute/"+layer.id).then(resp =>{
                            if(resp.data.success){
                                vm.$message({
                                  message: "操作成功",
                                  type: "success"
                                });
                                vm.listRoutes(1);
                            }else{
                                vm.$message.error("删除发生错误");
                                console.info(resp);
                            }
                        });
                    })
            });
            this.editableLayers = editableLayers;
        },
        proPanel:function(){
            this.dialogFormVisible = true;
                },

        saveRoutes:function(){
            this.dialogFormVisible = false;
            var routeType = this.formLabelAlign.routeType;
            var newRoute = new FormData();
            if(routeType == 1){
                var newGeo = {
                    "type":"FeatureCollection",
                    "features":[{
                        "type":this.newContent["0"].type,
                        "features":null,
                        "geometry":this.newContent["0"].geometry,
                        "properties":{
                        name:this.formLabelAlign.name
                    },
                    }],
                };
                var newGeoStr = JSON.stringify(newGeo);
                newRoute.append("Name",this.formLabelAlign.name);
                newRoute.append("RouteType",this.formLabelAlign.routeType);
                newRoute.append("GroupId", 0);
                newRoute.append("Id", 0);
                newRoute.append("Geo", newGeoStr);

                this.$http.post("/Route/AddRoute", newRoute).then(res=> {
                    if (res.status === 200) {
                      if (res.data.success) {
                        this.$message({
                          message: "新增成功",
                          type: "success"
                        });
                        this.listRoutes(1);
                      } else {
                        this.$message.error("新增发生错误");
                        console.info(res);
                      }
                    }
                  });
            }else {
                newRoute.append("Name",this.formLabelAlign.name);
                newRoute.append("Lines",this.formLabelAlign.line);
                newRoute.append("RouteType",this.formLabelAlign.routeType);
                newRoute.append("GroupId", 0);
                newRoute.append("Id", 0);
                newRoute.append("Geo", this.newContent);
                console.log(this.newContent);
            }
        },
        addFile:function(){
            this.fileDialogVisible = true;
        },

        initPanel:function(){
            let vm = this;
            var info = L.control({
                position:'topleft'
            });

            info.onAdd = function(map){
                 this._div = L.DomUtil.create('div','info legend'),
                 this.update();
                 return this._div;
                 console.log(this._div);
                 };
            info.update = function(){
                this._div.innerHTML ='<i class="el-icon-fa-step-forward" style="width:15px;height:15px"></i>';
                    L.DomEvent.on(this._div,'click',this.showPanel,this)
                 };

            info.showPanel = function(e){
                  vm.show = true;
                 }
            info.addTo(this.map);
        },
        handleDeleteTrain:function(index,row){
            var item = this.trains[index];
            this.$http.get("/Route/RemoveRoute/"+item.Id).then(resp =>{
                if(resp.data.success){
                    this.$message({
                      message: "操作成功",
                      type: "success"
                    });
                    this.listRoutes(1);

                }else{
                    console.info(resp);
                }
            });

          },
        handleDeleteSubway:function(id){
            var items = this.subways;
            var item = items.find(x=>x.Id == id);
            this.$http.get("/Route/RemoveRoute/" + item.Id).then(resp =>{
                if(resp.data.success){
                    this.$message({
                      message: "操作成功",
                      type: "success"
                    });
                }else{
                    console.info(resp);
                }
            });
        },
        downloadTrain: function(index) {
            var item = this.trains[index];
            console.log(item);
            this.$http.get("/Route/RouteGet/" + item.Id).then(resp =>{
                if(resp.data.success){
                    var geo = resp.data.data.Geo;
                    if(geo){
                        item._load = true;
                        var id = index;
                        var obj = document.getElementById(id);
                        var name = this.trainName[index];
                        var nameStr = name.split('.');
                        var fileName = nameStr[0];
                        var str = encodeURIComponent(geo);
                        obj.href = "data:text/geojson;charset=utf-8,\ufeff" + str;
                        obj.download = fileName+".geojson";
                    }
                }else{
                    console.info(resp);
                }
            });
          },
        downloadSubway:function(id,name){
            var items = this.subways;
            var item = items.find(x=>x.Id == id);
            this.$http.get("/Route/RouteGet/" + item.Id).then(resp =>{
                if(resp.data.success){
                    var geo = resp.data.data.Geo;
                    if(geo){
                        item._load = true;
                        var obj = document.getElementById(id);
                        var nameStr = name.split('.');
                        var fileName = nameStr[0];
                        var str = encodeURIComponent(geo);
                        obj.href = "data:text/geojson;charset=utf-8,\ufeff" + str;
                        obj.download = fileName+".geojson";
                    }
                }else{
                    console.info(resp);
                }
            });
        },
        showTrainRoute:function(index){
            let vm = this;
            var item = this.trains[index];
            this.$http.get("/Route/RouteGet/" + item.Id).then(resp =>{
                if(resp.data.success){
                    var geo = resp.data.data.Geo;
                    //console.info(geo, resp.data.data);
                    if(geo){
                        item._load = true;
                        var jgeo = JSON.parse(geo);
                        var pathLayer =  L.geoJson(jgeo,{onEachFeature:function(feature,layer){
                            layer.bindPopup(feature.properties.name);
                           layer.id = item.Id;
                           layer.routeType = 1;
                           vm.editableLayers.addLayer(layer);
                }});
                        //.addTo(this.map);
                        this.map.fitBounds(pathLayer.getBounds());
                    }
                }else{
                    console.info(resp);
                }
            });
        },
        showSubwayRoute:function(id, name){
            let vm = this;
            var items = this.subways;
            var item = items.find(x=>x.Id == id);
            this.$http.get("/Route/RouteGet/" + item.Id).then(resp =>{
                if(resp.data.success){
                    var geo = resp.data.data.Geo;
                    if(geo){
                        item._load = true;
                        var jgeo = JSON.parse(geo);
                        //console.info(jgeo);
                        //TODO:把这个geofeature层现到地图上
                        var pathLayer =  L.geoJson(jgeo,{onEachFeature:function(feature,layer){
                            layer.bindPopup(feature.properties.name);
                           layer.id = item.Id;
                           layer.routeType = 2;
                           vm.editableLayers.addLayer(layer);
                }}).addTo(this.map);
                        this.map.fitBounds(pathLayer.getBounds());
                    }
                }else{
                    console.info(resp);
                }
            });
            //this.pathLayer = this.subwayFeatureLayer[index][key];
            //this.map.fitBounds(this.subwayFeatureLayer[index][key].getBounds(),this.subwayFeatureLayer[index][key].setStyle({color:'red',weight:5}));
        },
        showPanel:function(){
            this.show = !this.show;
        },
    },
    computed: {
        newNames: function () {
            var that = this;
            return that.trainName.filter(function (name) {
              return name.toLowerCase().indexOf(that.nameBox.toLowerCase()) !== -1;
               })
       },
       s_newNames:function(){
        var that = this;
        var sub_names = that.subwayNameData.lines;
        return that.sub_names.filter(function (name){
            return name.toLowerCase().indexOf(that.s_nameBox.toLowerCase()) !== -1;
        })
       }
     },
     watch:{
        trainName:function(val,oldVal){
            if(val != null){
                this.disabled = false;
            }
        },

        show:function(val,oldVal){
          if(val == true){
            this.divset = document.getElementsByClassName("info legend leaflet-control");
                    for(var i=0;i<this.divset.length;i++){
                      this.divset[i].style.display="none";
                    };
            document.getElementById("leaflet-map").style.width="75%";
            document.getElementById("leaflet-map").style.marginLeft = 10 + 'px';
          }else{
            this.divset = document.getElementsByClassName("info legend leaflet-control");
                    for(var i=0;i<this.divset.length;i++){
                      this.divset[i].style.display="block";
                    };
                    document.getElementById("leaflet-map").style.width="100%";
                    document.getElementById("leaflet-map").style.margin=0 + 'px';
          }
        },
        pathLayer:function(val,oldVal){
            if(val != oldVal){
               oldVal.setStyle({color:'#3388ff',weight:3});
            }
        },
        'formLabelAlign.routeType':function(val,oldVal){

            if(val == "2"){
                this.formLabelAlign.show=true;
            }else{
                this.formLabelAlign.show = false;
            }
        },
    }
  }
</script>
<style>
.addRoute{
    float:left;
    margin-left:10px
}

.el-tabs__header{
    text-align: center;
}

#leaflet-map{
    overflow: hidden;
    margin-left:10px

}

.el-tabs__item{
    width:130px;
}

.el-table .cell{
    padding-left:8px;
}

.el-table__expanded-cell{
    padding:10px 10px;
}

.el-form-item__content{
    line-height:20px;
}

.el-icon-delete{
    color: red;
}

.leaflet-contextmenu{
    width:100px;
}

.leaflet-contextmenu-item{
    font-size:13px;
    line-height:2;
}

.el-form-item__content{
    float:left;

}

.el-dialog--small{
    width:40%;
}

.el-dialog{
    width:400px;
}

.el-input__inner{
    width:260px
}

.el-dialog__header{
    text-align:center;
}

.el-dialog__body{
    padding:10px 25px;
}

.el-table__expanded-cell[class*=cell]{
    padding:10px 10px;
}


</style>
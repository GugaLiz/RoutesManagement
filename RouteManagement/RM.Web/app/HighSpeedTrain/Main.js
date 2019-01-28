Ext.define('RM.HighSpeedTrain.Main', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.rm_highspeedtrain'],

    border: 0,
    layout: 'border',

    initComponent: function () {
        var me = this;
        me.items = me.buildItems();
        me.callParent();
    },

    buildItems: function () {
        var me = this;
        var grid = Ext.create('RM.HighSpeedTrain.Grid', {
            title: '高铁路线管理',
            itemId: 'myGrid',
            region: 'west',
            floatable: false,
            collapsible: true,
            split: true,
            margins: '5 0 0 0',
            width: 305,
            minWidth: 200,
            listeners: {
                edit_line: function (cmp, data, coors) {
                    var map = me.down('[itemId=myMap]');
                    if (coors) {
                        var latlngs = [];
                        var transform = L.EvilTransform.transform;
                        Ext.each(coors, function (coor) {
                            var coor1 = transform(coor[1], coor[0]);
                            latlngs.push(coor1);
                        });
                        var tools = map.map.editTools;
                        //map._beforeDraw();
                        var line = me._DrawLine;
                        if (line) {
                            //TODO:是否保存
                            line.remove();
                        }
                        line = tools.startPolylines(latlngs);
                        me._DrawLine = line;
                        map.map.panTo(latlngs[0]);
                        var btnSaveDraw = map.down('[itemId=btnSaveDraw]');
                        btnSaveDraw.show();

                        var dipNowDraw = map.down('[itemId=dipNowDraw]');
                        dipNowDraw.setValue("当前编辑:<span style='color:red'>" + data.Name + "</span>");
                        dipNowDraw.show();
                        me._CurrentData = data;
                    }
                }
            }
        });
        var map = Ext.create('RM.Map.LFMapPanel', {
            itemId: 'myMap',
            region: 'center',
            listeners: {
                save_draw: function (cmp, tools) {
                    var data = me._CurrentData;
                    var lyr = tools.featuresLayer;
                    var points = [];
                    var latlngs = [];
                    lyr.eachLayer(function(l){
                        points = l._latlngs;
                        return false;
                    });
                    Ext.each(points, function (p) {
                        latlngs.push([p.lng, p.lat]);
                    });
                    Ext.Ajax.request({
                        url: RM.Url('/HighSpeedTrain/Update'),
                        params: {
                            id: data.Id,
                            Coordinates: Ext.JSON.encode(latlngs)
                        },
                        method: 'POST',
                        success: function (resp, opts) {
                            var success = Ext.decode(resp.responseText).success;
                            if (success) {
                                Ext.Msg.alert('提示信息', "保存修改成功");
                                var gri = me.down('[itemId=myGrid]');
                                var sto = gri.getStore();
                                sto.load();
                            } else {
                                Ext.MessageBox.show({
                                    title: '提示信息',
                                    msg: '保存修改失败'
                                });
                            }
                        }
                    });
                }
            }
        });
        var items = [grid, map];
        return items;
    }

});
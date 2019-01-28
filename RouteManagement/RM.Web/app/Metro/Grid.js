Ext.define('RM.Metro.Grid', {
    extend: 'Ext.grid.Panel',
    requires: [
         'RM.ux.SearchField'
    ],
    border: 1,
    columnLines: true,
    loadMask: true,

    initComponent: function () {
        var me = this;
        me.buildItems();
        me.callParent();
    },

    buildItems: function () {
        var me = this;
        me.selModel = Ext.create('Ext.selection.CheckboxModel', {
            mode: 'SIMPLE'
        });

        var store = Ext.create('Ext.data.Store', {
            pageSize: 25,
            fields: ['Id', 'Name'],
            autoLoad: true,
            proxy: {
                type: 'ajax',
                url: RM.Url(''),
                actionMethods: { create: "POST", read: "POST", update: "POST", destroy: "POST" },
                reader: {
                    type: 'json',
                    rootProperty: 'data',
                    idProperty: 'Id',
                    totalProperty: 'total'
                }
            }
        });
        me.store = store;
        var cols = [{
            xtype: 'rownumberer',
            //width: 18
        }, {
            header: '路线名称',
            dataIndex: 'Name',
            flex: 1,
            align: 'center',
            renderer: function (val, meta) {
                meta.tdAttr = 'data-qtip="' + val + '"';
                return val;
            }
        }];

        cols.push({
            header: '查看',
            align: 'center',
            xtype: 'actioncolumn',
            width: 38,
            items: [{
                iconCls: 'edit',
                tooltip: '查看',
                handler: function (grid, rowIndex, colIndex) {
                    var sto = grid.getStore();
                    var rec = sto.getAt(rowIndex);
                    var id = rec.get('Id');
                    //TODO:查看路线
                    //console.log(rec);
                    if (rec) {
                        var coordinates = rec.data.Coordinates;
                        if (coordinates) {
                            var jcoors = JSON.parse(coordinates);
                            var geo = {
                                "type": "FeatureCollection",
                                "features": [{
                                    "type": "Feature",
                                    "features": null,
                                    "geometry": {
                                        "type": "LineString",
                                        "coordinates": jcoors
                                    }
                                }]
                            };
                            var pathLayer = L.geoJson(geo);
                            console.log(pathLayer);


                        }
                    }
                }
            }]
        });

        cols.push({
            header: '删除',
            align: 'center',
            xtype: 'actioncolumn',
            width: 38,
            items: [{
                iconCls: 'delete',
                tooltip: '删除',
                handler: function (grid, rowIndex, colIndex) {
                    Ext.Msg.confirm("确认信息", "是否要删除该路线？", function (button, text) {
                        if (button === "yes") {
                            var sto = grid.getStore();
                            var rec = sto.getAt(rowIndex);
                            var id = rec.get('Id');
                            Ext.Ajax.request({
                                url: RM.Url('/HighSpeedTrain/Remove'),
                                params: {
                                    id: id
                                },
                                method: 'POST',
                                success: function (resp, opts) {
                                    var success = Ext.decode(resp.responseText).success;
                                    if (success) {
                                        sto.remove(rec);
                                        Ext.Msg.alert('提示信息', "删除成功");
                                    } else {
                                        Ext.MessageBox.show({
                                            title: '提示信息',
                                            msg: '删除失败'
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            }]

        });

        me.columns = {
            items: cols,
            defaults: {
                sortable: false,
                menuDisabled: true
            }
        };

        me.bbar = Ext.create('Ext.PagingToolbar', {
            store: store,
            displayInfo: true
        });

        me.dockedItems = [{
            dock: 'top',
            xtype: 'toolbar',
            items: [{
                text: '导入',
                iconCls: 'import',
                handler: function () {
                    var win = me._addWin;
                    if (!win) {
                        win = Ext.create('RM.Metro.ImportWin', {
                            listeners: {
                                update_success: function () {
                                    store.load();
                                }
                            }
                        });
                        me._addWin = win;
                    }
                    win.show();
                }
            }, {
                text: '导出',
                iconCls: 'export',
                menu: {
                    items: [{
                        text: '导出选中',
                        handler: function () {
                            var sel = me.getSelectionModel();
                            var sels = sel.getSelection();
                            if (sels.lenght > 0) {
                                var ids = [];
                                Ext.each(sels, function (rec) {
                                    ids.push(rec.data.Id);
                                });
                                var url = RM.Url('');
                                RM.downloadFile(url);
                            }
                        }
                    }, {
                        text: '导出全部',
                        handler: function () {
                            var url = RM.Url('');
                            RM.downloadFile(url);
                        }
                    }]
                }
            }, '->', {
                labelWidth: 38,
                fieldLabel: '查询',
                labelAlign: 'right',
                store: store,
                xtype: 'searchfield',
                paramName: 'QueryValue',
                width: 180
            }]
        }];
    }

});
Ext.define('RM.User.List', {
    extend: 'Ext.grid.Panel',
    requires: [
         'RM.ux.SearchField'
    ],
    alias: ['widget.rm_userlist'],

    border: 1,
    title: '用户管理',

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
            fields: ['Id', 'Account', 'Email', 'Memo', 'Nickname',
                'CreateTime', 'UpdateTime',
                'Disabled'
            ],
            autoLoad: true,
            proxy: {
                type: 'ajax',
                url: RM.Url('/Account/ListUser/'),
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
            width: 26
        }, {
            header: '用户名',
            dataIndex: 'Account',
            flex: 1,
            align: 'center'
        }, {
            header: '邮箱',
            flex: 1,
            align: 'center',
            dataIndex: 'Email'
        }, {
            header: '备注',
            flex: 1,
            align: 'center',
            dataIndex: 'Memo'
        }];
        cols.push({
            header: '启用',
            width: '58',
            align: 'center',
            dataIndex: 'Disabled',
            renderer: function (v) {
                var className = "fdisable";
                if (v === 0) {
                    className = "fenable";
                }
                return '<div class="' + className +
                    '" style="width:20px;height:18px;background-repeat:no-repeat;"></div>';
            }
        });
        cols.push({
            header: '查看',
            align: 'center',
            xtype: 'actioncolumn',
            width: 38,
            items: [{
                icon: RM.Url('/Content/Images/icons/fam/user_edit.png'),
                tooltip: '编辑',
                handler: function (grid, rowIndex, colIndex) {
                    var sto = grid.getStore();
                    var rec = sto.getAt(rowIndex);
                    var id = rec.get('Id');
                    var win = me._editWin;
                    if (!win) {
                        win = Ext.create('RM.User.EditWin', {
                            _isEdit: true,
                            _recordId:id,
                            listeners: {
                                update_success: function () {
                                    sto.load();
                                }
                            }
                        });
                        me._editWin = win;
                    }
                    win._recordId = id;
                    win.show();
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
                text: '添加用户',
                iconCls: 'add',
                handler: function () {
                    var win = me._addWin;
                    if (!win) {
                        win = Ext.create('RM.User.EditWin', {
                            listeners: {
                                update_success: function (cmp) {
                                    store.load();
                                    cmp.hide();
                                }
                            }
                        });
                        me._addWin = win;
                    }
                    win.show();
                }
            }, {
                text: '删除用户',
                iconCls: 'delete',
                handler: function (rowIndex) {
                    me.deleteUser(me, rowIndex);
                }
            }, '->', {
                labelWidth: 38,
                fieldLabel: '查询',
                labelAlign: 'right',
                store: store,
                xtype: 'searchfield',
                paramName: 'QueryValue',
                width: 230
            }]
        }];
    },

    deleteUser: function (me,rowIndex) {
        var data = me.getSelectionModel().getSelection();
        if (data.length == 0) {
            Ext.MessageBox.show({
                title: '提示',
                msg: '请选择要删除的行'
            });
            return;
        } else {
            Ext.Msg.confirm("确认信息", "确定删除选中用户？", function (button, text) {
                if (button == "yes") {
                    var sto = me.getStore();
                    var rec = sto.getAt(rowIndex);
                    var ids = '';
                    Ext.Array.each(data, function (rec) {
                        var userId = rec.get('Id');
                        if (userId) {                           
                            if (ids === '') {
                                ids = userId;
                            } else {
                                ids = ids + ',' + userId;
                            }
                        }
                    });
                    Ext.Ajax.request({
                        url: RM.Url('Account/DeleteUsers'),
                        params: {
                            ids: ids
                        },
                        method: 'POST',
                        success: function (resp, opts) {
                            var success = Ext.decode(resp.responseText).success;
                            if (success) {
                                Ext.Array.each(data, function (rec) {
                                    me.store.remove(rec);
                                });
                            } else {
                                Ext.Msg.alert('提示信息', "删除失败");
                            }
                        },
                        failure: function (form, action) {
                            Ext.Msg.alert('提示信息', "操作失败");
                        }
                    });
                }
            });
        }
    }

});
Ext.define('RM.Home.Menu', {
    extend: 'Ext.panel.Panel',
    requires: [
        'RM.Home.Main',
        'RM.HighSpeedTrain.Main',
        'RM.Metro.Main',
        'RM.User.List',
        'RM.User.Setting',
    ],
    border: 1,
    initComponent: function () {
        var me = this;
        me.dockedItems = me.buildDockedItems();
        me.callParent();
    },

    listeners: {
        afterrender: function (comp) {
            var me = comp;
            var para = RM.UrlParas('#');
            if (!Ext.isEmpty(para)) {
                if (!para.module) para.module = 'rm_main';
                me.changeMain(para);
            }
        }
    },

    changeMain: function (btn) {
        var module = btn.module;
        var main = Ext.ComponentQuery.query('viewport')[0].getComponent('FMain');
        main.setLoading(true);
        var mainItem = main.getComponent(module);

        if (Ext.isEmpty(mainItem)) {
            if (main.items.length > 0) {
                main.remove(main.items.get(0), true);
            }
            //try {
                main.add(Ext.widget(module, {
                    itemId: module,
                    showService: true
                }));
                window.location = "#module=" + module;
            //} catch (err) {
            //    Ext.Msg.show({
            //        title: '错误',
            //        msg: '加载模块出错:' + module + '<br />' + err,
            //        buttons: Ext.Msg.OK,
            //        icon: Ext.Msg.ERROR
            //    });
            //}
            Ext.defer(function () {
                main.setLoading(false);
            }, 300);
        } else {
            main.setLoading(false);
        }
    },

    buildDockedItems: function () {
        var me = this;
        var items = [{
            xtype: 'toolbar',
            dock: 'bottom',
            items: [{
                text: '管理首页',
                module: 'rm_main',
                handler: me.changeMain
            }, {
                text: '地铁管理',
                module: 'rm_metro',
                handler: me.changeMain
            }, {
                text: '高铁管理',
                module: 'rm_highspeedtrain',
                handler: me.changeMain
            }, {
                text: '系统管理',
                menu: [{
                    text: '用户管理',
                    module: 'rm_userlist',
                    handler: me.changeMain
                }]
            }, '->', {
                text: '用户:' + RM._Account,
                menu: [{
                    text: '退出登录',
                    handler: function (btn) {
                        Ext.MessageBox.confirm('提示', '确定要退出登录',
                            function (btn) {
                                if (btn == 'yes') {
                                    me.logout();
                                }
                            });
                    }
                }, {
                    text: '我的设置',
                    module: 'rm_usersetting',
                    handler: me.changeMain
                }]
            }]
        }];
        return items;
    },
    logout: function () {
        var me = this;
        var viewport = Ext.ComponentQuery.query('viewport')[0];
        viewport.setLoading(true);
        window.location.href = '/Account/LogOn';
    }
});
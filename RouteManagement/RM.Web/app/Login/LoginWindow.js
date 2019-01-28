Ext.define('RM.Login.LoginWindow', {
    extend: 'Ext.window.Window',
    layout: 'fit',
    buttonAlign: 'right',
    title: '用户登录',
    modal: true,
    width: 408,
    height: 218,
    closeAction: 'destroy',
    resizable: false,
    draggable: false,
    maximizable: false,
    closable: false,

    //iconCls: 'logout',

    initComponent: function () {

        this.on('show', function (comp) {
            var me = comp;
        });

        this.on('afterrender', function (comp) {
            new Ext.KeyMap(comp.getEl(), [{
                key: 13,
                fn: function () {
                    comp.login();
                }
            }]);
        });

        this.items = this.buildItems();
        this.callParent();
    },

    buttons: [{
        text: '登录',
        itemId: 'btnLogin',
        width: 70,
        handler: function (btn) {
            var me = btn.up('window');
            me.login();
        }
    }],

    login: function () {
        var me = this;
        var pnl = me.getComponent('formThis');
        var userId = pnl.getComponent('userId');
        var userPwd = pnl.getComponent('userPwd');
        var autoLogin = pnl.getComponent('autoLogin').checked;
        var form = pnl.getForm();
        var user = userId.getValue();
        var pwd = userPwd.getValue();
        if (form.isValid()) {
            me.setLoading('正在进行登陆验证,请稍后...');
            me.fireEvent('loginsuccess', me);
            return
            Ext.Ajax.request({
                url: RM.Url('/A'),
                params: {
                    userId: user,
                    userPwd: pwd,
                    autoLogin: autoLogin
                },
                failure: function (opt) {
                    console.info(opt);
                    Ext.Msg.show({
                        title: '错误',
                        msg: '网络连接失败！',
                        buttons: Ext.Msg.OK,
                        icon: Ext.Msg.ERROR
                    });
                    me.setLoading(false);
                    //                    }
                },
                success: function (opt) {
                    var resp = Ext.JSON.decode(opt.responseText);
                    if (resp.code && resp.code == 200) {
                        Ext.defer(function () {
                            me.fireEvent('loginsuccess', me, user, resp);
                            me.setLoading(false);
                            me.close();
                        }, 500);
                    } else if (resp.code && resp.code == 401) {
                        Ext.Msg.show({
                            title: F.C.Error,
                            msg: F.AF.LoginErrorTip,
                            buttons: Ext.Msg.OK,
                            icon: Ext.Msg.ERROR
                        });
                        me.setLoading(false);
                    } else if (resp.code) {
                        Ext.Msg.show({
                            title: F.C.Error,
                            msg: F.AF.RespErrorTip + 'Code: ' + resp.code,
                            buttons: Ext.Msg.OK,
                            icon: Ext.Msg.ERROR
                        });
                        me.setLoading(false);
                    }
                }
            });
        }
    },

    buildItems: function () {
        var me = this;

        var form = new Ext.FormPanel({
            keys: [{
//                key: Ext.EventObject.ENTER,
                fn: function () {
                    var obj = this;
                    me.login();
                },
                scope: this
            }],
            labelWidth: 75,
            itemId: 'formThis',
            defaults: {
                width: 150,
                labelAlign: 'right'
            },
            defaultType: 'textfield',
            bodyStyle: 'padding:30px 0 0 0;',
            border: false,
            items: [{
                fieldLabel: '用户名',
                itemId: 'userId',
                anchor: '80%',
                allowBlank: false,
                maxLength: 50,
                blankText: '用户名不能为空'
            }, {
                inputType: 'password',
                itemId: 'userPwd',
                fieldLabel: '密　码',
                anchor: '80%',
                maxLength: 50,
                allowBlank: false,
                blankText: '密码不能为空'
            }, {
                xtype: 'checkbox',
                itemId: 'autoLogin',
                style: 'margin:0 0 0 108px',
                hidden: false,
                boxLabel: '自动登录',
                checked: false
            }]
        });
        return [form];
    }

});
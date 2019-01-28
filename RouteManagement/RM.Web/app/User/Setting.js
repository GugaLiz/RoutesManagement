Ext.define('RM.User.Setting', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.rm_usersetting'],

    border: 1,
    title: '我的设置',

    layout: {
        type: 'vbox',
        pack: 'start',
        align: 'center'
    },
    bodyPadding: '20 0 0 0',

    _recordId: 0,

    initComponent: function () {
        var me = this;
        me.items = me.buildItems();
        me.on('render', function (cmp) {
            var form = cmp.down('form');
            var fp = form.getForm();
            //var recordId = cmp._recordId;
            var recordId = "20";
            Ext.getBody().mask('Loading');
            fp.load({
                url: RM.Url('/Account/UserGet/' + recordId),
                success: function (form, action) {
                    var data = action.result.data;
                    var oldPwd = data.Password;
                    me.down('[name=Pwd]').setValue(oldPwd);
                    Ext.getBody().unmask();
                },
                failure: function (form, action) {
                    Ext.Msg.alert('提示信息', "操作失败");
                }
            });
        });
        me.callParent();
    },

    buildItems: function () {
        var me = this;
        Ext.apply(Ext.form.VTypes, {
            password: function (val, field) {
                if (field.initialPassField) {
                    var pwd = me.down('[name=Password]');
                    return (val === pwd.getValue());
                }
                return true;
            },
            passwordText: '两次输入密码不一致'
        });
        var passLen = 6;
        var width = 380;
        var required = '<span style="color:red;font-weight:bold">*</span> ';
        var form1 = {
            xtype: 'form',
            collapsible: false,
            frame: false,
            jsonSubmit: true,
            title: '用户设置',
            bodyPadding: '5 0 0 0',
            width: 500,
            fieldDefaults: {
                msgTarget: 'side',
                labelAlign: 'right',
                padding: '3 0 2 0',
                width: width,
                layout: 'fit',
                labelWidth: 100
            },
            defaultType: 'textfield',
            items: [{
                fieldLabel: '用户名',
                xtype: 'displayfield',
                name: 'Account',
                value: ''
            }, {
                fieldLabel: '邮箱',
                name: 'Email',
                vtype: 'email'
            }, {
                fieldLabel: '昵称',
                xtype: 'textfield',
                name: 'Nickname'
            }, {
                xtype: 'textarea',
                fieldLabel: '备注',
                maxLength: 1000,
                name: 'Memo'
            }, {
                xtype: 'container',
                cls: 'x-group-button',
                style: 'padding:8px 0 8px 105px',
                items: [{
                    text: '保存',
                    width: 80,
                    xtype: 'button',
                    handler: function (btn) {
                        var form = btn.up('form');
                        me.saveUserInfo(form);
                    }
                }]
            }]
        };
        var mystyle = 'left:105px';
        var passItems = [{
            fieldLabel: '旧密码',
            beforeLabelTextTpl: required,
            name: 'Pwd',
            xtype: 'textfield',
            inputType: 'Password',
            maxLength: 35,
            minLength: passLen,
            allowBlank: false,          
        }, {
            xtype: 'textfield',
            fieldLabel: '密码',
            name: 'Password',
            allowBlank: false,
            inputType: 'password',
            maxLength: 35,
            minLength: passLen,
            beforeLabelTextTpl: required,
            listeners: {
                validitychange: function (field) {
                    field.next().validate();
                },
                blur: function (field) {
                    field.next().validate();
                }
            }
        }, {
            xtype: 'textfield',
            fieldLabel: '确认密码',
            name: 'confirmPwd',
            allowBlank: false,
            inputType: 'password',
            maxLength: 35,
            minLength: passLen,
            beforeLabelTextTpl: required,
            vtype: 'password',
            initialPassField: 'Password'
        }];
        passItems.push({
            xtype: 'container',
            height: 28,
            items: [{
                xtype: 'button',
                style: mystyle,
                width: 78,
                text: '保存',
                handler: function (btn) {
                    var form = btn.up('form');
                    me.changePass(form);
                    me.hide();
                }
            }]
        });

        var form2 = {
            xtype: 'form',
            collapsible: false,
            frame: false,
            jsonSubmit: true,
            title: '密码设置',
            style: 'margin: 2px 0 0 0',
            bodyPadding: '5 0 0 0',
            width: 500,
            fieldDefaults: {
                msgTarget: 'side',
                labelAlign: 'right',
                padding: '3 0 2 0',
                width: width,
                layout: 'fit',
                labelWidth: F.EN ? 120 : 100
            },
            items: passItems
        };
        var items = [form1, form2];
        return items;
    },
    saveUserInfo: function (form) {
        var me = this;
        //var recordId = me._recordId;
        var recordId = "20";
        var url = RM.Url('/Account/UpdateUser');   
        if (form.isValid()) {
            form.submit({
                type: 'ajax',
                url: url,
                params:{
                    Id: recordId
                },
                msg: '正在添加',
                method: 'POST',
                success: function (form, action) {
                    if (action.result.success) {
                        Ext.Msg.alert('提示信息', "修改成功");
                    } else {
                        Ext.Msg.alert('提示信息', "修改失败");
                    }
                    me.fireEvent('update_success', me, edit);
                },
                failure: function (form, action) {
                    Ext.Msg.alert('提示信息', "操作失败");
                }
            });
        }
    },
    changePass: function (form) {
        var me = this;
        var edit = me._isEdit;
        //var recordId = me._recordId;
        var recordId = "20";
        var url = RM.Url('/Account/UpdatePwd');
        if (form.isValid()) {
            form.submit({
                type: 'ajax',
                url: url,
                params: {
                    Id: recordId
                },
                msg: '正在添加',
                method: 'POST',
                success: function (form, action) {
                    if (action.result.success) {
                        Ext.Msg.alert('提示信息', "修改成功");
                    } else {
                        Ext.Msg.alert('提示信息', "修改失败");
                    }
                    me.fireEvent('update_success', me, edit);
                },
                failure: function (form, action) {
                    Ext.Msg.alert('提示信息', "操作失败");
                }
            });
        }
    }
});
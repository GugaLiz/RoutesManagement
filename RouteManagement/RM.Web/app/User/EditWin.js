Ext.define("RM.User.EditWin", {
    extend: "Ext.window.Window",
    modal: true,
    resizable: false,
    width: 405,
    height: 450,
    closeAction: 'hide',
    autoScroll: false,
    border: true,
    layout: 'fit',
    _isEdit: false,
    _recordId: 0,

    initComponent: function () {
        var me = this;
        var edit = me._isEdit;
        
        if (edit) {
            me.height = 380;
        } else {
            me.height = 300;
        }
        var text = edit ? '保存' : '添加';
        var title = edit ? '修改用户信息' : '添加用户信息';
        me.items = me.geteItems();
        me.setTitle(title);
        var buttons = [{
            text: '保存',
            handler: function (btn) {
                var form = me.down('form');
                me.saveUserInfo(form);
            }
        }];
        if (edit) {
            buttons = [];
        }
        buttons.push({
            text: '取消',
            style: 'top:330px',
            handler: function (btn) {
                me.hide();
            }
        });
        me.buttons = buttons;
        me.callParent();
        me.on('show', function (cmp) {
            var form = cmp.down('form');
            var fp = form.getForm();
            fp.reset();
            if (edit) {
                var recordId = cmp._recordId;
                fp.load({
                    url: RM.Url('/Account/UserGet/' + recordId),
                    msg: '正在加载',
                    success: function (form, action) {
                        var data = action.result.data;
                    },
                    failure: function (form, action) {
                        Ext.Msg.alert('提示信息', "数据加载失败");
                    }
                });
            }
        });
    },

    geteItems: function () {
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

        var edit = me._isEdit;
        var width = 370;
        var required = '<span style="color:red;font-weight:bold">*</span> ';

        var items = [];
        if (edit) {
            items.push({
                xtype: 'displayfield',
                fieldLabel: '用户名',
                name: 'Account',
                value: ''
            }, {
                xtype: 'hiddenfield',
                name: 'Id'
            });
        } else {
            items.push({
                xtype: 'textfield',
                fieldLabel: '用户名',
                beforeLabelTextTpl: required,
                name: 'Account',
                maxLength: 30,
                allowBlank: false
            });
        }

        items.push({
            xtype: 'textfield',
            fieldLabel: '昵称',
            name: 'Nickname',
            maxLength: 30,
        }, {
            xtype: 'textfield',
            fieldLabel: '邮箱',
            name: 'Email',
            vtype: 'email'
        });

        if (!edit) {
            items.push({
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
            });
        }

        items.push({
            xtype: 'textarea',
            fieldLabel: '备注',
            maxLength: 1000,
            name: 'Memo'
        });
        var form = null;
        var mystyle = 'left:85px';
        if (edit) {
            items.push({
                xtype: 'container',
                height: 28,
                items: [{
                    xtype: 'button',
                    style: mystyle,
                    width: 78,
                    text: '保存',
                    handler: function (btn) {
                        var form = btn.up('form');
                        me.saveUserInfo(form);
                    }
                }]
            });
            var passItems = [{
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
            var formItems = [{
                xtype: 'form',
                jsonSubmit: true,
                border: 0,
                layout: 'fit',
                flex: 1,
                fieldDefaults: {
                    labelAlign: 'right',
                    labelWidth: 80,
                    border: 0,
                    autoScroll: true,
                    hideEmptyLabel: false,
                    msgTarget: 'side'
                },
                items: [{
                    xtype: 'fieldset',
                    flex: 1,
                    title: '用户信息',
                    layout: 'anchor',
                    defaults: {
                        anchor: '100%'
                    },
                    items: items
                }]
            }, {
                xtype: 'form',
                border: 0,
                jsonSubmit: true,
                layout: 'fit',
                fieldDefaults: {
                    labelAlign: 'right',
                    labelWidth: 80,
                    border: 0,
                    autoScroll: true,
                    hideEmptyLabel: false,
                    msgTarget: 'side'
                },
                items: [{
                    xtype: 'fieldset',
                    flex: 1,
                    title: '修改密码',
                    layout: 'anchor',
                    defaults: {
                        anchor: '100%'
                    },
                    items: passItems
                }]
            }];
            form = {
                xtype: 'container',
                border: 0,
                style: 'padding:2px',
                layout: 'anchor',
                defaults: {
                    anchor: '100%'
                },
                items: formItems
            };
        } else {
            form = {
                bodyPadding: '16 2 2 2',
                xtype: 'form',
                jsonSubmit: true,
                fieldDefaults: {
                    labelAlign: 'right',
                    labelWidth: 80,
                    border: 0,
                    autoScroll: true,
                    hideEmptyLabel: false,
                    width: width,
                    msgTarget: 'side'
                },
                layout: {
                    type: 'vbox'
                },
                border: 0,
                items: items
            };
        }
        return [form];
    },

    saveUserInfo: function (form) {
        var me = this;
        var edit = me._isEdit;
        var url = '';
        if (edit) {
            url = RM.Url('/Account/UpdateUser');
        } else {
            url = RM.Url('/Account/AddUser');
        }
        if (form.isValid()) {

            form.submit({
                type: 'ajax',
                //clientValidation: true,
                url: url,
                msg: '正在添加',
                method: 'POST',
                success: function (form, action) {
                    if (action.result.success) {
                        Ext.Msg.alert('提示信息', "添加成功");
                    } else {
                        Ext.Msg.alert('提示信息', "添加失败");
                    }
                    me.fireEvent('update_success', me, edit);
                },
                failure: function (form, action) {
                    Ext.Msg.alert('提示信息', "操作失败");
                }
            });
        }
    },

    changePass:function(form){
        var me = this;
        var edit = me._isEdit;
        var recordId= me._recordId;
        var url = RM.Url('/Account/UpdatePwd');
        if (form.isValid()) {
            form.submit({
                type: 'ajax',
                url: url,
                params:{
                    Id:recordId
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
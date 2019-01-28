Ext.define('RM.Metro.ImportWin', {
    extend: 'Ext.window.Window',

    initComponent: function () {
        var me = this;
        var frmImport = me.settingPanel();

        Ext.apply(this, {
            title: '导入路线文件',
            buttonAlign: 'right',
            closable: true,
            layout: 'fit',
            modal: true,
            width: 320,
            height: 220,
            closeAction: 'hide',
            items: [frmImport],
            buttons: [{
                text: '确定',
                handler: function (btn) {
                    var form = frmImport;
                    me.uploadFile(form);
                    me.hide();
                }
            }, {
                text: '取消',
                handler: function (btn) {
                    me.hide();
                }
            }]
        });
        this.callParent();
    },

    settingPanel: function () {
        var me = this;
        var frmImport = Ext.create('Ext.form.Panel', {
            border: false,
            width: 450,
            autoHeight: true,
            plain: true,
            bodyStyle: 'padding-top:15px;',
            layout: 'form',
            columnWidth: 1,
            items: [{
                layout: 'column',
                columnWidth: 1,
                border: false,
                fileUpload: true,
                items: [
                    {
                        fieldLabel: '文件名称',
                        xtype: 'textfield',
                        name: 'filename',
                        value: '',
                        width: '100%',
                        labelWidth: 80,
                    }, {
                        fieldLabel: '上传文件',
                        xtype: 'filefield',
                        name: 'uploadinput',
                        //xtype: 'textfield',
                        //inputType: 'file',
                        buttonText: '浏览',
                        blankText: '请选择上传文件',
                        archor: '100%',
                        style: 'padding-top:15px;width:100%',
                        labelWidth: 80,
                        listeners: {
                            change: function (e, textfield) {
                                var arr = textfield.split('\\');
                                var fileName = arr[arr.length - 1];
                                var name = fileName.split('.');
                                name.pop();
                                frmImport.down('[name=filename]').setValue(name);
                            }
                        },
                    }]
            }]
        });

        return frmImport;
    },

    uploadFile: function (form) {
        var me = this;
        var f_name = form.down('[name=filename]').getValue();
        var loadin = form.down('[name=uploadinput]').getValue();
        if (loadin !== "" && loadin !== null) {
            Ext.Msg.show({
                modal: false,
                title: '请稍等...',
                msg: '正在上传...',
                closable: true,
                wait: true
            });
        }
        if (form.isValid()) {
            form.submit({
                params: {
                    Id: 1,
                    Name: f_name,
                    LineName: f_name,
                    File: loadin
                },
                url: RM.Url('/Metro/SaveMetro'),
                waitMsg: '正在上传...',
                success: function (form, action) {
                    me.fireEvent('update_success');
                    Ext.Msg.alert('提示信息', "文件上传成功");
                },
                failure: function () {
                    Ext.Msg.alert('提示信息', "文件上传失败");
                }
            });
        }
    }
});
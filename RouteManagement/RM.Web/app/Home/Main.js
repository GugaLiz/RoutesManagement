Ext.define('RM.Home.Main', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.rm_main'],

    border: 1,
    html: '<h1 style="margin: 8px">Admin main page</h1>',

    initComponent: function () {
        var me = this;
        me.callParent();
    }
});
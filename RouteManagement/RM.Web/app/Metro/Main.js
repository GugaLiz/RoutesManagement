Ext.define('RM.Metro.Main', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.rm_metro'],

    border: 0,
    layout:'border',
    //html: '<h1 style="margin: 8px">Metro main page</h1>',

    initComponent: function () {
        var me = this;
        me.items = me.buildItems();
        me.callParent();
    },

    buildItems: function () {
        var me = this;
        var grid = Ext.create('RM.Metro.Grid', {
            title: '地铁路线管理',
            region: 'west',
            floatable: false,
            collapsible: true,
            split: true,
            margins: '5 0 0 0',
            width: 305,
            minWidth: 200
        });

        var map = Ext.create('RM.Map.LFMapPanel', {
            region: 'center'
        });

        var items = [grid, map];
        return items;
    }
});
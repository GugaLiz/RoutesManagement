Ext.define('RM.Home.Viewport', {
    extend: 'Ext.container.Viewport',
    layout: 'border',
    initComponent: function () {
        var me = this;
        me.items = me.buildItems();
        me.callParent();
    },

    buildItems: function () {
        var me = this;
        var menu = Ext.create('RM.Home.Menu', {
            region: 'north'
        });

        var mainContainer = {
            itemId: 'FMain',
            xtype: 'container',
            region: 'center',
            layout: 'fit',
            items: []
        };
        return [menu, mainContainer];
    }
});
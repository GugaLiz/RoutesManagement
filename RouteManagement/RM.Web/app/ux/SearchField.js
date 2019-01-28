Ext.define('RM.ux.SearchField', {
    extend: 'Ext.form.field.Trigger',

    alias: 'widget.searchfield',

    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',

    trigger2Cls: Ext.baseCSSPrefix + 'form-search-trigger',

    hasSearch: false,
    paramName: 'query',

    initComponent: function () {
        this.callParent(arguments);
        this.on('specialkey', function (f, e) {
            if (e.getKey() == e.ENTER) {
                this.onTrigger2Click();
            }
        }, this);
    },

    afterRender: function () {
        this.callParent();
        var trig1 = this.triggerEl.elements[0].dom;
        if (trig1.parentElement.className.indexOf('x-unselectable') > -1) {
            trig1.parentElement.style.display = 'none';
        } else {
            trig1.style.display = 'none';
        }
    },

    onTrigger1Click: function () {
        var me = this,
            store = me.store,
            proxy = store ? store.getProxy() : null,
            val;

        if (me.hasSearch) {
            me.setValue('');
            if (store) {
                proxy.extraParams[me.paramName] = '';
                store.loadPage(1);
            }
            me.hasSearch = false;
            me.fireEvent('clear', me);
            var trig1 = this.triggerEl.elements[0].dom;
            if (trig1.parentElement.className.indexOf('x-unselectable') > -1) {
                trig1.parentElement.style.display = 'none';
            } else {
                trig1.style.display = 'none';
            }
            if (me.doComponentLayout) {
                me.doComponentLayout();
            }
        }
    },

    onTrigger2Click: function () {
        var me = this,
            store = me.store,
            proxy = store ? store.getProxy() : null,
            value = me.getValue();

        if (value.length < 1) {
            me.onTrigger1Click();
            return;
        }
        if (store) {
            proxy.extraParams[me.paramName] = value;
            store.loadPage(1);
        }
        me.hasSearch = true;
        me.fireEvent('search', me, value);
        var trig1 = this.triggerEl.elements[0].dom;
        if (trig1.parentElement.className.indexOf('x-unselectable') > -1) {
            trig1.parentElement.style.display = '';
        } else {
            trig1.style.display = '';
        }
        if (Ext.getVersion().major < 5) {
            me.doComponentLayout();
        }
    }
});
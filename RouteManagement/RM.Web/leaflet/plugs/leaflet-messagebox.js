L.Control.Messagebox = L.Control.extend({
    options: {
        position: 'topright',
        timeout: 3000
    },

    onAdd: function (map) {
        this._container = L.DomUtil.create('div', 'leaflet-control-messagebox');
        this._container.style.display = 'block'; 
        L.DomEvent.disableClickPropagation(this._container);
        return this._container;
    },
    getEl: function () {
        return this._container;
    }
});

L.Map.mergeOptions({
    messagebox: false
});

L.Map.addInitHook(function () {
    if (this.options.messagebox) {
        this.messagebox = new L.Control.Messagebox();
        this.addControl(this.messagebox);
    }
});

L.control.messagebox = function (options) {
    return new L.Control.Messagebox(options);
};

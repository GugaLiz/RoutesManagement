L.MarkerClusterGroup.prototype.setOffset = function (fn) {
    var layers = this.getLayers();
    var tem = [];
    for (var i = 0, len = layers.length; i < len; i++) {
        var layer = layers[i];
        if (layer.setOffset) {
            layer.setOffset(fn);
            tem.push(layer);
        }
    }
}

L.LayerGroup.include({
    setOffset: function (fn) {
        var layers = this.getLayers();
        for (var i = 0, len = layers.length; i < len; i++) {
            var layer = layers[i];
            if (layer.setOffset) {
                layer.setOffset(fn);
            }
        }
    }
});
L.CircleMarkerOffset = L.CircleMarker.extend({
    statics: {
        applyOffset: function (obj) {
            obj.setOffset = function (fn) {
                return L.CircleMarkerOffset.prototype.setOffset.apply(obj, [fn]);

            }
        }
    },
    setOffset: function (fn) {
        if (!this.options.offset) {
            this.options.offset = { x: 0.0, y: 0.0 };
        }
        var offset = this.options.offset;
        var temLatlng = this.getLatLng();
        var offsetLat = 0.0, offsetLng = 0.0;
        var lat = temLatlng.lat - offset.y, lng = temLatlng.lng - offset.x;
        var newLatlng = fn(lat, lng);
        offsetLat = newLatlng.lat - lat; // +offset.y;
        offsetLng = newLatlng.lng - lng; // +offset.x;
        this.setLatLng(newLatlng);
        offset.y = offsetLat;
        offset.x = offsetLng;
        return this;
    }
});


L.MarkerOffset = L.Marker.extend({
    statics: {
        applyOffset: function (obj) {
            obj.setOffset = function (fn) {
                return L.MarkerOffset.prototype.setOffset.apply(obj, [fn]);

            }
        }
    },
    setOffset: function (fn) {
        if (!this.options.offset) {
            this.options.offset = { x: 0.0, y: 0.0 };
        }
        var offset = this.options.offset;
        var temLatlng = this.getLatLng();
        var offsetLat = 0.0, offsetLng = 0.0;
        var lat = temLatlng.lat - offset.y, lng = temLatlng.lng - offset.x;
        var newLatlng = fn(lat, lng);
        offsetLat = newLatlng.lat - lat; // +offset.y;
        offsetLng = newLatlng.lng - lng; // +offset.x;
        this.setLatLng(newLatlng);
        offset.y = offsetLat;
        offset.x = offsetLng;
        return this;
    }
})

L.PolylineOffset = L.Polyline.extend({
    statics: {
        applyOffset: function (obj) {
            obj.setOffset = function (fn) {
                return L.PolylineOffset.prototype.setOffset.apply(obj, [fn]);

            }
        }
    },
    setOffset: function (fn) {

        if (!this.options.offset) {
            this.options.offset = { x: 0.0, y: 0.0 };
        }
        var offset = this.options.offset
        if (this._latlngs && this._latlngs.length > 0) {
            var temLatlng = this._latlngs[0];
            var offsetLat = 0.0, offsetLng = 0.0;
            var lat = temLatlng.lat - offset.y, lng = temLatlng.lng - offset.x;
            var newLatlng = fn(lat, lng);
            offsetLat = newLatlng.lat - lat; // +offset.y;
            offsetLng = newLatlng.lng - lng; // +offset.x;
            var latlngs = [];
            for (var i = 0, len = this._latlngs.length; i < len; i++) {
                var latlng = this._latlngs[i];
                latlng.lat = latlng.lat - offset.y + offsetLat;
                latlng.lng = latlng.lng - offset.x + offsetLng;
                latlngs.push(latlng);
            }
            offset.y = offsetLat;
            offset.x = offsetLng;
            this.setLatLngs(latlngs);
        }
        return this;
    }
});

L.PolygonOffset = L.Polyline.extend({
    statics: {
        applyOffset: function (obj) {
            obj.setOffset = function (fn) {
                return L.PolygonOffset.prototype.setOffset.apply(obj, [fn]);

            }
        }
    },
    setOffset: function (fn) {

        if (!this.options.offset) {
            this.options.offset = { x: 0.0, y: 0.0 };
        }
        var offset = this.options.offset
        if (this._latlngs && this._latlngs.length > 0) {
            var len = this._latlngs.length;
            if (offset.sourceLatlng) {
                temLatlng = offset.sourceLatlng;
            } else {
                for (var i = 0; i < len; i++) {
                    var listLatlngs = this._latlngs[0]
                    if (listLatlngs.length > 0) {
                        temLatlng = listLatlngs[0];
                        offset.sourceLatlng = L.latLng(temLatlng.lat, temLatlng.lng);
                        break;
                    }
                }
            }
            if (!temLatlng) {
                return;
            }
            var offsetLat = 0.0, offsetLng = 0.0;
            var lat = temLatlng.lat - offset.y, lng = temLatlng.lng - offset.x;
            var newLatlng = fn(lat, lng);
            offsetLat = newLatlng.lat - lat; // +offset.y;
            offsetLng = newLatlng.lng - lng; // +offset.x;
            var latlngs = [];
            for (var i = 0; i < len; i++) {
                var listLatlngs = this._latlngs[0]
                var points = [];
                for (var i = 0, tlen = listLatlngs.length; i < tlen; i++) {
                    var latlng = listLatlngs[i];
                    latlng.lat = latlng.lat - offset.y + offsetLat;
                    latlng.lng = latlng.lng - offset.x + offsetLng;
                    points.push(latlng);
                }
                latlngs.push(points);
            }
            offset.y = offsetLat;
            offset.x = offsetLng;
            this.setLatLngs(latlngs);
        }
        return this;
    }
});

L.CanvasOverlayGL.prototype.setOffset = function (fn) {
    this.offsetFn = fn;
}

L.CanvasOverlay.prototype.setOffset = function (fn) {
    this.offsetFn = fn;
}
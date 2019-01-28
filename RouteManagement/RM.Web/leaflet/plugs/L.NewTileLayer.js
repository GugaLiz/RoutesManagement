L.NewTileLayer = L.TileLayer.extend({
    tile2quad: function (x, y, z) {
        var quad = '';
        for (var i = z; i > 0; i--) {
            var digit = 0;
            var mask = 1 << (i - 1);
            if ((x & mask) !== 0) digit += 1;
            if ((y & mask) !== 0) digit += 2;
            quad = quad + digit;
        }
        return quad;
    },
    getTileUrl: function (coords) {
        var x = coords.x;
        var y = this.options.tms ? this._globalTileRange.max.y - coords.y : coords.y;
        var z = this._getZoomForUrl();
        var maxTiles = Math.floor(Math.pow(2, z));
        var x1 = x;
        var y1 = maxTiles - y - 1;
        var x2 = Math.floor(x1 / 16);
        var y2 = Math.floor(y1 / 16);
        var quadkey = this.tile2quad(x, y, z);
        return L.Util.template(this._url, L.extend({
            r: this.options.detectRetina && L.Browser.retina && this.options.maxZoom > 0 ? '@2x' : '',
            s: this._getSubdomain(coords),
            x: x,
            y: y,
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            z: z,
            quadkey: quadkey
        }, this.options));
    },

    _addTile: function (coords, container) {
        var tilePos = this._getTilePos(coords),
            key = this._tileCoordsToKey(coords);
        if (this._offset) {
            //tilePos = L.point(tilePos.x - 20, tilePos.y - 20);
            tilePos = L.point(tilePos.x - this._offset[0],
                    tilePos.y - this._offset[1]);
            //2131099649
            //console.info(tilePos);
        }

        var tile = this.createTile(this._wrapCoords(coords), L.bind(this._tileReady, this, coords));

        //if (this._is_base && me._base_gray_mode) {
        //    tile.style.filter = 'gray';
        //    L.DomUtil.addClass(tile, 'gray');
        //}
        //console.info(tile);

        this._initTile(tile);

        // if createTile is defined with a second argument ("done" callback),
        // we know that tile is async and will be ready later; otherwise
        if (this.createTile.length < 2) {
            // mark tile as ready, but delay one frame for opacity animation to happen
            L.Util.requestAnimFrame(L.bind(this._tileReady, this, coords, null, tile));
        }

        L.DomUtil.setPosition(tile, tilePos);

        // save tile in cache
        this._tiles[key] = {
            el: tile,
            coords: coords,
            current: true
        };

        container.appendChild(tile);
        this.fire('tileloadstart', {
            tile: tile,
            coords: coords
        });
    },
    _reset: function (e) {
        for (var key in this._tiles) {
            var tile = this._tiles[key];
            if (!tile.complete) {
                tile.src = L.Util.emptyImageUrl;
            }
            this.fire('tileunload', { tile: this._tiles[key] });
        }

        this._tiles = {};
        this._tilesToLoad = 0;

        if (this.options.reuseTiles) {
            this._unusedTiles = [];
        }

        this._tileContainer.innerHTML = '';

        if (this._animated && e && e.hard) {
            this._clearBgBuffer();
        }

        this._initContainer();
    },
    abortLoading: function () {
        var i, tile, el;
        for (i in this._tiles) {
            tile = this._tiles[i];
            el = tile.el;
            el.onload = L.Util.falseFn;
            el.onerror = L.Util.falseFn;
            if (!el.complete) {
                el.src = L.Util.emptyImageUrl;
                var parent = el.parentNode;
                if (parent) {
                    parent.removeChild(el);
                }
            }
        }
        //this._tiles = null;
    }
});

L.newTileLayer = function (url, options) {
    return new L.NewTileLayer(url, options);
};

/*
* L.SingleTile uses L.ImageOverlay to display a single-tile WMS layer.
* url parameter must accept WMS-style width, height and bbox.
*/

L.SingleTile = L.ImageOverlay.extend({
    defaultWmsParams: {
        service: 'WMS',
        request: 'GetMap',
        version: '1.3.0',
        styles: '',
        format: 'image/jpeg',
        transparent: false
    },

    initialize: function (url, params, options) {
        if (params) {
            this.wmsParams = L.extend({}, this.defaultWmsParams);
            this.wmsParams = L.extend(this.wmsParams, params);
        } else {
            this.wmsParams = L.extend({}, this.defaultWmsParams);
        }
        this._options = options;
        L.ImageOverlay.prototype.initialize.call(this, url, null, params);
    },

    setParams: function (params) {
        L.extend(this.wmsParams, params);
        return this;
    },

    redraw: function () {
        this._updateImageUrl();
    },

    onAdd: function (map) {
        var projectionKey = parseFloat(this.wmsParams.version) >= 1.3 ? 'crs' : 'srs';
        //		this.wmsParams[projectionKey] = 'EPSG:4326'; // this is incorrect!
        this.wmsParams[projectionKey] = map.options.crs.code;
        L.ImageOverlay.prototype.onAdd.call(this, map);
        map.on('moveend', this._updateImageUrl, this);
    },

    onRemove: function (map) {
        map.on('moveend', this._updateImageUrl, this);
        L.ImageOverlay.prototype.onRemove.call(this, map);
    },

    // Copypasted from L.ImageOverlay (dirty hack)
    _initImage: function () {
        this._image = L.DomUtil.create('img', 'leaflet-image-layer');

        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            L.DomUtil.addClass(this._image, 'leaflet-zoom-animated');
        } else {
            L.DomUtil.addClass(this._image, 'leaflet-zoom-hide');
        }

        this._updateOpacity();
        this._bounds = this._map.getBounds();

        //TODO createImage util method to remove duplication
        L.extend(this._image, {
            galleryimg: 'no',
            onselectstart: L.Util.falseFn,
            onmousemove: L.Util.falseFn,
            onload: L.bind(this._onImageLoad, this),
            onerror: L.bind(this.fire, this, 'onimageerror'),
            src: this._constructUrl()
        });
    },

    _onImageLoad: function () {
        this._bounds = this._map.getBounds();
        this._reset();
        this.fire('load');
    },

    _updateImageUrl: function () {
        this._image.src = this._constructUrl();
    },

    _constructUrl: function () {
        var size = this._map.getSize();
        var b = this._map.getBounds();
        var params = L.extend({}, this.wmsParams);
        if (this._options && this._options.getUrlParams) {
            var haveMap = this._options.getUrlParams(this._map, size, b, this._map.getZoom(), params);
            //                    alert(haveMap);
            //console.info(this._url, this.wmsParams);
            //                    debugger;
            if (!haveMap) {
                return L.Util.emptyImageUrl;
            }
        }
        var url = this._url + L.Util.getParamString(params, this._url)
         + "&width=" + size.x + "&height=" + size.y + "&bbox=" + b.toBBoxString();
        return url;
    }
});

L.newSingleTile = function (url, params, options) {
    return new L.SingleTile(url, params, options);
};


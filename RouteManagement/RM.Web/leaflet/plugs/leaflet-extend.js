L.TileLayer.prototype.abortLoading = function () {
    var i, tile;
    for (i in this._tiles) {
        tile = this._tiles[i];
        tile.onload = L.Util.falseFn;
        tile.onerror = L.Util.falseFn;
        if (!tile.complete) {
            tile.src = L.Util.emptyImageUrl;
            var parent = tile.parentNode;
            if (parent) {
                parent.removeChild(tile);
            }
        }
    }
}

L.LayerGroup.prototype.abortLoading = function () {
    var layers = this.getLayers();
    for (var i = 0, len = layers.length; i < len; i++) {
        var layer = layers[i];
        if (layer.abortLoading) {
            layer.abortLoading();
        }
    }
}

L.TileLayer.prototype._reset = function (e) {
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
}

L.LatLngBounds.prototype.merge = function (bounds) {
    var temNorth = bounds.getNorth();
    this._northEast.lat = Math.max(this._northEast.lat, bounds.getNorth());
    this._northEast.lng = Math.max(this._northEast.lng, bounds.getEast());
    this._southWest.lat = Math.min(this._southWest.lat, bounds.getSouth());
    this._southWest.lng = Math.min(this._southWest.lng, bounds.getWest());
    return this;
}

L.Polyline.include({
    copy: function () {
        var offsetLat = 0.0, offsetLng = 0.0;
        var offset = null;
        if (this.options.offset) {
            offset = this.options.offset;
            offsetLat = offset.y;
            offsetLng = offset.x;
        }
        var latlngs = [];
        var len = this._latlngs.length;
        for (var i = 0; i < len; i++) {
            var listLatlngs = this._latlngs[0]
            var points = [];
            for (var i = 0, tlen = listLatlngs.length; i < tlen; i++) {
                var latlng = listLatlngs[i];
                var lat = latlng.lat - offsetLat;
                var lng = latlng.lng - offsetLng;
                points.push(L.latLng(lat, lng));
            }
            latlngs.push(points);
        }
        return L.polygon(latlngs);
    }
});
L.Map.include({
    _defaultOffsetFn: function (lat, lng) {
        return new L.latLng(lat, lng);
    },
    //getOffsetFn: function () {
    //    if (this._offsetFn) {
    //        return this._offsetFn;
    //    } else {
    //        return this._defaultOffsetFn;
    //    }
    //},
    setOffsetFn: function (fn) {
        this._offsetFn = fn;
    },
    fitBoundsOffset: function (bounds, options) {
        var offsetFn = this.getOffsetFn();
        options = options || {};
        bounds = bounds.getBounds ? bounds.getBounds() : L.latLngBounds(bounds);

        var paddingTL = L.point(options.paddingTopLeft || options.padding || [0, 0]),
		    paddingBR = L.point(options.paddingBottomRight || options.padding || [0, 0]),

		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));

        zoom = (options.maxZoom) ? Math.min(options.maxZoom, zoom) : zoom;

        var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),
            sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
        swPoint = this.project(offsetFn(sw.lat, sw.lng), zoom),
		    nePoint = this.project(offsetFn(ne.lat, ne.lng), zoom),
		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

        return this.setView(center, zoom, options);
    },
    getOffsetFnByType: function (type) {
        var me = this;
        var fn = L.EvilTransform.no_encrypt;
        switch (type) {
            case 1:
                fn = L.EvilTransform.google_encrypt;
                break;
            case 2:
                fn = L.EvilTransform.bd_encrypt;
                break;
        }
        return fn;
    },
    getOffsetFn: function () {
        var type = null;
        if (this._baseLayer && this._baseLayer.options) {
            type = this._baseLayer.options.offsetType;
        }
        return this.getOffsetFnByType(type);
    },
    getDecryptFnByType: function (type) {
        var me = this;
        var fn = L.EvilTransform.no_encrypt;
        switch (type) {
            case 1:
                fn = L.EvilTransform.google_decrypt;
                break;
            case 2:
                fn = L.EvilTransform.bd_decrypt;
                break;
        }
        return fn;
    },
    getDecryptFn: function () {
        var type = null;
        if (this._baseLayer && this._baseLayer.options) {
            type = this._baseLayer.options.offsetType;
        }
        return this.getDecryptFnByType(type);
    }
})


/*
* Leaflet.draw assumes that you have already included the Leaflet library.
*/
L.Draw = L.Draw || {};
L.drawLocal = {
    draw: {
        handlers: {

            polyline: {
                error: '<strong>Error:</strong> shape edges cannot cross!',
                tooltip: {
                    start: 'Click to determine the starting point.',
                    cont: 'Click to continue drawing line.',
                    end: 'Click last point to finish line.'
                }
            }
        }
    }
};


L.LatLngUtil = {
    // Clones a LatLngs[], returns [][]
    cloneLatLngs: function (latlngs) {
        var clone = [];
        for (var i = 0, l = latlngs.length; i < l; i++) {
            clone.push(this.cloneLatLng(latlngs[i]));
        }
        return clone;
    },

    cloneLatLng: function (latlng) {
        return L.latLng(latlng.lat, latlng.lng);
    }
};

L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
    // Ported from the OpenLayers implementation. See https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270
    geodesicArea: function (latLngs) {
        var pointsCount = latLngs.length,
			area = 0.0,
			d2r = L.LatLng.DEG_TO_RAD,
			p1, p2;

        if (pointsCount > 2) {
            for (var i = 0; i < pointsCount; i++) {
                p1 = latLngs[i];
                p2 = latLngs[(i + 1) % pointsCount];
                area += ((p2.lng - p1.lng) * d2r) *
						(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
            }
            area = area * 6378137.0 * 6378137.0 / 2.0;
        }

        return Math.abs(area);
    },

    readableArea: function (area, isMetric) {
        var areaStr;

        if (isMetric) {
            if (area >= 10000) {
                areaStr = (area * 0.0001).toFixed(2) + ' ha';
            } else {
                areaStr = area.toFixed(2) + ' m&sup2;';
            }
        } else {
            area /= 0.836127; // Square yards in 1 meter

            if (area >= 3097600) { //3097600 square yards in 1 square mile
                areaStr = (area / 3097600).toFixed(2) + ' mi&sup2;';
            } else if (area >= 4840) {//48040 square yards in 1 acre
                areaStr = (area / 4840).toFixed(2) + ' acres';
            } else {
                areaStr = Math.ceil(area) + ' yd&sup2;';
            }
        }

        return areaStr;
    },

    readableDistance: function (distance, isMetric) {
        var distanceStr;

        if (isMetric) {
            // show metres when distance is < 1km, then show km
            if (distance > 1000) {
                distanceStr = (distance / 1000).toFixed(2) + ' km';
            } else {
                distanceStr = Math.ceil(distance) + ' m';
            }
        } else {
            distance *= 1.09361;

            if (distance > 1760) {
                distanceStr = (distance / 1760).toFixed(2) + ' miles';
            } else {
                distanceStr = Math.ceil(distance) + ' yd';
            }
        }

        return distanceStr;
    },
    readAngle: function (latlng1, latlng2) {
        //两点的x、y值
        x = latlng2.lng - latlng1.lng;
        y = latlng2.lat - latlng1.lat;
        hypotenuse = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
        //斜边长度
        cos = x / hypotenuse;
        radian = Math.acos(cos);
        //求出弧度
        angle = 180 / (Math.PI / radian);
        //用弧度算出角度        
        if (y < 0) {
            angle = 90.0 + angle;
        } else if ((y == 0) && (x < 0)) {
            angle = 270;
        } else {
            if (angle <= 90) {
                angle = 90 - angle;
            } else {
                angle = 450 - angle;
            }
        }
        return angle;
    }
});

L.Polyline.include({
    // Check to see if this polyline has any linesegments that intersect.
    // NOTE: does not support detecting intersection for degenerate cases.
    intersects: function () {
        var points = this._originalPoints,
			len = points ? points.length : 0,
			i, p, p1;

        if (this._tooFewPointsForIntersection()) {
            return false;
        }

        for (i = len - 1; i >= 3; i--) {
            p = points[i - 1];
            p1 = points[i];


            if (this._lineSegmentsIntersectsRange(p, p1, i - 2)) {
                return true;
            }
        }

        return false;
    },

    // Check for intersection if new latlng was added to this polyline.
    // NOTE: does not support detecting intersection for degenerate cases.
    newLatLngIntersects: function (latlng, skipFirst) {
        // Cannot check a polyline for intersecting lats/lngs when not added to the map
        if (!this._map) {
            return false;
        }

        return this.newPointIntersects(this._map.latLngToLayerPoint(latlng), skipFirst);
    },

    // Check for intersection if new point was added to this polyline.
    // newPoint must be a layer point.
    // NOTE: does not support detecting intersection for degenerate cases.
    newPointIntersects: function (newPoint, skipFirst) {
        var points = this._originalPoints,
			len = points ? points.length : 0,
			lastPoint = points ? points[len - 1] : null,
        // The previous previous line segment. Previous line segment doesn't need testing.
			maxIndex = len - 2;

        if (this._tooFewPointsForIntersection(1)) {
            return false;
        }

        return this._lineSegmentsIntersectsRange(lastPoint, newPoint, maxIndex, skipFirst ? 1 : 0);
    },

    // Polylines with 2 sides can only intersect in cases where points are collinear (we don't support detecting these).
    // Cannot have intersection when < 3 line segments (< 4 points)
    _tooFewPointsForIntersection: function (extraPoints) {
        var points = this._originalPoints,
			len = points ? points.length : 0;
        // Increment length by extraPoints if present
        len += extraPoints || 0;

        return !this._originalPoints || len <= 3;
    },

    // Checks a line segment intersections with any line segments before its predecessor.
    // Don't need to check the predecessor as will never intersect.
    _lineSegmentsIntersectsRange: function (p, p1, maxIndex, minIndex) {
        var points = this._originalPoints,
			p2, p3;

        minIndex = minIndex || 0;

        // Check all previous line segments (beside the immediately previous) for intersections
        for (var j = maxIndex; j > minIndex; j--) {
            p2 = points[j - 1];
            p3 = points[j];

            if (L.LineUtil.segmentsIntersect(p, p1, p2, p3)) {
                return true;
            }
        }

        return false;
    }
});


L.Util.extend(L.LineUtil, {
    // Checks to see if two line segments intersect. Does not handle degenerate cases.
    // http://compgeom.cs.uiuc.edu/~jeffe/teaching/373/notes/x06-sweepline.pdf
    segmentsIntersect: function (/*Point*/p, /*Point*/p1, /*Point*/p2, /*Point*/p3) {
        return this._checkCounterclockwise(p, p2, p3) !==
				this._checkCounterclockwise(p1, p2, p3) &&
				this._checkCounterclockwise(p, p1, p2) !==
				this._checkCounterclockwise(p, p1, p3);
    },

    // check to see if points are in counterclockwise order
    _checkCounterclockwise: function (/*Point*/p, /*Point*/p1, /*Point*/p2) {
        return (p2.y - p.y) * (p1.x - p.x) > (p1.y - p.y) * (p2.x - p.x);
    }
});

L.Text = L.Layer.extend({
    initialize: function (map) {

        this._singleLineLabel = false;

    },
    onAdd: function (map) {
        this._map = map;
        this._container = L.DomUtil.create('div', 'measure');
        this.getPane().appendChild(this._container);
        this.update();
    },
    update: function () {
        if (this._latlng) {
            var pos = this._map.latLngToLayerPoint(this._latlng);
            this._setPos(pos);
        }
    },
    _setPos: function (pos) {
        L.DomUtil.setPosition(this._container, pos);

    },
    onRemove: function (map) {
        if (this._container) {
            L.DomUtil.remove(this._container);
            //this._popupPane.removeChild(this._container);
            this._container = null;
        }
    },
    _animateZoom: function (opt) {
        var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

        this._setPos(pos);
    },
    _reset: function () {
        if (this._latlng) {
            var pos = this._map.latLngToLayerPoint(this._latlng);
            L.DomUtil.setPosition(this._container, pos);
        }
    },
    dispose: function () {
        this._map.removeLayer(this);
    },

    updateContent: function (labelText) {
        if (!this._container) {
            return this;
        }
        labelText.subtext = labelText.subtext || '';

        // update the vertical position (only if changed)
        if (labelText.subtext.length === 0 && !this._singleLineLabel) {
            L.DomUtil.addClass(this._container, 'measure-single');
            this._singleLineLabel = true;
        }
        else if (labelText.subtext.length > 0 && this._singleLineLabel) {
            L.DomUtil.removeClass(this._container, 'measure-single');
            this._singleLineLabel = false;
        }

        this._container.innerHTML =
			(labelText.subtext.length > 0 ? '<span class="leaflet-draw-tooltip-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
			'<span>' + labelText.text + '</span>';

        return this;
    },
    getEvents: function () {
        var events = {
            zoom: this.update,
            viewreset: this.update
        };

        if (this._zoomAnimated) {
            events.zoomanim = this._animateZoom;
        }

        return events;
    },
    updatePosition: function (latlng) {
        if (!latlng) {
            return;
        }
        this._latlng = latlng;
        this.update();
        return this;
    },

    showAsError: function () {
        if (this._container) {
            L.DomUtil.addClass(this._container, 'measure-error');
        }
        return this;
    },
    showClose: function (isLeft) {
        if (this._container) {
            L.DomUtil.addClass(this._container, 'measure-close');
            this._container.style.marginLeft = isLeft ? "8px" : "-18px";
        }
        return this;
    },
    showTop: function (isTop) {
        if (this._container) {
            L.DomUtil.addClass(this._container, 'measure-top');
            this._container.style.marginTop = isTop ? "-35px" : "10px";
            this._container.style.marginLeft = "-5px";
        }
        return this;
    },
    showAsTip: function () {
        if (this._container) {
            L.DomUtil.addClass(this._container, 'measure-move-tip');
        }
        return this;
    },

    removeError: function () {
        if (this._container) {
            L.DomUtil.removeClass(this._container, 'measure-error');
        }
        return this;
    }
});

L.Draw.Measure = L.Handler.extend({
    includes: L.Mixin.Events,

    initialize: function (map, options) {
        this._map = map;
        this._container = map._container;
        this._overlayPane = map._panes.overlayPane;
        this._popupPane = map._panes.popupPane;

        // Merge default shapeOptions options with custom shapeOptions
        if (options && options.shapeOptions) {
            options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
        }
        L.setOptions(this, options);
    },

    enable: function () {
        if (this._enabled) { return; }

        L.Handler.prototype.enable.call(this);

        this.fire('enabled', { handler: this.type });

        this._map.fire('draw:drawstart', { layerType: this.type });
    },

    disable: function () {
        if (!this._enabled) { return; }
        L.Handler.prototype.disable.call(this);

        this._map.fire('draw:drawstop', { layerType: this.type });

        this.fire('disabled', { handler: this.type });
    },

    dispose: function () {
        if (this._tips) {
            var len = this._tips.length;
            if (len > 0) {
                for (var i = 0; i < len; i++) {
                    this._tips[i].dispose();
                }
            }
        }
        
        L.Handler.prototype.disable.call(this);

        this._map.fire('draw:drawstop', { layerType: this.type });

        this.fire('dispose', { handler: this.type });
    },

    addHooks: function () {
        var map = this._map;

        if (map) {
            L.DomUtil.disableTextSelection();

            map.getContainer().focus();

            this._tooltip = new L.Text();
            map.addLayer(this._tooltip);
            this._tooltip.showAsTip();

        }
    },

    removeHooks: function () {
        if (this._map) {
            L.DomUtil.enableTextSelection();

            //this._tooltip.dispose();
            this._tooltip = null;
        }
    },

    setOptions: function (options) {
        L.setOptions(this, options);
    },

    _fireCreatedEvent: function (layer) {
        this._map.fire('draw:created', { layer: layer, layerType: this.type });
    }
});


L.Draw.LineMeasure = L.Draw.Measure.extend({
    statics: {
        TYPE: 'polyline'
    },

    Poly: L.Polyline,

    options: {
        allowIntersection: true,
        repeatMode: false,
        drawError: {
            color: '#b00b00',
            timeout: 2500
        },
        icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon measure-circle'
        }),
        guidelineDistance: 20,
        maxGuideLineLength: 4000,
        shapeOptions: {
            stroke: true,
            color: '#ff6319',
            weight: 3,
            opacity: 0.8,
            fill: false,
            clickable: true
        },
        metric: true, // Whether to use the metric meaurement system or imperial
        showLength: true, // Whether to display distance in the tooltip
        zIndexOffset: 2000 // This should be > than the highest z-index any map layers
    },

    initialize: function (map, options) {
        // Need to set this here to ensure the correct message is used.
        this.options.drawError.message = F.Map.Error;

        // Merge default drawError options with custom options
        if (options && options.drawError) {
            options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
        }

        // Save the type so super can fire, need to do this as cannot do this.TYPE :(
        this.type = L.Draw.LineMeasure.TYPE;

        L.Draw.Measure.prototype.initialize.call(this, map, options);
    },

    addHooks: function () {
        L.Draw.Measure.prototype.addHooks.call(this);
        if (this._map) {
            this._markers = [];
            this._tips = [];

            this._markerGroup = new L.LayerGroup();
            this._map.addLayer(this._markerGroup);

            this._poly = new L.Polyline([], this.options.shapeOptions);

            this._tooltip.updateContent(this._getTooltipText());

            // Make a transparent marker that will used to catch click events. These click
            // events will create the vertices. We need to do this so we can ensure that
            // we can create vertices over other map layers (markers, vector layers). We
            // also do not want to trigger any click handlers of objects we are clicking on
            // while drawing.
            if (!this._mouseMarker) {
                this._mouseMarker = L.marker(this._map.getCenter(), {
                    icon: L.divIcon({
                        className: 'measure-marker',
                        iconAnchor: [5, 5],
                        iconSize: [10, 10]
                    }),
                    opacity: 0,
                    zIndexOffset: this.options.zIndexOffset
                });
            }

            this._mouseMarker
				.on('mousedown', this._onMouseDown, this)
				.addTo(this._map);

            this._map
				.on('mousemove', this._onMouseMove, this)
				.on('mouseup', this._onMouseUp, this)
				.on('zoomend', this._onZoomEnd, this);
        }
    },

    removeHooks: function () {

        L.Draw.Measure.prototype.removeHooks.call(this);

        this._clearHideErrorTimeout();

        this._cleanUpShape();

        // remove markers from map
        this._map.removeLayer(this._markerGroup);
        delete this._markerGroup;
        delete this._markers;
        delete this._tips;

        this._map.removeLayer(this._poly);
        delete this._poly;

        this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseup', this._onMouseUp, this);
        this._map.removeLayer(this._mouseMarker);
        delete this._mouseMarker;

        // clean up DOM
        this._clearGuides();

        this._map
			.off('mousemove', this._onMouseMove, this)
			.off('zoomend', this._onZoomEnd, this);
    },

    deleteLastVertex: function () {
        if (this._markers.length <= 1) {
            return;
        }

        var lastMarker = this._markers.pop(),
			poly = this._poly,
			latlng = this._poly.spliceLatLngs(poly.getLatLngs().length - 1, 1)[0];

        this._markerGroup.removeLayer(lastMarker);

        if (poly.getLatLngs().length < 2) {
            this._map.removeLayer(poly);
        }

        this._vertexChanged(latlng, false);
    },

    addVertex: function (latlng) {
        var markersLength = this._markers.length;

        if (markersLength > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
            this._showErrorTooltip();
            return;
        }
        else if (this._errorShown) {
            this._hideErrorTooltip();
        }

        this._markers.push(this._createMarker(latlng));


        this._poly.addLatLng(latlng);

        if (this._poly.getLatLngs().length === 2) {
            this._map.addLayer(this._poly);
        }


        this._vertexChanged(latlng, true);
    },

    _finishShape: function () {
        var intersects = this._poly.newLatLngIntersects(this._poly.getLatLngs()[0], true);

        if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
            this._showErrorTooltip();
            return;
        }

        this._fireCreatedEvent();
        //this.disable();
        this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseup', this._onMouseUp, this);
        this._map
			.off('mousemove', this._onMouseMove, this)
			.off('zoomend', this._onZoomEnd, this);
        this._tooltip.dispose();



        var latlngs = this._poly.getLatLngs(), len = latlngs.length;
        var last = latlngs[len - 1], pre = latlngs[len - 2];
        if (this._tips.length > 0) {
            var tLen = this._tips.length;
            var lastTip = this._tips[tLen - 1];
            lastTip.showTop(last.lat - pre.lat >= 0);
        }
        if (len > 0) {
            var tip = new L.Text();
            this._map.addLayer(tip);

            tip.updatePosition(latlngs[len - 1]);
            tip.showClose(last.lng - pre.lng >= 0);
            var me = this;
            tip._container.onclick = function () {
                this.onclikc = null;
                tip.dispose();
                me.dispose();
            }

        }

        //return;
        if (this.options.repeatMode) {
            this.enable();
        }
    },

    //Called to verify the shape is valid when the user tries to finish it
    //Return false if the shape is not valid
    _shapeIsValid: function () {
        return true;
    },

    _onZoomEnd: function () {
        this._updateGuide();
    },

    _onMouseMove: function (e) {
        var newPos = e.layerPoint,
			latlng = e.latlng;

        // Save latlng
        // should this be moved to _updateGuide() ?
        this._currentLatLng = latlng;

        this._updateTooltip(latlng);

        // Update the guide line
        this._updateGuide(newPos);

        // Update the mouse marker position
        this._mouseMarker.setLatLng(latlng);

        L.DomEvent.preventDefault(e.originalEvent);
    },

    _vertexChanged: function (latlng, added) {
        this._updateFinishHandler();

        this._updateRunningMeasure(latlng, added);

        this._clearGuides();

        this._updateTooltip();

        var tip = new L.Text();
        this._map.addLayer(tip);
        tip.updatePosition(latlng);
        tip.updateContent({
            text: this._getMeasurementString() /*,
					subtext: "distanceStr"*/
        });
        this._tips.push(tip);
    },

    _onMouseDown: function (e) {
        var originalEvent = e.originalEvent;
        this._mouseDownOrigin = L.point(originalEvent.clientX, originalEvent.clientY);
    },

    _onMouseUp: function (e) {
        if (this._mouseDownOrigin) {
            // We detect clicks within a certain tolerance, otherwise let it
            // be interpreted as a drag by the map
            var distance = L.point(e.originalEvent.clientX, e.originalEvent.clientY)
				.distanceTo(this._mouseDownOrigin);
            if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) {
                this.addVertex(e.latlng);
            }
        }
        this._mouseDownOrigin = null;
    },

    _updateFinishHandler: function () {
        var markerCount = this._markers.length;
        // The last marker should have a click handler to close the polyline
        if (markerCount > 1) {
            this._markers[markerCount - 1].on('click', this._finishShape, this);
        }

        // Remove the old marker click handler (as only the last point should close the polyline)
        if (markerCount > 2) {
            this._markers[markerCount - 2].off('click', this._finishShape, this);
        }
    },

    _createMarker: function (latlng) {
        var marker = new L.Marker(latlng, {
            icon: this.options.icon,
            zIndexOffset: this.options.zIndexOffset * 2
        });

        this._markerGroup.addLayer(marker);

        return marker;
    },

    _updateGuide: function (newPos) {
        var markerCount = this._markers.length;


        if (markerCount > 0) {
            newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);

            // draw the guide line
            this._clearGuides();
            this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
        }
    },

    _updateTooltip: function (latLng) {
        var text = this._getTooltipText();

        if (latLng) {
            this._tooltip.updatePosition(latLng);
        }

        if (!this._errorShown) {
            this._tooltip.updateContent(text);
        }
    },

    _drawGuide: function (pointA, pointB) {
        var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
			guidelineDistance = this.options.guidelineDistance,
			maxGuideLineLength = this.options.maxGuideLineLength,
        // Only draw a guideline with a max length
			i = length > maxGuideLineLength ? length - maxGuideLineLength : guidelineDistance,
			fraction,
			dashPoint,
			dash;

        //create the guides container if we haven't yet
        if (!this._guidesContainer) {
            this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._overlayPane);
        }

        //draw a dash every GuildeLineDistance
        for (; i < length; i += this.options.guidelineDistance) {
            //work out fraction along line we are
            fraction = i / length;

            //calculate new x,y point
            dashPoint = {
                x: Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
                y: Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
            };

            //add guide dash to guide container
            dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
            dash.style.backgroundColor =
				!this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;

            L.DomUtil.setPosition(dash, dashPoint);
        }
    },

    _updateGuideColor: function (color) {
        if (this._guidesContainer) {
            for (var i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
                this._guidesContainer.childNodes[i].style.backgroundColor = color;
            }
        }
    },

    // removes all child elements (guide dashes) from the guides container
    _clearGuides: function () {
        if (this._guidesContainer) {
            while (this._guidesContainer.firstChild) {
                this._guidesContainer.removeChild(this._guidesContainer.firstChild);
            }
        }
    },

    _getTooltipText: function () {
        var showLength = this.options.showLength,
			labelText, distanceStr;

        if (this._markers.length === 0) {
            labelText = {
                text: F.Map.MeasureStart
            };
        } else {


            distanceStr = showLength ? this._getMeasurementString(true) : '';

            if (this._markers.length === 1) {
                labelText = {
                    text: F.Map.MeasureCon,
                    subtext: distanceStr
                };
            } else {
                labelText = {
                    text: F.Map.MeasureEnd,
                    subtext: distanceStr
                };
            }
        }
        return labelText;
    },

    _updateRunningMeasure: function (latlng, added) {
        var markersLength = this._markers.length,
			previousMarkerIndex, distance;

        if (this._markers.length === 1) {
            this._measurementRunningTotal = 0;
        } else {
            previousMarkerIndex = markersLength - (added ? 2 : 1);
            distance = latlng.distanceTo(this._markers[previousMarkerIndex].getLatLng());

            this._measurementRunningTotal += distance * (added ? 1 : -1);
        }
    },

    _getMeasurementString: function (showAngle) {
        var currentLatLng = this._currentLatLng,
			previousLatLng = this._markers[this._markers.length - 1].getLatLng(),
			distance, angle;


        // calculate the distance from the last fixed point to the mouse position
        distance = this._measurementRunningTotal + currentLatLng.distanceTo(previousLatLng);
        var result = L.GeometryUtil.readableDistance(distance, this.options.metric);
        if (showAngle) {

            if (currentLatLng.lat == previousLatLng.lat && currentLatLng.lng == previousLatLng.lng) {

                for (var i = this._markers.length - 2; i >= 0; i--) {
                    previousLatLng = this._markers[i].getLatLng();
                    if (currentLatLng.lat != previousLatLng.lat || currentLatLng.lng != previousLatLng.lng) {
                        break;
                    }
                }

            }
            if (currentLatLng.lat != previousLatLng.lat || currentLatLng.lng != previousLatLng.lng) {
                angle = L.GeometryUtil.readAngle(previousLatLng, currentLatLng);
                result += "(" + angle.toFixed(2) + ")";
            }

            result = F.Map.Total+":" + result;

        }
        return result;
    },

    _showErrorTooltip: function () {
        this._errorShown = true;

        // Update tooltip
        this._tooltip
			.showAsError()
			.updateContent({ text: this.options.drawError.message });

        // Update shape
        this._updateGuideColor(this.options.drawError.color);
        this._poly.setStyle({ color: this.options.drawError.color });

        // Hide the error after 2 seconds
        this._clearHideErrorTimeout();
        this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
    },

    _hideErrorTooltip: function () {
        this._errorShown = false;

        this._clearHideErrorTimeout();

        // Revert tooltip
        this._tooltip
			.removeError()
			.updateContent(this._getTooltipText());

        // Revert shape
        this._updateGuideColor(this.options.shapeOptions.color);
        this._poly.setStyle({ color: this.options.shapeOptions.color });
    },

    _clearHideErrorTimeout: function () {
        if (this._hideErrorTimeout) {
            clearTimeout(this._hideErrorTimeout);
            this._hideErrorTimeout = null;
        }
    },

    _cleanUpShape: function () {
        if (this._markers.length > 1) {
            this._markers[this._markers.length - 1].off('click', this._finishShape, this);
        }
    },

    _fireCreatedEvent: function () {
        var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions);
        L.Draw.Measure.prototype._fireCreatedEvent.call(this, poly);
    }
});


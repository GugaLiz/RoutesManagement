
/*
Generic  Canvas Overlay for leaflet, 
Stanislav Sumbera, April , 2014

- added userDrawFunc that is called when Canvas need to be redrawn
- added few useful params fro userDrawFunc callback
- fixed resize map bug
inspired & portions taken from  :   https://github.com/Leaflet/Leaflet.heat
  

*/

L.CanvasOverlayGL = L.Layer.extend({
    //_layers: [],
    _resort: function () {
        this._layers.sort(function (a, b) {
            return a.zIndex > b.zIndex;
        });
    },
    addLayer: function (layer) {
        if (typeof (layer.isVisible) == "undefined") {
            layer.isVisible = true;
        }
        if (typeof (layer.zIndex) == "undefined") {
            layer.zIndex = 0;
        }
        layer.owner = this;
        layer.refresh = function () {
            this.owner.refresh(this);
        }
        layer._verts = [];
        layer._renderCount = 0;
        this._layers.push(layer);
        this._resort();
        if (layer.data.length > 0) {
            this.refresh();
        }
        return this;
    },

    DefaultPointSize: {
        4: 4,
        5: 4,
        6: 4,
        7: 4,
        8: 4,
        9: 4,
        10: 6,
        11: 6,
        12: 10,
        13: 10,
        14: 10,
        15: 12,
        16: 14,
        17: 14,
        18: 28 
    },

    getLayerData: function (cmp, layer, usingGL) {
        var me = this;
        var toPixel = me.LatLongToPixelXY;
        var map = cmp._map;
        var zoom = map.getZoom();
        var pointSize = 4;
        var onmars = map._baseLayer.options.mars;
        var layers = me._layers;
        var verts = [];
        var count = 0;
        if (usingGL) {
            if (layer) {
                var data = layer.data;
                layer._renderCount = 0;
                for (var j = 0, jLen = data.length; j < jLen; j++) {
                    var p = data[j];
                    p._pixel = toPixel(p.lat, p.lng, p);
                }
            }
        } else {
            if (zoom in me.DefaultPointSize) {
                pointSize = me.DefaultPointSize[zoom];
            }
            toPixel = function (x, y, p) {
                if (onmars) {
                    if (!p._xy) {
                        p._xy = L.EvilTransform.transform(x, y);
                    }
                    x = p._xy[0];
                    y = p._xy[1];
                }
                return map.latLngToContainerPoint([x, y]);
            };
        }
        var count = 0;
        for (var i = 0, len = layers.length; i < len; i++) {
            var temLayer = layers[i], data = temLayer.data;
            if (!temLayer.isVisible) {
                continue;
            }
            var points = temLayer.data;
            //verts = verts.concat(temLayer._verts);
            //count += temLayer._renderCount;
            //var temVerts = temLayer._verts;
            for (var j = 0, jLen = points.length; j < jLen; j++) {
                var p = points[j];
                if (p.isVisible) {
                    if (usingGL && p._pixel) {
                        verts.push(p._pixel.x, p._pixel.y,
                            p.size,
                            p.color[0], p.color[1], p.color[2], p.color[3]);
                    } else {
                        var xy = toPixel(p.lat, p.lng, p);
                        //console.info(xy);
                        if (!p._color) {
                            var r = parseInt(p.color[0] * 255);
                            var g = parseInt(p.color[1] * 255);
                            var b = parseInt(p.color[2] * 255);
                            p._color = 'rgb(' + r + ',' + g + ',' + b + ')';
                        }
                        verts.push({
                            x: xy.x,
                            y: xy.y,
                            color: p._color,
                            size: pointSize,
                            alpha: p.color[3]
                        });
                    }
                    count++;
                }
            }
        }
        return { data: verts, total: count };
    },
    removeLayer: function (layer) {
        for (var i = 0, len = this._layers.length; i < len; i++) {
            if (layer === this._layers[i]) {
                this._layers.splice(i, 1);
                this.refresh();
                return layer;
            }
        }
    },
    clearLayers: function () {
        this._layers = [];
        this.refresh();
    },
    refresh: function (layer) {
        var me = this;
        var usingGL = me._usingGL;
        if (!usingGL) {
            me._clear();
        }
        var d = me.getLayerData(me, layer, usingGL);
        if (usingGL) {
            me.loadData(d.data, d.total);
        } else {
            var ctx = me._canvas.getContext('2d');
            //console.info(d.data, d.total);
            me.redrawCanvas(ctx, d);
        }
    },

    _clear: function () {
        var me = this;
        if (!me._usingGL) {
            var ctx = me._canvas.getContext('2d');
            ctx.clearRect(0, 0, me._canvas.width, me._canvas.height);
        }
    },
    isSupportGL: function () {
        var isIE = navigator.userAgent.indexOf("MSIE") >= 0;
        if (isIE && navigator.appVersion.match(/6./i) == "6.") {
            return false;
        }
        else if (isIE && navigator.appVersion.match(/7./i) == "7.") {
            return false;
        }
        else if (isIE && navigator.appVersion.match(/8./i) == "8.") {
            return false;
        }
        else if (isIE && navigator.appVersion.match(/9./i) == "9.") {
            return false;
        } else if (isIE && navigator.appVersion.match(/10./i) == "10.") {
            return false;
        }
        return true;
    },

    initialize: function (userDrawFunc, options) {
        this._userDrawFunc = userDrawFunc;
        L.setOptions(this, options);
        this._offset = { x: 0, y: 0 };
    },

    drawing: function (userDrawFunc) {
        this._userDrawFunc = userDrawFunc;
        return this;
    },

    params: function (options) {
        L.setOptions(this, options);
        return this;
    },

    canvas: function () {
        return this._canvas;
    },

    redrawCanvas: function (ctx, data) {
        var me = this;
        var map = this._map;
        var dd = data.data;
        var total = data.total;

        //var size = 8;
        for (var i = 0; i < total; i++) {
            var d = dd[i];
            var c = d.color;
            var size = d.size;
            ctx.fillStyle = c;
            ctx.fillRect(d.x, d.y, size, size);
        }
    },

    redraw: function () {
        if (!this._frame) {
            this._frame = L.Util.requestAnimFrame(this._redraw, this);
        }
        return this;
    },
    onAdd: function (map) {
        var me = this;
        this._map = map;
        this._layers = [];
        var supportGL = this.isSupportGL();
        if (!supportGL) {
            //IE11以下不支持WEBGL，使用IEWEBGL插件(object对象css需要设置为绝对定位，才能跟地图对应上)
            this._canvas = L.DomUtil.create('object', 'leaflet-heatmap-layer');
            this._canvas.style.position = "absolute";
        } else {
            this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');
            this._canvas.style.position = "absolute";
            this._canvas.style.zindex = 1;
        }
        
        var size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));


        map._panes.overlayPane.appendChild(this._canvas);
        //map._panes.overlayPane.appendChild(this.getTemCanvas());

        if (!supportGL) {
            //插件对要先添加document对象里，然后设置type类型，才能正确加载IEWEBGL，GL类不能完全加载如：float32array
            this._canvas.onreadystatechange = function () {

            };
            this._canvas.type = "application/x-webgl";
        }

        map.on("click", this._mapClick, this);
        map.on('moveend', this._reset, this);
        map.on('resize', this._resize, this);

        if (map.options.zoomAnimation && L.Browser.any3d) {
            map.on('zoomanim', this._animateZoom, this);
        }

        me._usingGL = supportGL;
        me._reset();
        me.drawing(me.drawingOnCanvas);
        me.setWebGL(); //_usingGL again in function
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._canvas);

        map.off('moveend', this._reset, this);
        map.off('resize', this._resize, this);
        map.off("click", this._mapClick, this);

        if (map.options.zoomAnimation) {
            map.off('zoomanim', this._animateZoom, this);
        }
        this._canvas = null;

    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    _resize: function (resizeEvent) {
        this._canvas.width = resizeEvent.newSize.x;
        this._canvas.height = resizeEvent.newSize.y;
        if (this._gl) {
            this._gl.viewport(0, 0, this._canvas.width, this._canvas.height);
        }
    },
    _reset: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        //L.DomUtil.setPosition(this.getTemCanvas(), topLeft);

        this._redraw();
    },

    _redraw: function () {
        var me = this;
        var size = this._map.getSize();
        var bounds = this._map.getBounds();
        var zoomScale = (size.x * 180) / (20037508.34 * (bounds.getEast() - bounds.getWest())); // resolution = 1/zoomScale
        var zoom = this._map.getZoom();

        // console.time('process');

        if (this._userDrawFunc) {
            this._userDrawFunc(this,
                                {
                                    canvas: this._canvas,
                                    bounds: bounds,
                                    size: size,
                                    zoomScale: zoomScale,
                                    zoom: zoom,
                                    options: this.options
                                });
        }


        // console.timeEnd('process');
        if (!me._usingGL) {
            me.refresh();
        }
        this._frame = null;
    },

    _animateZoom: function (e) {
        var bounds = this._map.getBounds();
        var scale = this._map.getZoomScale(e.zoom),
		    offset = this._map._latLngToNewLayerPoint(bounds.getNorthWest(), e.zoom, e.center);

        L.DomUtil.setTransform(this._canvas, offset, scale);

    },
    offsetFn: function (lat, lng) {
        return L.latLng(lat, lng);
    },
    setWebGL: function () {
        var me = this;
        var gl = this._canvas.getContext('experimental-webgl', { antialias: true });
        if (!gl) {
            me._usingGL = false;
            return;
        }

        me._gl = gl;

        this._pixelsToWebGLMatrix = new Float32Array(16);
        this._mapMatrix = new Float32Array(16);

        // -- WebGl setup
        if (!gl) return;
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        if (!document.getElementById('vshader')) return;
        gl.shaderSource(vertexShader, document.getElementById('vshader').text);
        gl.compileShader(vertexShader);

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (!document.getElementById('fshader')) return;
        gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
        gl.compileShader(fragmentShader);

        // link shaders to create our program
        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
        gl.enable(gl.BLEND);
        //gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.blendEquation(gl.FUNC_ADD); //相加
        //gl.blendFunc(gl.SRC_COLOR, gl.DST_COLOR);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        //gl.enable(gl.POINT_SMOOTH);
        //  gl.disable(gl.DEPTH_TEST);
        // ----------------------------
        // look up the locations for the inputs to our shaders.
        this._u_matLoc = gl.getUniformLocation(program, "u_matrix");
        this._colorLoc = gl.getAttribLocation(program, "a_color");
        this._vertLoc = gl.getAttribLocation(program, "a_vertex");
        gl.aPointSize = gl.getAttribLocation(program, "a_pointSize");
        // Set the matrix to some that makes 1 unit 1 pixel.

        this._pixelsToWebGLMatrix.set([2 / this._canvas.width, 0, 0, 0, 0, -2 / this._canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
        gl.viewport(0, 0, this._canvas.width, this._canvas.height);

        gl.uniformMatrix4fv(this._u_matLoc, false, this._pixelsToWebGLMatrix);
    },
    loadData: function (data, total) {
        var me = this;
        var gl = me._gl;
        var usingGL = me._usingGL;
        var verts = data;


        this._numPoints = total;
        if (usingGL) {
            if (!this._buffer) {
                var vertBuffer = gl.createBuffer();
                this._buffer = vertBuffer;
                gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
                gl.enableVertexAttribArray(this._vertLoc);
                gl.enableVertexAttribArray(this._colorLoc);
            }

            //this._buffer = vertBuffer;
            //var vertArray = new Float32Array(verts);
            var vertArray = new Float32Array(verts);

            var fsize = vertArray.BYTES_PER_ELEMENT;


            gl.bufferData(gl.ARRAY_BUFFER, vertArray, gl.STATIC_DRAW);
            //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(BuildBoxNormals()), gl.STATIC_DRAW); 
            gl.vertexAttribPointer(this._vertLoc, 3, gl.FLOAT, false, fsize * 7, 0);

            // -- offset for color buffer
            gl.vertexAttribPointer(this._colorLoc, 4, gl.FLOAT, false, fsize * 7, fsize * 3);

        }

        this.redraw();
    },
    drawingOnCanvas: function () {
        if (this._gl == null) return;
        var gl = this._gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        this._pixelsToWebGLMatrix.set([2 / this._canvas.width, 0, 0, 0, 0, -2 / this._canvas.height, 0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
        //gl.viewport(0, 0, this._canvas.width, this._canvas.height);


        //debugger;
        var pointSize = 78271.5170 / Math.pow(2, this._map.getZoom() - 1);
        gl.vertexAttrib1f(gl.aPointSize, pointSize);

        // -- set base matrix to translate canvas pixel coordinates -> webgl coordinates
        this._mapMatrix.set(this._pixelsToWebGLMatrix);
        //debugger;
        var bounds = this._map.getBounds();
        var topLeft = new L.LatLng(bounds.getNorth(), bounds.getWest());

        var newLatlng = this.offsetFn(topLeft.lat, topLeft.lng);
        //var differ = L.EvilTransform.transformDiff(topLeft.lat, topLeft.lng, 0, 0);
        //var offset = this.LatLongToPixelXY(topLeft.lat - differ[0], topLeft.lng - differ[1]);

        var offset = this.LatLongToPixelXY(topLeft.lat - newLatlng.lat + topLeft.lat, topLeft.lng - newLatlng.lng + topLeft.lng);

        this._offset.x = offset.x;
        this._offset.y = offset.y
        this._offset.topLeft = topLeft;
        //var offset = this.LatLongToPixelXY(topLeft.lat, topLeft.lng);

        // -- Scale to current zoom
        var scale = Math.pow(2, this._map.getZoom());
        this.scaleMatrix(this._mapMatrix, scale, scale);

        this.translateMatrix(this._mapMatrix, -offset.x, -offset.y);

        // -- attach matrix value to 'mapMatrix' uniform in shader
        gl.uniformMatrix4fv(this._u_matLoc, false, this._mapMatrix);
        //debugger;
        gl.drawArrays(gl.POINTS, 0, this._numPoints);
    },
    LatLongToPixelXY: function (latitude, longitude) {
        var pi_180 = Math.PI / 180.0;
        var pi_4 = Math.PI * 4;
        var sinLatitude = Math.sin(latitude * pi_180);
        var pixelY = (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (pi_4)) * 256;
        var pixelX = ((longitude + 180) / 360) * 256;

        var pixel = { x: pixelX, y: pixelY };

        return pixel;
    },
    translateMatrix: function (matrix, tx, ty) {
        // translation is in last column of matrix
        matrix[12] += matrix[0] * tx + matrix[4] * ty;
        matrix[13] += matrix[1] * tx + matrix[5] * ty;
        matrix[14] += matrix[2] * tx + matrix[6] * ty;
        matrix[15] += matrix[3] * tx + matrix[7] * ty;
    },
    scaleMatrix: function (matrix, scaleX, scaleY) {
        // scaling x and y, which is just scaling first two columns of matrix
        matrix[0] *= scaleX;
        matrix[1] *= scaleX;
        matrix[2] *= scaleX;
        matrix[3] *= scaleX;

        matrix[4] *= scaleY;
        matrix[5] *= scaleY;
        matrix[6] *= scaleY;
        matrix[7] *= scaleY;
    },
    _mapClick: function (e) {
        var ex = 0.0009;
        var bounds = this._map.getBounds(), ne = bounds.getNorthEast(), sw = bounds.getSouthWest();
        var exBounds = L.latLngBounds([[ne.lat + ex, ne.lng + ex], [sw.lat - ex, sw.lng - ex]]);
        var topLeft = this._offset.topLeft;
        if (!topLeft) {
            return;
        }
        var newLatlng = this.offsetFn(topLeft.lat, topLeft.lng);
        var oldTopLeftP = this.LatLongToPixelXY(topLeft.lat, topLeft.lng);
        var newTopLeftP = this.LatLongToPixelXY(newLatlng.lat, newLatlng.lng);
        var offsetX = newLatlng.lng - topLeft.lng, offsetY = newLatlng.lat - topLeft.lat;


        var mouserLatlng = e.latlng;
        var mouseP = this._map.latLngToContainerPoint(mouserLatlng).round();
        var temCan = this.getTemCanvas();
        var temCtx = temCan.getContext("2d");

        var len = this._layers.length;
        for (var i = len - 1; i >= 0; i--) {
            var temLayer = this._layers[i];
            var listeners = temLayer.listeners || {};
            if (!temLayer || !temLayer.isVisible || !listeners.click) {
                continue;
            }
            var pointSize = 78271.5170 / Math.pow(2, this._map.getZoom() - 1);
            temCtx.clearRect(0, 0, temCan.width, temCan.height);
            var points = temLayer.data, jLen = points.length;
            for (var jLen = points.length, j = jLen - 1; j >= 0; j--) {
                var p = points[j];
                if (!p.isVisible || !p._pixel || !p.item) {
                    continue;
                }
                var latlng = [p.lat + offsetY, p.lng + offsetX];
                if (exBounds.contains(latlng)) {
                    if (latlng.lng - ex > mouserLatlng.lng || latlng.lng + ex < mouserLatlng.lng
                        || latlng.lat - ex > mouserLatlng.lat || latlng + ex < mouserLatlng.lat) {
                        continue;
                    }

                    var size = p.size;
                    if (size < 0) {
                        size = -size / pointSize;
                        if (size < 7.0) {
                            size = 7.0;
                        }
                    }

                    var pixel = this._map.latLngToContainerPoint(latlng).round();
                    //
                    //

                    if (pixel.x - size <= mouseP.x && pixel.x + size >= mouseP.x && pixel.y - size <= mouseP.y && pixel.y + size >= mouseP.y) {
                        size = size / 2;
                        temCtx.circle(pixel.x, pixel.y, size, 'rgb(0,156,0)');
                        //temCtx.circle(mouseP.x, mouseP.y, size, 'rgb(156,0,0)');
                        if (temCtx.hasPixel(mouseP.x, mouseP.y)) {
                            listeners.click(p);

                            return;
                        }

                    }
                }
            }
        }
    },
    getTemCanvas: function () {
        var me = this;
        if (!this._temCans) {
            this._temCans = document.createElement("canvas");
        }
        this._temCans.height = this._canvas.height;
        this._temCans.width = this._canvas.width;
        return this._temCans;
    }
});

L.canvasOverlayGL = function (userDrawFunc, options) {
    return new L.CanvasOverlayGL(userDrawFunc, options);
};


function Texture(img,gl) {
    var self = this;
    this.gl = gl;
    this.tex = gl.createTexture();
    this.image = new Image();
    this.image.onload = function () {
        self.handleLoadedTexture();
    }
    if (img != null) {
        this.setImage(img);
    }

};

Texture.prototype.setImage = function (file) {
    this.image.src = file;
};

Texture.prototype.handleLoadedTexture = function () {
    var gl = this.gl;
    console.info('loading image ' + this.image.src);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

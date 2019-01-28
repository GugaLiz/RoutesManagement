
/*
Generic  Canvas Overlay for leaflet, 
Stanislav Sumbera, April , 2014

- added userDrawFunc that is called when Canvas need to be redrawn
- added few useful params fro userDrawFunc callback
- fixed resize map bug
inspired & portions taken from  :   https://github.com/Leaflet/Leaflet.heat
  

*/

L.CanvasOverlayParam = L.Layer.extend({

    getLayerData: function (cmp, usingGL) {
        var me = this;
        var verts = [];
        var data = me._datas;
        var pointSize = me.pointSize;
        var alpha = me.alpha;
        var toRGB = me.toRGB;
        var toPixel = me.LatLongToPixelXY;
        if (!usingGL) {
            toRGB = function (v) { return v; };
            var map = cmp._map;
            toPixel = function (x, y) {
                return map.latLngToContainerPoint([x, y]);
            };
        }
        me._renderCount = 0;
        var count = 0;
        if (me.visible) {
            var transform = null;
            if (me.options && me.options.transform) {
                transform = me.options.transform;
            }
            for (var j = 0, jLen = data.length; j < jLen; j++) {
                var p = data[j];
                var gps = p.gps;
                if (transform) {
                    if (!p._gps) {
                        p._gps = transform(gps[0], gps[1]);
                    }
                    gps = p._gps;
                }
                var pixel = toPixel(gps[0], gps[1]);
                p._pixel = pixel;
                var color = p.color;
                if (!usingGL) {
                    //console.info(pixel, gps);
                    if (pixel.x < 0 || pixel.y < 0) continue;
                    color = p._color;
                    verts.push({
                        x: pixel.x,
                        y: pixel.y,
                        color: color,
                        alpha: alpha
                    });
                } else {
                    verts.push(pixel.x, pixel.y, pointSize,
                        color[0], color[1], color[2], alpha);
                }
                count++;
            }
        }
        return { data: verts, total: count };
    },

    refresh: function () {
        var me = this;
        var usingGL = me._usingGL;
        if (!usingGL) {
            me._clear();
        }
        var d = me.getLayerData(me, usingGL);
        if (usingGL) {
            me.loadData(d.data, d.total);
        } else {
            var ctx = me._canvas.getContext('2d');
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

    initialize: function (datas, userDrawFunc, options) {
        var me = this;
        me._userDrawFunc = userDrawFunc;
        me._datas = datas;
        me.visible = true;
        me.pointSize = 13;
        me.alpha = 1;
        L.setOptions(this, options);
        me._offset = { x: 0, y: 0 };
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

        var size = 8;
        //console.info(dd, total);
        for (var i = 0; i < total; i++) {
            var d = dd[i];
            var c = d.color;
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
        var zIndex = 1;
        if (this.options && typeof this.options.zIndex != 'undefined') {
            zIndex = this.options.zIndex;
        }
        if (!supportGL) {
            //IE11以下不支持WEBGL，使用IEWEBGL插件(object对象css需要设置为绝对定位，才能跟地图对应上)
            this._canvas = L.DomUtil.create('object', 'leaflet-heatmap-layer');
            this._canvas.style.position = "absolute";
        } else {
            this._canvas = L.DomUtil.create('canvas', 'leaflet-heatmap-layer');
            this._canvas.style.position = "absolute";
            this._canvas.style.zIndex = zIndex;
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

            }
            this._canvas.type = "application/x-webgl";
        }

        map.on('moveend', this._reset, this);
        map.on('resize', this._resize, this);

        if (map.options.zoomAnimation && L.Browser.any3d) {
            map.on('zoomanim', this._animateZoom, this);
        }

        me._usingGL = supportGL;
        me._reset();
        me.drawing(me.drawingOnCanvas);
        me.setWebGL(); //_usingGL again in function
        me.refresh();
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._canvas);

        map.off('moveend', this._reset, this);
        map.off('resize', this._resize, this);

        if (map.options.zoomAnimation) {
            map.off('zoomanim', this._animateZoom, this);
        }
        this_canvas = null;

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
        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, document.getElementById('vshader').text);
        gl.compileShader(vertexShader);

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, document.getElementById('fshader').text);
        gl.compileShader(fragmentShader);

        // link shaders to create our program
        var program = gl.createProgram();
        this._program = program;
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

        this._pixelsToWebGLMatrix.set([2 / this._canvas.width, 0, 0, 0, 0, -2 / this._canvas.height,
             0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
        gl.viewport(0, 0, this._canvas.width, this._canvas.height);

        gl.uniformMatrix4fv(this._u_matLoc, false, this._pixelsToWebGLMatrix);
    },
    loadData: function (data, total) {
        var gl = this._gl;
        var verts = data;
        var me = this;
        this._numPoints = total;
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

        //console.info(vertArray);

        this.redraw();
    },
    drawingOnCanvas: function () {
        if (this._gl == null) return;
        var gl = this._gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        this._pixelsToWebGLMatrix.set([2 / this._canvas.width, 0, 0, 0, 0, -2 / this._canvas.height,
         0, 0, 0, 0, 0, 0, -1, 1, 0, 1]);
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
    }
});

L.canvasOverlayParam = function (datas, options) {
    return new L.CanvasOverlayParam(datas, null, options);
};


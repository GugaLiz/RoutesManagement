var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
String.prototype.colorRgb = function () {
    var sColor = this.toLowerCase();
    if (sColor && reg.test(sColor)) {
        var i = 1;
        if (sColor.length === 4) {
            var sColorNew = "#";
            for (i = 1; i < 4; i += 1) {
                sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
            }
            sColor = sColorNew;
        }
        var sColorChange = [];
        for (i = 1; i < 7; i += 2) {
            sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
        }
        return sColorChange;
    } else {
        return [0, 0, 0];
    }
};

Ext.define("RM.Map.LFMapPanel", {
    extend: 'Ext.panel.Panel',
    alias: 'widget.lfmappanel',
    loadCSS: [
        '/leaflet/leafleat-extjs-legend.css',
        '/leaflet/leaflet.css',
        '/leaflet/plugs/leaflet-messagebox.css',
        '/leaflet/plugs/leaflet-panel-layers.min.css',
        '/leaflet/plugs/MarkerCluster.css',
        '/leaflet/plugs/MarkerCluster.Default.css',

        '/leaflet/plugs/Leaflet.ResizableControl.css',
        '/leaflet/plugs/leaflet.contextmenu.css'
    ],
    loadJS: [
        '/leaflet/canvas-extend.js',
        '/leaflet/leaflet.js',

        '/leaflet/plugs/baiduMapAPI-150-min.js',

        '/leaflet/plugs/L.CanvasOverlay.js',
        '/leaflet/plugs/leaflet-extend.js',
        

        '/leaflet/plugs/leaflet-eviltransform.js',
        '/leaflet/plugs/Leaflet.Editable.js',

        '/leaflet/plugs/leaflet-providers.js',
    ],

    rememberBaseMap: false, //记住最后选择的
    RememberBaseMapKEY: 'FLEET_BASE_MAP',
    rememberPos: false, //记住地图位置
    RememberPosKEY: 'FLEET_POS_MAP',
    autoLoadCell: false,
    height: 500,
    Zoom: 10,
    onlyBaseBar: false,
    showSiteLayer: false, //基站图层
    hideMapSetting: false,
    hideCellLoad: false, //不显示基站加载按钮
    hideMapLayerSelect: false, 
    cellRender: null,
    layers: null,
    initComponent: function () {
        var me = this;
        me.layers = new Ext.util.MixedCollection();
        me.MapOffline = 0;
        me.MapCenter = [30.3230173, 120.1414476];
        me.MapCenter = [22.99053168276751, 113.2633522107215];
        me.MapOfflineName = 'Offline Map';
        if (F && F.DefaultMapConfig) {
            var cfg = F.DefaultMapConfig;
            me.MapOffline = cfg.MapOffline;
            me.MapOfflineName = cfg.MapOfflineName;
            me.DefaultUseMapOffline = cfg.DefaultUseMapOffline;
            me.MapCenter = [cfg.MapCenterLat, cfg.MapCenterLng];
        }
        this.html = "<div class='lfmap' style='width:100%;height:100%;'></div>";
        if (me.onlyBaseBar) { //只有一个切换底图的
            this.tbar = this.getTbar(true);
        } else {
            this.tbar = this.getTbar(false);
        }
        Ext.applyIf(me);
        me.callParent(arguments);

        if (!L.Icon.Default.imagePath) {
             L.Icon.Default.imagePath = RM.Url('/leaflet/images');
        }

        //this.tools = this.getTools();
        this.on("afterlayout", function (pnl, layout, eopt) {
            if (!me.map) {
                var div = me.el.query("div[class=lfmap]");
                if (div.length > 0) {
                    me.initMap(div[0]);
                }
            }
        });
        this.on("resize", function (t, o, e, m, n, r) {
            if (me.map) {
                me.map.invalidateSize(true);
            }
        });

        this.on("destroy", function (cmp) {
            cmp.datas = null;
            cmp.points = null;
            cmp.json = null;
            cmp.map = null;
            cmp.glLayer = null;
        });
        this.evilTransform = new L.EvilTransform();

        if (F.EN) {
            this._loadScript("http://maps.google.cn/maps/api/js?sensor=false");
        }
    },
    contextmenu: true,
    enableWebGL: true,
    showScaleControl: true,
    initMap: function (div) {
        var me = this;
        var offsetType = this._baseLayer.options.offsetType;
        var gps = me.MapCenter;
        //console.info(F , F.DefaultMapConfig);
        var zoom = me.Zoom;
        if (me.rememberPos) {
            var str = me.getInLocal(me.RememberPosKEY);
            if (str) {
                var items = str.split(',');
                if (items.length == 3) {
                    gps = [items[1], items[2]];
                    zoom = parseInt(items[0]);
                }
            }
        }
        var leafletMap = L.map(div, {
            crs: offsetType === 2 ? L.CRS.BEPSG3857 : L.CRS.EPSG3857,
            layers: [this._baseLayer],
            attributionControl: false,
            editable: true,
            zoomControl: me.showScaleControl,
            contextmenu: me.contextmenu,
            contextmenuWidth: 190,
            contextmenuItems: [{
                text: 'F.Map.ZoomIn',
                icon: RM.Url("/Content/Images/map/Zoom_in.png"),
                callback: function (e) {
                    me.map.zoomIn();
                }
            }, {
                text: 'F.Map.ZoomOut',
                icon: RM.Url("/Content/Images/map/Zoom_out.png"),
                callback: function (e) {
                    me.map.zoomOut();
                }
            }/*, {
                text: 'Save Route',
                itemId: 'SaveItem',
                hide: true,
                iconCls: "save",
                callback: function (e) {
                    var tools = me.map.editTools;
                    var win = me._editRouteWin;
                    var latlngs = null;
                    if (tools.featuresLayer._layers) {
                        for (var x in tools.featuresLayer._layers) {
                            latlngs = tools.featuresLayer._layers[x]._latlngs;
                            break;
                        }
                    }
                    if (latlngs) {
                        console.info(latlngs);
                        if (!win) {
                            win = Ext.create('1Fleet.MapManage.route.EditWin');
                            me._editRouteWin = win;
                        }
                        win._latlngs = latlngs;
                        win.show();
                    }
                }
            }*/]
        }).setView(gps, zoom); //[22.57111, 113.44123], 13); //
        if (me.showScaleControl) {
            L.control.scale().addTo(leafletMap);
        }
        //alert(me.showScaleControl);
        this.map = leafletMap;
        this.map._baseLayer = this._baseLayer;

        var map = this.map;

        map.on('layeradd', function (e) {
            var layer = e.layer;
            if (layer.setOffset) {
                var fn = me.map.getOffsetFn();
                layer.setOffset(fn);
            }
        });
        map.showStatusInfo = function (text, fontColor) {
            me.getStatusPanel(text, fontColor);
        };
        map.removeStatusBox = function () {
            me.removeStatusBox();
        };
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        map.on('draw:created', function (e) {
            me._mesurePolyline = null;
        });
        map.on('editable:drawing:start', function (e, a, b, c) {

        });
        map.on('moveend', function (e) {
            var center = map.getCenter();
            var zoom = map.getZoom();
            var str = [zoom, center.lat, center.lng].join(',');
            if (me.rememberPos) {
                me.saveInLocal(me.RememberPosKEY, str);
            }
        });
        map.on('editable:drawing:end', function (e) {
            me.fireEvent("drawed", e);

            if (!me._onShapeClick) {
                me._onShapeClick = function (e) {
                    if (me.isClearStatus()) {
                        e.target.off("click", me._onShapeClick);
                        e.target.remove();
                    }
                };
            }
            if (e.layer instanceof L.Polygon) {
                e.layer.setStyle({
                    dashArray: "15, 10, 5, 10",
                    weight: 2
                });

            }
            e.layer.on("click", me._onShapeClick);

        });
        me.fireEvent("onMapInited", this, map);
    },
    onShapeClick: function (e, a) {
        e.target.remove();
    },
    getTools: function () {
        var me = this;
        var tools = [{
            type: "maximize",
            handler: function () {
                if (me.ownerCt) {
                    me.showBy(me.ownerCt, "tl", 0, true);
                }
            }
        }, {
            type: "minimize"
        }];
        return tools;
    },
    panTo: function(latlng, noMarker){
        var me = this;
        var gps = latlng;
        var map = me.map;
        if (gps) {
            if (gps.length == 2 //&&
                //RM.util.validLngLat(gps[1], gps[0])
                ) {
                map.panTo(gps);
                if (!noMarker) {
                    var mark = me._gpsMarker;
                    var content = gps.join(',');
                    if (!mark) {
                        mark = L.marker(gps);
                        mark.addTo(map).bindPopup(content).openPopup();
                        me._gpsMarker = mark;
                    } else {
                        mark.setPopupContent(content);
                        mark.setLatLng(gps);
                    }
                }
            }
        }
    },

    fitBounds: function (bbox, nomars) {
        var me = this;
        var map = me.map;
        if (!bbox) return;
        var transform = L.EvilTransform.transform;
        if (bbox.length == 2 &&
                RM.util.validLngLat(bbox[1], bbox[0])) {
            if (nomars) {
                map.panTo([bbox[0], bbox[1]]);
                return;
            }
            if (me.isOnMars()) {
                var gps0 = transform(bbox[1], bbox[0]);
                bbox = [gps0[1], gps0[0]];
            }
            map.panTo([bbox[1], bbox[0]]);
        } else if (bbox.length == 4 &&
                RM.util.validLngLat(bbox[0], bbox[1]) &&
                RM.util.validLngLat(bbox[2], bbox[3])) {
            if (nomars) {
                map.fitBounds(L.latLngBounds(
                    [bbox[1], bbox[0]], [bbox[3], bbox[2]]));
                return;
            }
            if (me.isOnMars()) {
                var gps1 = transform(bbox[1], bbox[0]);
                var gps2 = transform(bbox[3], bbox[2]);
                bbox = [gps1[1], gps1[0], gps2[1], gps2[0]];
            }
            var bound = L.latLngBounds([bbox[1], bbox[0]], [bbox[3], bbox[2]]);
            map.fitBounds(bound);
        }
    },

    renderByCdn: function (json) {
        var thls = json.Thresholds;
        for (var i = 0, len = thls.length; i < len; i++) {
            var thl = thls[i];
            var cdn = thl.Condition, color = thl.Color;
        }
    },
    showLegend: function (node) {
        var me = this;
        var tree = me.getTree();
        var root = tree.getRootNode();
        root.removeAll();
        if (!Ext.isEmpty(node)) {
            Ext.defer(function () {
                root.appendChild(node);
                root.expand();
            }, 300);
        }
    },
    getStatusPanel: function (text, fontColor) {
        var me = this;
        fontColor = fontColor || 'black';
        var html = Ext.String.format('<span style="color: {1}; font-size: 16px; ">{0}</span>', text, fontColor);
        if (!this.statusPanel) {
            this.statusPanel = Ext.create("Ext.panel.Panel", {
                autoScroll: true,
                autoWidth: true,
                bodyStyle: "background-color:transparent !important;border-top-width: 0!important;",
                maxWidth: 850,
                minWidth: 200,
                maxHeight: 600,
                cls: "statusbar",
                border: false,
                layout: 'fit',
                items: [{
                    xtype: 'container',
                    items: [{
                        xtype: 'label',
                        index: 'info',
                        html: html
                    }]
                }]
            });

            this.statusPanelBox = L.control.messagebox({ position: 'bottomright' });
            this.statusPanelBox.addTo(this.map);
            this.statusPanel.render(this.statusPanelBox.getEl());
        }
        else {
            this.statusPanel.down('[index=info]').setText(html, false);
        }
        return this.tree;
    },
    removeStatusBox: function(){
        if (this.statusPanelBox) {
            this.statusPanelBox.remove();
            this.statusPanel = null;
            this.statusPanelBox = null;
        }
    },
    createGLLayer: function () {
        var glLayer = L.canvasOverlayGL().addTo(this.map);
        return glLayer;
    },
    isOnMars: function () {
        var me = this;
        if (typeof me._baseLayer.options.mars != 'undefined') {
            return me._baseLayer.options.mars == 1;
        }
        return false;
    },
    getTbar: function (onlyBase) {
        var me = this;
        var lg = F.EN ? "en" : null;
        var maxZoom = me.maxZoom ? me.maxZoom : 18;
        var minZoom = 4;

        var gs = L.tileLayer.provider('Google.De', { 
            maxZoom: maxZoom, 
            minZoom: minZoom, 
            lg: lg,
            'crs': L.CRS.BEPSG3857, 
            offsetType: 1, 
            mars: 1
        });
        var ga = L.tileLayer.provider('Google.Satellite', { 
            maxZoom: maxZoom,
            minZoom: minZoom,
            lg: lg, 
            offsetType: 1
        });
        //gds = L.tileLayer.chinaProvider('GaoDe.Satellite.Map', { maxZoom: 18, minZoom: 1, lg: lg }),
        var gda = L.tileLayer.provider('GaoDe.Annotion', { 
                maxZoom: maxZoom, 
                minZoom: minZoom, 
                offsetType: 2 
            });
        var sosoGda = L.layerGroup([L.tileLayer.provider('SosoMap.Satellite', {
            maxZoom: maxZoom ? maxZoom : 18,
            minZoom: minZoom,
            offsetType: 1
        }), gda]);
        sosoGda.options = { offsetType: 1 };


        var sosoMap = L.tileLayer.provider('SosoMap.DE', {
            maxZoom: maxZoom,
            minZoom: minZoom,
            offsetType: 1,
            mars: 1
        });

        var click = function (btn) {
            if (me._baseLayer === btn.layer) {
                return;
            }
            if (me.rememberBaseMap) {
                me.saveInLocal(me.RememberBaseMapKEY, btn.text);
            }
            if (btn.layer === null) {
                if (me._baseLayer !== null) {
                    me._baseLayer.abortLoading();
                    me.map.removeLayer(me._baseLayer);
                }
                me._baseLayer = null;
                var items = me.down("#map").menu.items.items;
                for (var i = 0, len = items.length; i < len; i++) {
                    items[i].setIconCls("none");
                }
                btn.setIconCls("tick");
                return;
            }
            me.fireEvent("baselayer_change", btn.layer, me._baseLayer, btn.text);
            if (me.map) {
                var oldOffsetType = 0;
                if (me._baseLayer) {
                    oldOffsetType = me._baseLayer.options.offsetType;
                }
                var newOffsetType = btn.layer.options.offsetType;
                me.fireEvent("offset_change", oldOffsetType, newOffsetType);
                var center = me.map.getCenter();

                me.map.options.crs = newOffsetType === 2 ? L.CRS.BEPSG3857 : L.CRS.EPSG3857;
                if (!me.map.hasLayer(btn.layer)) {
                    if (me._baseLayer !== null) {
                        me._baseLayer.abortLoading();
                        me.map.removeLayer(me._baseLayer);
                    }
                    var items2 = me.down("#map").menu.items.items;
                    for (var i2 = 0, len2 = items2.length; i2 < len2; i2++) {
                        items2[i2].setIconCls("none");
                    }
                    btn.setIconCls("tick");
                    me.map._baseLayer = btn.layer;
                    me.map.addLayer(btn.layer);
                    if (btn.layer.bringToBack) {
                        btn.layer.bringToBack();
                    }

                    //偏移算法改变了
                    if (oldOffsetType !== newOffsetType) {
                        //求出未偏移前的经纬度
                        var offsetCenter = me.map.getOffsetFnByType(oldOffsetType)(center.lat, center.lng);
                        center.lat = 2 * center.lat - offsetCenter.lat;
                        center.lng = 2 * center.lng - offsetCenter.lng;
                        var fn = me.map.getOffsetFnByType(newOffsetType);
                        me.map.setOffsetFn(fn);
                        me.map.eachLayer(function (layer) {
                            if (layer.setOffset) {
                                layer.setOffset(fn);
                            }
                        });
                        var latlng = fn(center.lat, center.lng);
                        me.map.setView(latlng);
                        //me.map.invalidateSize(false);
                    }
                    me.map.getZoom();
                    var minZoom = btn.layer.options.minZoom;
                    if (!Ext.isEmpty(minZoom) && minZoom > me.map.getZoom()) {
                        me.map.setZoom(minZoom);
                    }

                }
            }
            var old = me._baseLayer;
            me._baseLayer = btn.layer;
            me.fireEvent("after_base_change", old, me._baseLayer, btn.text);
        };

        var baseLayers = [{
            text: "Google Street", //F.SH.GoogleStreet,
            layer: gs,
            iconCls: F.EN ? "tick" : "none"
        }, {
            text: "Google Satellite", //F.SH.GoogleSatellite,
            layer: ga
        }];
        if (!F.EN) {
            baseLayers.push({
                text: "SOSO Map",
                iconCls: F.EN ? "none" : "tick",
                layer: sosoMap
            }, {
                text: "SOSO Map Satellite",
                layer: L.tileLayer.provider('SosoMap.Satellite', {
                    maxZoom: maxZoom,
                    minZoom: minZoom,
                    offsetType: 1
                })
            }, {
                text: "SOSO Map Satellite With Road",
                layer: sosoGda
            });
        }

        baseLayers.push({
            text: "Open Street Map",
            layer: L.tileLayer.provider('OpenStreetMap.Mapnik', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        }, {
            text: "OpenStreetMap Black and White",
            layer: L.tileLayer.provider('OpenStreetMap.BlackAndWhite', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        }, {
            text: "Map Gray",
            layer: L.tileLayer.provider('MapBox.Gray', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        }, {
            text: "Map Dark",
            layer: L.tileLayer.provider('MapBox.Dark', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        }, {
            text: "Map Light",
            layer: L.tileLayer.provider('MapBox.Light', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        }, {
            text: "Map Emerald",
            layer: L.tileLayer.provider('MapBox.Emerald', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        }, {
            text: "Map Satellite",
            layer: L.tileLayer.provider('MapBox.Satellite', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        },
        {
            text: "Map Satellite Street",
            layer: L.tileLayer.provider('MapBox.SatelliteStreet', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        }, {
            text: "Map Streets Classic",
            layer: L.tileLayer.provider('MapBox.StreetsClassic', {
                maxZoom: maxZoom,
                minZoom: minZoom
            })
        });


        //默认地图设置
        var mapKey = F.EN ? 'Google Street' : 'SOSO Map';
        if (me.MapOffline > 0 && me.DefaultUseMapOffline) {
            mapKey = me.MapOfflineName;
        }
        if (me.rememberBaseMap) {
            var cKey = me.getInLocal(me.RememberBaseMapKEY);
            mapKey = cKey || mapKey;
        }
        if (me.getBaseLayer) {
            mapKey = null;
            me._baseLayer = me.getBaseLayer();
        }
        var got = false;
        for (var i = 0, len = baseLayers.length; i < len; i++) {
            var menuItem = baseLayers[i];
            if (menuItem.text == mapKey) {
                me._baseLayer = menuItem.layer;
                got = true;
            }
            if (!menuItem.handler) {
                menuItem.handler = click;
            }
            if (!menuItem.iconCls) {
                menuItem.iconCls = "none";
            }
        }
        if (!me._baseLayer) {
            mapKey = 'Google Street';
            got = true;
            me._baseLayer = gs;
        }
        if (got) {
            Ext.each(baseLayers, function (lyr) {
                if (lyr.text == mapKey) {
                    lyr.iconCls = 'tick';
                } else {
                    lyr.iconCls = "none";
                }
            });
        }

        if (onlyBase) {
            var tbar1 = ['->', {
                icon: RM.Url("/Content/images/map/Zoom_in.png"),
                tooltip: F.Map.ZoomIn,
                enableToggle: true,
                toggleGroup: "zoom",
                index: "zoomin",
                listeners: {
                    toggle: function (btn, pressed, e) {
                        me.map.editTools.stopDrawing();

                        if (pressed) {
                            me.setClearStateOff();
                            me.setZoomInStateOn();
                        } else {
                            me.setStateOff();
                        }
                    }
                }
            }, {
                icon: RM.Url("/Content/images/map/fullmap.png"),
                tooltip: F.Map.FullMap,
                handler: function () {
                    if (me.map) {
                        me.map.setZoom(me.map.getMinZoom());
                    }
                }
            }, '-', {
                iconCls: "map",
                tooltip: F.Map.BaseLayer,
                itemId: "map",
                menu: baseLayers
            }];
            return tbar1;
        }
        var tbar = [{
            itemId: 'dipNowDraw',
            hidden: true,
            xtype: 'displayfield',
            value: ''
        }, {
            text: '保存',
            iconCls: 'save',
            itemId: 'btnSaveDraw',
            hidden: true,
            handler: function (btn) {
                var tools = me.map.editTools;
                me.fireEvent("save_draw", me, tools);
            }
        }, "->", '-', {
            icon: RM.Url("/Content/images/map/ruler.png"),
            tooltip: "Measure",
            handler: function (btn) {
                me.setStateOff();
                me._mesurePolyline = new L.Draw.LineMeasure(me.map);
                me._mesurePolyline.enable();
            }
        }, '-', {
            icon: RM.Url("/Content/images/map/polyline.png"),
            tooltip: 'DrawPolyline',
            handler: function (btn) {
                me.setStateOff();
                me._beforeDraw();
                me.map.editTools.startPolyline();

            }
        }, {
            icon: RM.Url("/Content/images/map/polygon.png"),
            tooltip: 'DrawPolygon',
            handler: function (btn) {
                me.setStateOff();
                me._beforeDraw();
                me.map.editTools.startPolygon();
            }
        }, {
            icon: RM.Url("/Content/images/map/rectangle.png"),
            tooltip: 'DrawRect',
            handler: function (btn) {
                me.setStateOff();
                me._beforeDraw();
                me.map.editTools.startRectangle();
            }
        }, {
            icon: RM.Url("/Content/images/map/circle.png"),
            tooltip: 'DrawCircle',
            hidden: true,
            handler: function (btn) {
                me.setStateOff();
                me._beforeDraw();
                me.map.editTools.startCircle();
            }
        }, {
            icon: RM.Url("/Content/images/map/marker.png"),
            tooltip: 'DrawMarker',
            handler: function (btn) {
                me.setStateOff();
                me._beforeDraw();
                me.map.editTools.startMarker();
            }
        }, {
            icon: RM.Url("/Content/images/map/eraser.png"),
            tooltip: 'ClearShape',
            index: "clearShape",
            enableToggle: true,
            listeners: {
                toggle: function (btn, pressed, e) {
                    me.map.editTools.stopDrawing();
                    if (pressed) {
                        me.setZoomInStateOff();
                        me.setClearStateOn();
                    } else {
                        me.setStateOff();
                    }
                }
            }
        }, '-', {
            icon: RM.Url("/Content/images/map/Zoom_in.png"),
            tooltip: 'ZoomIn',
            enableToggle: true,
            toggleGroup: "zoom",
            index: "zoomin",
            listeners: {
                toggle: function (btn, pressed, e) {
                    me.map.editTools.stopDrawing();

                    if (pressed) {
                        me.setClearStateOff();
                        me.setZoomInStateOn();
                    } else {
                        me.setStateOff();
                    }
                }
            }
        }, '-', {
            iconCls: "map",
            hidden: true,
            tooltip: 'BaseLayer',
            itemId: "map",
            menu: baseLayers
        }];
        return tbar;
    },
    isClearStatus: function () {
        return this._isClear;
    },
    setClearStateOn: function () {
        if (this.map) {
            L.DomUtil.addClass(this.map.getContainer(), 'leaflet-clear-shape');
        }
        this._isClear = true;
    },
    setClearStateOff: function () {
        this.down("button[index=clearShape]").toggle(false);
        if (this.map) {
            L.DomUtil.removeClass(this.map.getContainer(), 'leaflet-clear-shape');
        }
        this._isClear = false;
    },
    setZoomInStateOn: function () {
        this.down("button[index=clearShape]").toggle(false);
        if (this.map) {
            this.map.dragging.disable();
            this.map.boxZoom.addHooks();
            this.map.on('mousedown', this.handleMouseDown, this);
            L.DomUtil.addClass(this.map.getContainer(), 'leaflet-zoom-box-crosshair');
            //this.map.on('boxzoomend', this.setStateOff, this);
        }
    },
    setZoomInStateOff: function () {
        this.down("button[index=zoomin]").toggle(false);
        if (this.map) {
            this.map.off('mousedown', this.handleMouseDown, this);
            L.DomUtil.removeClass(this.map.getContainer(), 'leaflet-zoom-box-crosshair');
            this.map.dragging.enable();
            this.map.boxZoom.removeHooks();
        }

    },
    setStateOff: function () {
        if (this._mesurePolyline) {
            this._mesurePolyline.dispose();
            this._mesurePolyline = null;
        }
        this.setZoomInStateOff();
        this.setClearStateOff();
    },
    handleMouseDown: function (event) {
        this.map.boxZoom._onMouseDown.call(this.map.boxZoom, { clientX: event.originalEvent.clientX, clientY: event.originalEvent.clientY, which: 1, shiftKey: true });
    },
    getOffsetFn: function () {
        return this.map.getOffsetFn();
    },
    getWebGL: function () {
        return this.map.getWebGL();
    },
    getLocationLayer: function () {
        if (!this._locationLayer) {
            this._locationLayer = L.layerGroup().addTo(this.map);
        }
        return this._locationLayer;
    },
    getCellRender: function () {
        if (!this._cellRender) {
            this._cellRender = Ext.create("Fleet5.MapManage.Render.CellRender", { leMapPanel: this });
            this._cellRender.addTo(this.map);
        }
        return this._cellRender;
    },
    setSiteLayerVisible: function (isVisible) {
        var me = this;
        var btn = this.down("menuitem[index=sitelayer]");
        me.showSiteLayer = isVisible;

        if (!me.cellRender) {
            me.cellRender = me.getCellRender();
            
        }
        me.cellRender.setVisible(isVisible);

        btn.setIconCls(isVisible ? "tick" : "none");
    },
    isRequestedAllSites: false,
    requestSites: function (callback) {
        var me = this;
        var btn = this.down("menuitem[index=sitelayer]");
        if (!me.showSiteLayer) {
            Ext.Msg.alert(F.C.Tip, F.Map.AddSiteLayerAlert);
            if (callback)
                callback();
            return;
        }

        if (!me.cellRender) {
            me.cellRender = me.getCellRender();
            me.cellRender.setVisible(true);
        }
        
        me.isRequestedAllSites = false;
        var cdn = me.getSiteCdn();
        if (cdn.netType.length === 0) {
            Ext.Msg.alert(F.C.Tip, F.Map.SelectNettypeAlert);
            if (callback)
                callback();
            return;
        }
        var params = {};
        if (cdn.loadType === 1) { //全部基站
            me.isRequestedAllSites = true;
            params = {
                City: '',
                NetTypes: cdn.netType
            };
            me.cellRender.loadData(params, false, callback);
        }
        else if (cdn.loadType === 0) { //中心点所在城市
            var fn = function(city){
                params = {
                    City: city,
                    NetTypes: cdn.netType
                };
                me.cellRender.loadData(params, false, callback);
            };
            var loc = me.map.getCenter();
            me.getNearestCity(loc, fn);
        }
        else {
            if (callback)
                callback();
            Ext.Msg.alert(F.C.Tip, F.Map.SelectSiteShowTypeAlert);
        } 
    },
    _beforeDraw: function () {
        if (this.map.editTools.drawing) {
            this.map.editTools.stopDrawing();
        }
        this.fireEvent("beforeDraw", this.map.editTools);
    },
    preGeoCoder: function (address, callback) {
        if (!Ext.isFunction(callback)) {
            return true;
        }
        if (Ext.isEmpty(address)) {
            return true;
        }
        try {
            var arraystr = address.split(",");
            if (arraystr.length == 2) {
                var lng = parseFloat(arraystr[0]);
                var lat = parseFloat(arraystr[1]);
                callback(L.latLng([lat, lng]));
                return true;
            }
        } catch (e) {
        }
        return false;
    },
    baiduGeocoder: function (address, callback) {
        if (this.preGeoCoder(address, callback)) {
            return;
        }

        Ext.data.JsonP.request({
            url: Ext.String.format("http://api.map.baidu.com/geocoder/v2/?address={0}&output=json&ak=PycpR8HX3Ref3ejHhihh3ea0Gf98uOKd", address),
            timeout: 300000,
            callbackKey: "callback",
            success: function (result) {
                if (result.status === 0) {
                    var loc = result.result.location;
                    var loc2 = L.EvilTransform.bd_decrypt(loc.lat, loc.lng);
                    callback(loc2, result);
                } else {
                    Ext.Msg.alert(F.C.Tip, result.msg);
                }
            },
            failure: function (result) {
                Ext.Msg.alert(F.C.Tip, result);
            }
        });
    },
    googleGeocoder: function (address, callback) {
        if (this.preGeoCoder(address, callback)) {
            return;
        }
        try {
            if (!this._googleGEocoder) {
                this._googleGEocoder = new google.maps.Geocoder();
            }
        } catch (e) {
            Ext.Msg.alert(F.C.Tip, "Google API not loaded.");
        }
        this._googleGEocoder.geocode({ 'address': address }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results.length > 0) {
                    var location = results[0].geometry.location;
                    var lat = location.lat(), lng = location.lng();
                    callback(L.EvilTransform.google_decrypt(lat, lng), results);
                }
            } else {
                Ext.Msg.alert(F.C.Tip, status);
            }
        });
    },
    getSiteCdn: function () {
        var cdn = { loadType: null, netType: [] };
        var me = this;
        var btnCitySite = me.down('[index=citySite]');
        if (btnCitySite.selected)
            cdn.loadType = 0;
        else {
            var btnAllSite = me.down('[index=allSite]');
            if (btnAllSite.selected)
                cdn.loadType = 1;
        }

        var btnLTE = me.down('[index=LTE]');
        var btnWCDMA = me.down('[index=WCDMA]');
        var btnCDMA = me.down('[index=CDMA]');
        var btnTD = me.down('[index=TD]');
        var btnGSM = me.down('[index=GSM]');

        if (btnLTE.selected)
            cdn.netType.push(Enum.NetworkType.LTE);
        if (btnWCDMA.selected)
            cdn.netType.push(Enum.NetworkType.WCDMA);
        if (btnCDMA.selected)
            cdn.netType.push(Enum.NetworkType.CDMA);
        if (btnTD.selected)
            cdn.netType.push(Enum.NetworkType.TDSCDMA);
        if (btnGSM.selected)
            cdn.netType.push(Enum.NetworkType.GSM);

        return cdn;
    },
    getGeoInfoByBaiduGeocoder: function (location, fn) {
        Ext.data.JsonP.request({
            url: Ext.String.format("http://api.map.baidu.com/geocoder/v2/?location={0},{1}&output=json&pois=0&ak=PycpR8HX3Ref3ejHhihh3ea0Gf98uOKd", location.lat, location.lng),
            timeout: 300000,
            callbackKey: "callback",
            success: function (result) {
                if (result.status === 0) {
                    fn(result.result.addressComponent.city);
                } else {
                    Ext.Msg.alert(F.C.Tip, result.msg);
                }
            },
            failure: function (result) {
                Ext.Msg.alert(F.C.Tip, result);
            }
        });
    },
    getNearestCity: function (location, fn) {
        Ext.Ajax.request({
            url: RM.Url('/CellInfo/GetNearestCity'),
            params: {
                Lat: location.lat,
                Lng: location.lng
            },
            success: function (response) {
                var result = Ext.JSON.decode(response.responseText);
                fn(result.data);
            },
            failure: function (result) {
                Ext.Msg.alert(F.C.Tip, result);
            }
        });
    },
    addLayer: function (type, layer) {
        var me = this;
        if (!me.layers.containsKey(type)) {
            me.layers.add(type, [layer]);
            return;
        }
        me.layers.get(type).push(layer);
    }
});


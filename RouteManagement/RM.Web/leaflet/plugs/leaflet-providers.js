(function () {
    'use strict';

    L.TileLayer.Provider = L.TileLayer.extend({
        initialize: function (arg, options) {
            var providers = L.TileLayer.Provider.providers;

            var parts = arg.split('.');

            var providerName = parts[0];
            var variantName = parts[1];

            if (!providers[providerName]) {
                throw 'No such provider (' + providerName + ')';
            }

            var provider = {
                url: providers[providerName].url,
                options: providers[providerName].options
            };

            // overwrite values in provider from variant.
            if (variantName && 'variants' in providers[providerName]) {
                if (!(variantName in providers[providerName].variants)) {
                    throw 'No such variant of ' + providerName + ' (' + variantName + ')';
                }
                var variant = providers[providerName].variants[variantName];
                var variantOptions;
                if (typeof variant === 'string') {
                    variantOptions = {
                        variant: variant
                    };
                } else {
                    variantOptions = variant.options;
                }
                provider = {
                    url: variant.url || provider.url,
                    options: L.Util.extend({}, provider.options, variantOptions)
                };
            } else if (typeof provider.url === 'function') {
                provider.url = provider.url(parts.splice(1, parts.length - 1).join('.'));
            }

            var forceHTTP = window.location.protocol === 'file:' || provider.options.forceHTTP;
            if (provider.url.indexOf('//') === 0 && forceHTTP) {
                provider.url = 'http:' + provider.url;
            }

            // replace attribution placeholders with their values from toplevel provider attribution,
            // recursively
            var attributionReplacer = function (attr) {
                if (attr.indexOf('{attribution.') === -1) {
                    return attr;
                }
                return attr.replace(/\{attribution.(\w*)\}/,
					function (match, attributionName) {
					    return attributionReplacer(providers[attributionName].options.attribution);
					}
				);
            };
            provider.options.attribution = attributionReplacer(provider.options.attribution);


            // Compute final options combining provider options with any user overrides
            var layerOpts = L.Util.extend({}, provider.options, options);
            if (!layerOpts.lg) {
                layerOpts.lg = "zh-CN";
            }
            L.TileLayer.prototype.initialize.call(this, provider.url, layerOpts);
        },
        getTileUrl: function (tilePoint) {

            var args = null;
            var getUrlArgs = this.options.getUrlArgs;

            if (getUrlArgs) {
                args = getUrlArgs(tilePoint, this);
            } else {
                args = {
                    s: this._getSubdomain(tilePoint),
                    z: tilePoint.z,
                    x: tilePoint.x,
                    y: tilePoint.y
                }
            }
            return L.Util.template(this._url, L.extend(args, this.options));
        }
    });

    /**
    * Definition of providers.
    * see http://leafletjs.com/reference.html#tilelayer for options in the options map.
    */

    L.TileLayer.Provider.providers = {
        SosoMap: {
            url: "http://rt{s}.map.gtimg.com/realtimerender?z={z}&x={x}&y={y}&type=vector&style=0&v=1.1.2", //'http://p{s}.map.gtimg.com/maptilesv3/{z}/{x16}/{y16}/{x}_{y}.png', //function (a, b, c, d, e, f, g) { debugger }, //"http://p{s}.map.soso.com/maptilesv2/{x}/{y}/{z}/1/1578_312.png?v=2015129",
            options: {
                maxZoom: 19,
                attribution: '',
                subdomains: '0123',
                getUrlArgs: function (tilePoint, provider) {
                    var y = parseInt(Math.pow(2, tilePoint.z)) - 1 - tilePoint.y;
                    var x16 = Math.floor(tilePoint.x / 16.0), y16 = Math.floor(y / 16.0);
                    var len = provider.options.subdomains.length;
                    var index = Math.abs(tilePoint.x + y) % provider.options.subdomains.length;
                    var s = provider.options.subdomains[index];
                    return {
                        s: s,
                        z: tilePoint.z,
                        x: tilePoint.x,
                        y: y,
                        x16: x16,
                        y16: y16
                    };
                }

            },
            variants: {
                DE: {
                    url: 'http://p{s}.map.gtimg.com/maptilesv3/{z}/{x16}/{y16}/{x}_{y}.png?version=20130701'
                },
                Satellite: {
                    url: 'http://p{s}.map.gtimg.com/sateTiles/{z}/{x16}/{y16}/{x}_{y}.jpg?version=20130701'
                }
            }
        },
        OpenStreetMap: {
            url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            options: {
                maxZoom: 19,
                attribution:
					'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            },
            variants: {
                Mapnik: {},
                BlackAndWhite: {
                    url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
                    options: {
                        maxZoom: 18
                    }
                },
                DE: {
                    url: 'http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
                    options: {
                        maxZoom: 18
                    }
                },
                France: {
                    url: 'http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
                    options: {
                        attribution: '&copy; Openstreetmap France | {attribution.OpenStreetMap}'
                    }
                },
                HOT: {
                    url: 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
                    options: {
                        attribution: '{attribution.OpenStreetMap}, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
                    }
                }
            }
        },
        OpenSeaMap: {
            url: 'http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
            options: {
                attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
            }
        },
        OpenTopoMap: {
            url: '//{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
            options: {
                maxZoom: 16,
                attribution: 'Map data: {attribution.OpenStreetMap}, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            }
        },
        Thunderforest: {
            url: '//{s}.tile.thunderforest.com/{variant}/{z}/{x}/{y}.png',
            options: {
                attribution:
					'&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, {attribution.OpenStreetMap}',
                variant: 'cycle'
            },
            variants: {
                OpenCycleMap: 'cycle',
                Transport: {
                    options: {
                        variant: 'transport',
                        maxZoom: 19
                    }
                },
                TransportDark: {
                    options: {
                        variant: 'transport-dark',
                        maxZoom: 19
                    }
                },
                Landscape: 'landscape',
                Outdoors: 'outdoors'
            }
        },
        OpenMapSurfer: {
            url: 'http://openmapsurfer.uni-hd.de/tiles/{variant}/x={x}&y={y}&z={z}',
            options: {
                maxZoom: 20,
                variant: 'roads',
                attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data {attribution.OpenStreetMap}'
            },
            variants: {
                Roads: 'roads',
                AdminBounds: {
                    options: {
                        variant: 'adminb',
                        maxZoom: 19
                    }
                },
                Grayscale: {
                    options: {
                        variant: 'roadsg',
                        maxZoom: 19
                    }
                }
            }
        },
        Hydda: {
            url: 'http://{s}.tile.openstreetmap.se/hydda/{variant}/{z}/{x}/{y}.png',
            options: {
                variant: 'full',
                attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data {attribution.OpenStreetMap}'
            },
            variants: {
                Full: 'full',
                Base: 'base',
                RoadsAndLabels: 'roads_and_labels'
            }
        },
        MapQuestOpen: {
            /* Mapquest does support https, but with a different subdomain:
            * https://otile{s}-s.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}
            * which makes implementing protocol relativity impossible.
            */
            url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.{ext}',
            options: {
                type: 'map',
                ext: 'jpg',
                attribution:
					'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
					'Map data {attribution.OpenStreetMap}',
                subdomains: '1234'
            },
            variants: {
                OSM: {},
                Aerial: {
                    options: {
                        type: 'sat',
                        attribution:
							'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
							'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
                    }
                },
                HybridOverlay: {
                    options: {
                        type: 'hyb',
                        ext: 'png',
                        opacity: 0.9
                    }
                }
            }
        },
        MapBox: {
            url: 'http://{s}.tiles.mapbox.com/v3/examples.map-zr0njcqy/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg', //pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q&update=igt3w//function (id) {
            //return '//{s}.tiles.mapbox.com/v3/' + id + '/{z}/{x}/{y}.png';
            //},
            options: {
                attribution:
					'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; ' +
					'Map data {attribution.OpenStreetMap}',
                subdomains: 'abcd'
            },
            variants: {
                De: {},
                Gray: {
                    url: "http://{s}.tiles.mapbox.com/v3/delimited.ge9h4ffl/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg",
                    options: {
                        maxZoom:18
                    }
                },
                Light: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.light/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Dark: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.dark/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Satellite: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },

                SatelliteStreet: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Wheatpaste: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.wheatpaste/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                StreetsClassic: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Comic: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.comic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Outdoors: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.outdoors/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                RBH: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.run-bike-hike/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Pencil: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.pencil/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Pirates: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.pirates/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                Emerald: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.emerald/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                },
                HighContrast: {
                    url: 'https://api.tiles.mapbox.com/v4/mapbox.high-contrast/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiempqcXljIiwiYSI6ImNpbmxjbzR6cDAwOG13ZGx5OW1mbjB2c2QifQ.xqeQX6TE7icVYXvdtNvvcg',
                    options: {
                        maxZoom: 18
                    }
                }
            }
        },
        Stamen: {
            url: '//stamen-tiles-{s}.a.ssl.fastly.net/{variant}/{z}/{x}/{y}.png',
            options: {
                attribution:
					'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
					'<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
					'Map data {attribution.OpenStreetMap}',
                subdomains: 'abcd',
                minZoom: 0,
                maxZoom: 20,
                variant: 'toner',
                ext: 'png'
            },
            variants: {
                Toner: 'toner',
                TonerBackground: 'toner-background',
                TonerHybrid: 'toner-hybrid',
                TonerLines: 'toner-lines',
                TonerLabels: 'toner-labels',
                TonerLite: 'toner-lite',
                Watercolor: {
                    options: {
                        variant: 'watercolor',
                        minZoom: 1,
                        maxZoom: 16
                    }
                },
                Terrain: {
                    options: {
                        variant: 'terrain',
                        minZoom: 4,
                        maxZoom: 18,
                        bounds: [[22, -132], [70, -56]]
                    }
                },
                TerrainBackground: {
                    options: {
                        variant: 'terrain-background',
                        minZoom: 4,
                        maxZoom: 18,
                        bounds: [[22, -132], [70, -56]]
                    }
                },
                TopOSMRelief: {
                    options: {
                        variant: 'toposm-color-relief',
                        ext: 'jpg',
                        bounds: [[22, -132], [51, -56]]
                    }
                },
                TopOSMFeatures: {
                    options: {
                        variant: 'toposm-features',
                        bounds: [[22, -132], [51, -56]],
                        opacity: 0.9
                    }
                }
            }
        },
        Esri: {
            url: '//server.arcgisonline.com/ArcGIS/rest/services/{variant}/MapServer/tile/{z}/{y}/{x}',
            options: {
                variant: 'World_Street_Map',
                attribution: 'Tiles &copy; Esri'
            },
            variants: {
                WorldStreetMap: {
                    options: {
                        attribution:
							'{attribution.Esri} &mdash; ' +
							'Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
                    }
                },
                DeLorme: {
                    options: {
                        variant: 'Specialty/DeLorme_World_Base_Map',
                        minZoom: 1,
                        maxZoom: 11,
                        attribution: '{attribution.Esri} &mdash; Copyright: &copy;2012 DeLorme'
                    }
                },
                WorldTopoMap: {
                    options: {
                        variant: 'World_Topo_Map',
                        attribution:
							'{attribution.Esri} &mdash; ' +
							'Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
                    }
                },
                WorldImagery: {
                    options: {
                        variant: 'World_Imagery',
                        attribution:
							'{attribution.Esri} &mdash; ' +
							'Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    }
                },
                WorldTerrain: {
                    options: {
                        variant: 'World_Terrain_Base',
                        maxZoom: 13,
                        attribution:
							'{attribution.Esri} &mdash; ' +
							'Source: USGS, Esri, TANA, DeLorme, and NPS'
                    }
                },
                WorldShadedRelief: {
                    options: {
                        variant: 'World_Shaded_Relief',
                        maxZoom: 13,
                        attribution: '{attribution.Esri} &mdash; Source: Esri'
                    }
                },
                WorldPhysical: {
                    options: {
                        variant: 'World_Physical_Map',
                        maxZoom: 8,
                        attribution: '{attribution.Esri} &mdash; Source: US National Park Service'
                    }
                },
                OceanBasemap: {
                    options: {
                        variant: 'Ocean_Basemap',
                        maxZoom: 13,
                        attribution: '{attribution.Esri} &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
                    }
                },
                NatGeoWorldMap: {
                    options: {
                        variant: 'NatGeo_World_Map',
                        maxZoom: 16,
                        attribution: '{attribution.Esri} &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
                    }
                },
                WorldGrayCanvas: {
                    options: {
                        variant: 'Canvas/World_Light_Gray_Base',
                        maxZoom: 16,
                        attribution: '{attribution.Esri} &mdash; Esri, DeLorme, NAVTEQ'
                    }
                }
            }
        },
        OpenWeatherMap: {
            url: 'http://{s}.tile.openweathermap.org/map/{variant}/{z}/{x}/{y}.png',
            options: {
                maxZoom: 19,
                attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
                opacity: 0.5
            },
            variants: {
                Clouds: 'clouds',
                CloudsClassic: 'clouds_cls',
                Precipitation: 'precipitation',
                PrecipitationClassic: 'precipitation_cls',
                Rain: 'rain',
                RainClassic: 'rain_cls',
                Pressure: 'pressure',
                PressureContour: 'pressure_cntr',
                Wind: 'wind',
                Temperature: 'temp',
                Snow: 'snow'
            }
        },
        HERE: {
            /*
            * HERE maps, formerly Nokia maps.
            * These basemaps are free, but you need an API key. Please sign up at
            * http://developer.here.com/getting-started
            *
            * Note that the base urls contain '.cit' whichs is HERE's
            * 'Customer Integration Testing' environment. Please remove for production
            * envirionments.
            */
            url:
				'//{s}.{base}.maps.cit.api.here.com/maptile/2.1/' +
				'maptile/{mapID}/{variant}/{z}/{x}/{y}/256/png8?' +
				'app_id={app_id}&app_code={app_code}',
            options: {
                attribution:
					'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
                subdomains: '1234',
                mapID: 'newest',
                'app_id': '<insert your app_id here>',
                'app_code': '<insert your app_code here>',
                base: 'base',
                variant: 'normal.day',
                maxZoom: 20
            },
            variants: {
                normalDay: 'normal.day',
                normalDayCustom: 'normal.day.custom',
                normalDayGrey: 'normal.day.grey',
                normalDayMobile: 'normal.day.mobile',
                normalDayGreyMobile: 'normal.day.grey.mobile',
                normalDayTransit: 'normal.day.transit',
                normalDayTransitMobile: 'normal.day.transit.mobile',
                normalNight: 'normal.night',
                normalNightMobile: 'normal.night.mobile',
                normalNightGrey: 'normal.night.grey',
                normalNightGreyMobile: 'normal.night.grey.mobile',

                carnavDayGrey: 'carnav.day.grey',
                hybridDay: {
                    options: {
                        base: 'aerial',
                        variant: 'hybrid.day'
                    }
                },
                hybridDayMobile: {
                    options: {
                        base: 'aerial',
                        variant: 'hybrid.day.mobile'
                    }
                },
                pedestrianDay: 'pedestrian.day',
                pedestrianNight: 'pedestrian.night',
                satelliteDay: {
                    options: {
                        base: 'aerial',
                        variant: 'satellite.day'
                    }
                },
                terrainDay: {
                    options: {
                        base: 'aerial',
                        variant: 'terrain.day'
                    }
                },
                terrainDayMobile: {
                    options: {
                        base: 'aerial',
                        variant: 'terrain.day.mobile'
                    }
                }
            }
        },
        Acetate: {
            url: 'http://a{s}.acetate.geoiq.com/tiles/{variant}/{z}/{x}/{y}.png',
            options: {
                attribution:
					'&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
                subdomains: '0123',
                minZoom: 2,
                maxZoom: 18,
                variant: 'acetate-base'
            },
            variants: {
                basemap: 'acetate-base',
                terrain: 'terrain',
                all: 'acetate-hillshading',
                foreground: 'acetate-fg',
                roads: 'acetate-roads',
                labels: 'acetate-labels',
                hillshading: 'hillshading'
            }
        },
        FreeMapSK: {
            url: 'http://{s}.freemap.sk/T/{z}/{x}/{y}.jpeg',
            options: {
                minZoom: 8,
                maxZoom: 16,
                subdomains: ['t1', 't2', 't3', 't4'],
                attribution:
					'{attribution.OpenStreetMap}, vizualization CC-By-SA 2.0 <a href="http://freemap.sk">Freemap.sk</a>'
            }
        },
        MtbMap: {
            url: 'http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png',
            options: {
                attribution:
					'{attribution.OpenStreetMap} &amp; USGS'
            }
        },
        CartoDB: {
            url: 'http://{s}.basemaps.cartocdn.com/{variant}/{z}/{x}/{y}.png',
            options: {
                attribution: '{attribution.OpenStreetMap} &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
                subdomains: 'abcd',
                maxZoom: 19,
                variant: 'light_all'
            },
            variants: {
                Positron: 'light_all',
                PositronNoLabels: 'light_nolabels',
                DarkMatter: 'dark_all',
                DarkMatterNoLabels: 'dark_nolabels'
            }
        },
        HikeBike: {
            url: 'http://{s}.tiles.wmflabs.org/{variant}/{z}/{x}/{y}.png',
            options: {
                maxZoom: 19,
                attribution: '{attribution.OpenStreetMap}',
                variant: 'hikebike'
            },
            variants: {
                HikeBike: {},
                HillShading: {
                    options: {
                        maxZoom: 15,
                        variant: 'hillshading'
                    }
                }
            }
        },
        BasemapAT: {
            url: '//maps{s}.wien.gv.at/basemap/{variant}/normal/google3857/{z}/{y}/{x}.{format}',
            options: {
                maxZoom: 19,
                attribution: 'Datenquelle: <a href="www.basemap.at">basemap.at</a>',
                subdomains: ['', '1', '2', '3', '4'],
                format: 'png',
                bounds: [[46.358770, 8.782379], [49.037872, 17.189532]],
                variant: 'geolandbasemap'
            },
            variants: {
                basemap: 'geolandbasemap',
                grau: 'bmapgrau',
                overlay: 'bmapoverlay',
                highdpi: {
                    options: {
                        variant: 'bmaphidpi',
                        format: 'jpeg'
                    }
                },
                orthofoto: {
                    options: {
                        variant: 'bmaporthofoto30cm',
                        format: 'jpeg'
                    }
                }
            }
        },
        NASAGIBS: {
            url: '//map1.vis.earthdata.nasa.gov/wmts-webmerc/{variant}/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
            options: {
                attribution:
					'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
					'(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
                bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
                minZoom: 1,
                maxZoom: 9,
                format: 'jpg',
                time: '',
                tilematrixset: 'GoogleMapsCompatible_Level'
            },
            variants: {
                ModisTerraTrueColorCR: 'MODIS_Terra_CorrectedReflectance_TrueColor',
                ModisTerraBands367CR: 'MODIS_Terra_CorrectedReflectance_Bands367',
                ViirsEarthAtNight2012: {
                    options: {
                        variant: 'VIIRS_CityLights_2012',
                        maxZoom: 8
                    }
                },
                ModisTerraLSTDay: {
                    options: {
                        variant: 'MODIS_Terra_Land_Surface_Temp_Day',
                        format: 'png',
                        maxZoom: 7,
                        opacity: 0.75
                    }
                },
                ModisTerraSnowCover: {
                    options: {
                        variant: 'MODIS_Terra_Snow_Cover',
                        format: 'png',
                        maxZoom: 8,
                        opacity: 0.75
                    }
                },
                ModisTerraAOD: {
                    options: {
                        variant: 'MODIS_Terra_Aerosol',
                        format: 'png',
                        maxZoom: 6,
                        opacity: 0.75
                    }
                },
                ModisTerraChlorophyll: {
                    options: {
                        variant: 'MODIS_Terra_Chlorophyll_A',
                        format: 'png',
                        maxZoom: 7,
                        opacity: 0.75
                    }
                }
            }
        },
        TianDiTu: {
            url: "http://t{s}.tianditu.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}",
            options: {
                maxZoom: 18,
                subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
                attribution: ""
            },
            variants: {
                De: {},
                Satellite: {
                    url: "http://t{s}.tianditu.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}"

                },
                Terrain: {
                    url: "http://t{s}.tianditu.cn/DataServer?T=ter_w&X={x}&Y={y}&L={z}"
                },
                Annotion: {
                    url: "http://t{s}.tianditu.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}"
                },
                Annotion_Satellite: {
                    url: "http://t{s}.tianditu.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}"
                },
                Annotion_Terrain: {
                    url: "http://t{s}.tianditu.cn/DataServer?T=cta_w&X={x}&Y={y}&L={z}"
                }
            }
        },
        MapABC: {
            url: 'http://emap{s}.mapabc.com/mapabc/maptile?&x={x}&y={y}&z={z}',
            options: {
                maxZoom: 18,
                subdomains: ["0", "1", "2", "3"],
                attribution: ""
            },
            variants: {
                De: {}
            }

        },
        GaoDe: {
            url: 'http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
            options: {
                maxZoom: 18,
                subdomains: ["1", "2", "3", "4"],
                attribution: ""
            },
            variants: {
                De: {},
                Satellite: {
                    url: 'http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
                    options: {
                        maxZoom: 18,
                        subdomains: ["1", "2", "3", "4"]
                    }
                },
                Annotion: {
                    url: 'http://webst0{s}.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
                }
            }
        },
        Google: {
            url: "http://mt{s}.google.cn/vt/lyrs=m@225000000&hl={lg}&gl=CN&src=app&x={x}&y={y}&z={z}&s=Ga", //"http://www.google.cn/maps/vt?lyrs=s@203&hl={lg}&gl=CN&x={x}&y={y}&z={z}", //"http://mt{s}.google.com/vt/lyrs=m@176000000&hl={lg}&gl=CN&src=app&x={x}&y={y}&z={z}&s=Ga",
            options: {
                maxZoom: 18,
                subdomains: ["0", "1", "2", "3"],
                attribution: ""
            },
            variants: {
                De: {},
                Satellite: {
                    url: "http://mt{s}.google.cn/vt/lyrs=s@161&hl={lg}&gl=CN&src=app&x={x}&y={y}&z={z}&s=G", //'http://www.google.com/maps/vt?lyrs=s@177&gl=cn&x={x}&y={y}&z={z}',
                    options: {
                        maxZoom: 18,
                        subdomains: ["0", "1", "2", "3"]
                    }
                }
            }
        }
    };

    L.tileLayer.provider = function (provider, options) {
        return new L.TileLayer.Provider(provider, options);
    };

} ());

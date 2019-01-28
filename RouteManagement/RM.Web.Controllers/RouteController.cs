using RM.Common.Util;
using RM.Domain;
using RM.ServiceImpl;
using RM.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Xml;
using System.Web.Mvc;
using Newtonsoft.Json;


namespace RM.Web.Controllers
{
    [HandleError]
    public class RouteController: ControllerBase
    {
        IRouteService routeSrv { set; get; }

        public RouteController(IRouteService routeSrv)
        {
            this.routeSrv = routeSrv;
        }

        #region 路径

        public ActionResult Index()
        {
            return View();
        }

        //DONE: 保存
        [HttpPost]
        public ActionResult SaveRoute(RouteSaveModel model)
        {          
            if (ModelState.IsValid)
            {
                var route = new Route();
                var file = Request.Files["File"];
                XmlDocument doc = new XmlDocument();
                doc.Load(XmlReader.Create(file.InputStream));
                route.OriginXml = doc.OuterXml;
                int routeType = 1; //高铁
                var lines = new List<string>();
                route.Geo = GetGeo(doc, file.FileName, 
                    ref lines,
                    ref routeType);
                route.Lines = string.Join("$_$_$", lines);
                route.GroupId = model.GroupId;
                route.RouteType = routeType;
                route.Name = model.Name;
                route.Memo = model.Memo;
                if (route.Id == 0)
                {
                    route.CreateTime = DateTime.UtcNow;
                    //route.CreateUserId = CurrentUser.Id;
                }
                else
                {
                    route.UpdateTime = DateTime.UtcNow;
                    //route.UpdateUserId = CurrentUser.Id;
                }
                routeSrv.SaveRoute(route);
                return Json(new
                {
                    success = true,
                    data = new
                    {
                        Id = route.Id,
                        RouteType = route.RouteType,
                    },
                });

            }
            else
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors);
            }
            return this.GetStateJson();
        }


        /// <summary>
        /// 从XML转换到GeoJson对象
        /// </summary>
        /// <param name="xml"></param>
        /// <returns></returns>
        string GetGeo(XmlDocument doc, string name, 
            ref List<string> lines,
            ref int routeType)
        {
            var feature = new Feature();
            if (doc != null)
            {
                var features = new List<Feature>();
                var cityName = "";
                var name1 = name.ToLower();
                if (name1.EndsWith(".kml"))
                {
                    routeType = 1; //高铁
                    #region 
                    var docNode = (XmlElement)doc.GetElementsByTagName("Document")[0];
                    var kmlname = docNode.GetElementsByTagName("name")[0];
                    var folderNode = (XmlElement)docNode.GetElementsByTagName("Folder")[0];
                    var placemarkNode = (XmlElement)doc.GetElementsByTagName("Placemark")[0];
                    var pnameNode = (XmlElement)placemarkNode.GetElementsByTagName("name")[0];
                    var pname = pnameNode.InnerText; 
                    var lineStringNode = (XmlElement)doc.GetElementsByTagName("LineString")[0];
                    var coordinatesNode = (XmlElement)lineStringNode.GetElementsByTagName("coordinates")[0];
                    var coordinates = coordinatesNode.InnerText;
                    if (!string.IsNullOrEmpty(coordinates))
                    {
                        var coords = new List<double[]>();
                        foreach (var str1 in coordinates.Trim().Split())
                        {
                            if (string.IsNullOrEmpty(str1)) continue;
                            var items = str1.Trim().Split(',');
                            if (items != null && items.Length >= 2)
                            {
                                var lon = items[0].ToDoubleOrNull();
                                var lat = items[1].ToDoubleOrNull();
                                if (lon.HasValue && lat.HasValue)
                                {
                                    coords.Add(new double[] {
                                        lon.Value, lat.Value,
                                    });
                                }
                            }
                        }
                        features.Add(new Feature
                        {
                            type = "Feature",
                            geometry = new Geometry
                            {
                                type = "LineString",
                                coordinates = coords,
                            },
                            properties = new Dictionary<string, string> {
                                { "name", pname }
                            },
                        });
                    }
                    #endregion 
                }
                else if (name1.EndsWith(".xml"))
                {
                    routeType = 2; //地铁
                    #region 转换XML
                    var cityNode = doc.GetElementsByTagName("City")[0];
                    if (cityNode != null)
                    {
                        cityName = cityNode.Attributes[0].Value;
                    }
                    #region  取出站点
                    var lineNodes = ((XmlElement)cityNode).GetElementsByTagName("MetroLine");
                    foreach (XmlNode lineNode in lineNodes)//线路
                    {
                        var lineFeature = new Feature();
                        lineFeature.type = "FeatureCollection";
                        lineFeature.features = new List<Feature>();
                        var lineName = lineNode.Attributes["Name"].Value;
                        var stations = ((XmlElement)lineNode)
                            .GetElementsByTagName("Station");
                        lines.Add(lineName);
                        foreach (XmlNode stationNode in stations)
                        {
                            #region stationNode
                            var stationName = stationNode.Attributes["Name"].Value;
                            var lnglat = GetLngLat(stationNode);
                            lineFeature.features.Add(new Feature
                            {
                                type = "Feature",
                                geometry = new Geometry
                                {
                                    type = "Point",
                                    coordinates = lnglat,
                                },
                                properties = new Dictionary<string, string> {
                                    {"name" , stationName} }
                            });

                            var subItems = stationNode.NextSibling;
                            if (subItems != null)
                            {
                                var coordinates = new List<double[]>();
                                foreach (XmlNode subItem in subItems.ChildNodes)
                                {
                                    var lnglat2 = GetLngLat(subItem);
                                    if (lnglat2 != null)
                                    {
                                        coordinates.Add(lnglat2);
                                    }
                                }
                                lineFeature.features.Add(new Feature
                                {
                                    type = "Feature",
                                    geometry = new Geometry
                                    {
                                        type = "LineString",
                                        coordinates = coordinates,
                                    },
                                    properties = new Dictionary<string, string> {
                                    {"name" , lineName} }
                                });
                            }
                            #endregion stationNode
                        }
                        if (!string.IsNullOrEmpty(lineName))
                        {
                            lineFeature.properties = new Dictionary<string, string>();
                            lineFeature.properties.Add("lineName", lineName);
                        }
                        features.Add(lineFeature);
                    }


                    #endregion  取出站点

                    #endregion 转换XML
                }

                feature.type = "FeatureCollection";
                feature.features = features;
                if (!string.IsNullOrEmpty(cityName))
                {
                    feature.properties = new Dictionary<string, string>();
                    feature.properties.Add("cityName", cityName);
                }
            }
            return JsonConvert.SerializeObject(feature);
        }

        double[] GetLngLat(XmlNode node)
        {
            var Longitude = node.Attributes["Longitude"].Value.ToDoubleOrNull();
            var Latitude = node.Attributes["Latitude"].Value.ToDoubleOrNull();
            if (Longitude.HasValue && Latitude.HasValue)
            {
                return new double[] { Longitude.Value, Latitude.Value };
            }
            return null;
        }

        public class Feature
        {
            public string type { set; get; }
            public List<Feature> features { set; get; }
            public Geometry geometry { set; get; }
            public Dictionary<string, string> properties { set; get; }
        }

        public class Geometry
        {
            public string type { set; get; }
            public object coordinates { set; get; }
        }

        //DONE: 获取单个
        public ActionResult RouteGet(int id)
        {
            var item = routeSrv.GetRoute(id);

            return Json(new
            {
                success = true,
                data = item,
            }, JsonRequestBehavior.AllowGet);
        }

        //DONE: 获取列表
        [HttpPost]
        public ActionResult ListRoute(int type)
        {
            var cond = GetPageCondition();
            var page = routeSrv.ListRoute(type, cond);
            return Json(new
            {
                success = true,
                data = page.Items,
                total = page.TotalItems,
            }, JsonRequestBehavior.AllowGet);
        }

        // DONE:删除路线
        public ActionResult RemoveRoute(int id)
        {       
            routeSrv.RemoveRoute(id);
                        
            return Json(new
            {
                success = true,
                //data = new
                
            }, JsonRequestBehavior.AllowGet);
        }

        //DONE:修改路线
        [HttpPost]
        public ActionResult UpdateRoute(RouteUpdateModel model)
        {
            var route = new Route();
            route.Id = model.Id;
            route.RouteType = model.RouteType;
            if(model.RouteType == 1)
            {
                var item = routeSrv.GetRoute(route.Id);
                route.Name = item.Name;
                route.Lines = item.Lines;
                route.GroupId = item.GroupId;

                route.Memo = item.Memo;
                route.Geo = model.Geo;
                route.CreateTime = item.CreateTime;
                route.UpdateTime = DateTime.UtcNow;
                routeSrv.UpdateRoute(route);

            }else
            {
                //修改地铁
            }
            
            return Json(new
            {
                success = true,
                data = routeSrv.GetRoute(route.Id)
            });
        }

        [HttpPost]
        //DONE:新增路线
        public ActionResult AddRoute(RouteAddModel model)
        {
            if (ModelState.IsValid)
            {
                var route = new Route();
                route.GroupId = model.GroupId;
                route.RouteType = model.RouteType;
                route.Name = model.Name;
                route.Geo = model.Geo;
                //route.Lines = string.Join("$_$_$", lines);                
                route.Memo = model.Memo;
                if (route.Id == 0)
                {
                    route.CreateTime = DateTime.UtcNow;
                    //route.CreateUserId = CurrentUser.Id;
                }
                else
                {
                    route.UpdateTime = DateTime.UtcNow;
                    //route.UpdateUserId = CurrentUser.Id;
                }
                routeSrv.AddRoute(route);
                return Json(new
                {
                    success = true,
                    data = new
                    {
                        Id = route.Id,
                        RouteType = route.RouteType,
                    },
                });

            }
            return this.GetStateJson();
        }




        #endregion 路径

        [HttpPost]
        public ActionResult SaveRouteGroup(RouteGroupSaveModel model)
        {
            if (ModelState.IsValid)
            {
                var group = new RouteGroup();
                group.Id = model.Id;
                group.Name = model.Name;
                group.Memo = model.Memo;
                group.ParentId = model.ParentId;
                routeSrv.SaveRouteGroup(group);
                return Json(new
                {
                    success = true,
                });
            }
            return base.GetStateJson();
        }

        //TODO:列表
        //TODO:获取单个

    }
}

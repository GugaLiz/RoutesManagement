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
    public class HighSpeedTrainController : ControllerBase
    {
        IHighSpeedTrainService srv { set; get; }

        public HighSpeedTrainController(IHighSpeedTrainService srv)
        {
            this.srv = srv;
        }

        #region 高铁

        [HttpPost]
        public ActionResult Save(HighSpeedTrainSaveModel model)
        {
            if (ModelState.IsValid)
            {
                var item = new HighSpeedTrain();
                //var file = Request.Files["File"];
                var id = item.Id;
                var file = Request.Files[0];
                XmlDocument doc = new XmlDocument();
                doc.Load(XmlReader.Create(file.InputStream));
                //item.OriginXml = doc.OuterXml;
                var lines = new List<string>();
                string lineName = "";
                item.Coordinates = GetGeo(doc, file.FileName, ref lineName);
                item.Name = model.Name;
                item.LineName = lineName;
                item.Memo = model.Memo;
                if (item.Id == 0)
                {
                    item.CreateDT = DateTime.UtcNow;
                    // item.Creator = CurrentUser.Account;
                    item.Creator = "admin";
                }
                else
                {
                    item.UpdateDT = DateTime.UtcNow;
                   // item.Updator = CurrentUser.Account;
                }
                srv.Save(item);
                return Json(new
                {
                    success = true,
                    data = new
                    {
                        Id = item.Id,
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
        string GetGeo(XmlDocument doc, string name, ref string lineName)
        {
            lineName = "";
            var coords = new List<double[]>();
            var feature = new Feature();
            if (doc != null)
            {
                var features = new List<Feature>();
                var cityName = "";
                var name1 = name.ToLower();
                if (name1.EndsWith(".kml"))
                {
                    #region 
                    var docNode = (XmlElement)doc.GetElementsByTagName("Document")[0];
                    var kmlname = docNode.GetElementsByTagName("name")[0];
                    var folderNode = (XmlElement)docNode.GetElementsByTagName("Folder")[0];
                    var placemarkNode = (XmlElement)doc.GetElementsByTagName("Placemark")[0];
                    var pnameNode = (XmlElement)placemarkNode.GetElementsByTagName("name")[0];
                    var fnameNode = (XmlElement)folderNode.GetElementsByTagName("name")[0];
                    var pname = pnameNode.InnerText;
                    lineName = fnameNode.InnerText;
                    var lineStringNode = (XmlElement)doc.GetElementsByTagName("LineString")[0];
                    var coordinatesNode = (XmlElement)lineStringNode.GetElementsByTagName("coordinates")[0];
                    var coordinates = coordinatesNode.InnerText;
                    if (!string.IsNullOrEmpty(coordinates))
                    {
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

                feature.type = "FeatureCollection";
                feature.features = features;
                if (!string.IsNullOrEmpty(cityName))
                {
                    feature.properties = new Dictionary<string, string>();
                    feature.properties.Add("cityName", cityName);
                }
            }
            return JsonConvert.SerializeObject(coords);
            //return JsonConvert.SerializeObject(feature);
        }

        static double[] GetLngLat(XmlNode node)
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

        public ActionResult Get(int id)
        {
            var item = srv.Get(id);

            return Json(new
            {
                success = true,
                data = item,
            }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult List()
        {
            var cond = GetPageCondition();
            var page = srv.List(cond);
            return Json(new
            {
                success = true,
                data = page.Items,
                total = page.TotalItems,
            }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult Remove(int id)
        {
            srv.Remove(id);

            return Json(new
            {
                success = true,
            }, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult Update(CoordinatesUpdateModel model)
        {
            if (model.Id>0)
            {
                var item = srv.Get(model.Id);
                var points = JsonConvert.DeserializeObject<List<double[]>>(
                    model.Coordinates);
                var results = new List<double[]>();
                foreach (var point in points)
                {
                    double lat = 0;
                    double lng = 0;
                    EvilTransform.GCJ2WGS(point[1], point[0], out lat, out lng);
                    results.Add(new double[] { lng, lat });
                }
                item.Coordinates = JsonConvert.SerializeObject(results);
                item.UpdateDT = DateTime.UtcNow;
                srv.Update(item);
            }

            return Json(new
            {
                success = true,
            });
        }

        static string KML_TPL = @"<?xml version=""1.0"" encoding=""UTF-8""?>
<kml xmlns=""http://www.opengis.net/kml/2.2"" xmlns:gx=""http://www.google.com/kml/ext/2.2"" xmlns:kml=""http://www.opengis.net/kml/2.2"" xmlns:atom=""http://www.w3.org/2005/Atom"">
<Document>
	<name>{0}.kml</name>
	<Style id=""sn_ylw-pushpin1600"">
		<IconStyle>
			<scale>1.1</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>
			</Icon>
			<hotSpot x=""20"" y=""2"" xunits=""pixels"" yunits=""pixels""/>
		</IconStyle>
		<LineStyle>
			<color>ff00ffff</color>
			<width>2</width>
		</LineStyle>
	</Style>
	<StyleMap id=""msn_ylw-pushpin1401"">
		<Pair>
			<key>normal</key>
			<styleUrl>#sn_ylw-pushpin1600</styleUrl>
		</Pair>
		<Pair>
			<key>highlight</key>
			<styleUrl>#sh_ylw-pushpin190</styleUrl>
		</Pair>
	</StyleMap>
	<Style id=""sh_ylw-pushpin190"">
		<IconStyle>
			<scale>1.3</scale>
			<Icon>
				<href>http://maps.google.com/mapfiles/kml/pushpin/ylw-pushpin.png</href>
			</Icon>
			<hotSpot x=""20"" y=""2"" xunits=""pixels"" yunits=""pixels""/>
		</IconStyle>
		<LineStyle>
			<color>ff00ffff</color>
			<width>2</width>
		</LineStyle>
	</Style>
	<Folder>
		<name>{1}</name>
		<open>1</open>
		<Folder>
			<name>线路</name>
			<open>1</open>
			<Placemark>
				<name>{1}</name>
				<styleUrl>#msn_ylw-pushpin1401</styleUrl>
				<LineString>
					<tessellate>1</tessellate>
					<coordinates>
{2}
</coordinates>
				</LineString>
			</Placemark>
		</Folder>
	</Folder>
</Document>
</kml>
";

        public ActionResult ExportKml(int id)
        {
            var item = srv.Get(id);
            var points = JsonConvert.DeserializeObject<List<double[]>>(
                item.Coordinates);
            StringBuilder sb = new StringBuilder();
            foreach (var point in points)
            {
                double lat = point[1];
                double lng = point[0];
                sb.Append(string.Format("{0},{1},0 ", lng, lat));
            }
            string fileName = string.Format("{0}.kml",
                item.Name);
            DownFileHeader(Response, Request, fileName, null);
            Response.Write(string.Format(KML_TPL,
                item.Name, 
                item.LineName,
                sb.ToString()));
            Response.End();
            return new EmptyResult();
        }

        #endregion 高铁

    }
}

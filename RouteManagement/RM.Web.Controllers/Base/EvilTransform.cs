using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.Web.Controllers
{
    public static class EvilTransform
    {
        const double pi = 3.14159265358979324;

        //
        // Krasovsky 1940
        //
        // a = 6378245.0, 1/f = 298.3
        // b = a * (1 - f)
        // ee = (a^2 - b^2) / a^2;
        const double a = 6378245.0;
        const double ee = 0.00669342162296594323;

        /// <summary>
        /// Transform
        /// World Geodetic System ==> Mars Geodetic System
        /// 正确坐标==> 火星坐标
        /// </summary>
        /// <param name="wgLat"></param>
        /// <param name="wgLon"></param>
        /// <param name="mgLat"></param>
        /// <param name="mgLon"></param>
        public static void Transform(double wgLat, double wgLon, out double mgLat, out double mgLon)
        {
            if (outOfChina(wgLat, wgLon))
            {
                mgLat = wgLat;
                mgLon = wgLon;
                return;
            }
            double dLat = transformLat(wgLon - 105.0, wgLat - 35.0);
            double dLon = transformLon(wgLon - 105.0, wgLat - 35.0);
            double radLat = wgLat / 180.0 * pi;
            double magic = Math.Sin(radLat);
            magic = 1 - ee * magic * magic;
            double sqrtMagic = Math.Sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * pi);
            dLon = (dLon * 180.0) / (a / sqrtMagic * Math.Cos(radLat) * pi);
            mgLat = wgLat + dLat;
            mgLon = wgLon + dLon;
        }

        public static void GCJ2WGS(double gcjLat, double gcjLng,
            out double wgLat, out double wgLng)
        {
            if (outOfChina(gcjLat, gcjLng))
            {
                wgLat = gcjLat;
                wgLng = gcjLng;
            }
            double rLat = 0;
            double rLng = 0;
            Delta(gcjLat, gcjLng, out rLat, out rLng);
            wgLat = gcjLat - rLat;
            wgLng = gcjLng - rLng;
        }

        static void Delta(double lat, double lng,
            out double rLat, out double rLng)
        {
            double a = 6378137.0;
            double ee = 0.00669342162296594323;
            double dLat = transformLat(lng - 105.0, lat - 35.0);
            double dLng = transformLon(lng - 105.0, lat - 35.0);
            double radLat = lat / 180.0 * Math.PI;
            double magic = Math.Sin(radLat);
            magic = 1 - ee * magic * magic;
            double sqrtMagic = Math.Sqrt(magic);
            dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
            dLng = (dLng * 180.0) / (a / sqrtMagic * Math.Cos(radLat) * Math.PI);
            rLat = dLat;
            rLng = dLng;
        }

        /// <summary>
        /// 校验是否合法的GPS坐标
        /// </summary>
        /// <param name="lat"></param>
        /// <param name="lng"></param>
        /// <returns></returns>
        public static bool ValidLatLng(double? lat, double? lng)
        {
            if (lat.HasValue && lng.HasValue)
            {
                if (lng.Value >= -180 && lng.Value <= 180
                        && lat.Value <= 90 && lat.Value >= -90)
                {
                    return true;
                }
            }
            return false;
        }

        #region 是否在中国

        private class Rectangle
        {
            public double West;
            public double North;
            public double East;
            public double South;
            public Rectangle(double latitude1, double longitude1, double latitude2, double longitude2)
            {
                this.West = Math.Min(longitude1, longitude2);
                this.North = Math.Max(latitude1, latitude2);
                this.East = Math.Max(longitude1, longitude2);
                this.South = Math.Min(latitude1, latitude2);
            }
        }

        private static Rectangle[] region = new Rectangle[]
{
    new Rectangle(49.220400, 079.446200, 42.889900, 096.330000),
    new Rectangle(54.141500, 109.687200, 39.374200, 135.000200),
    new Rectangle(42.889900, 073.124600, 29.529700, 124.143255),
    new Rectangle(29.529700, 082.968400, 26.718600, 097.035200),
    new Rectangle(29.529700, 097.025300, 20.414096, 124.367395),
    new Rectangle(20.414096, 107.975793, 17.871542, 111.744104),

};
        private static Rectangle[] exclude = new Rectangle[]
{
    new Rectangle(25.398623, 119.921265, 21.785006, 122.497559),
    new Rectangle(22.284000, 101.865200, 20.098800, 106.665000),
    new Rectangle(21.542200, 106.452500, 20.487800, 108.051000),
    new Rectangle(55.817500, 109.032300, 50.325700, 119.127000),
    new Rectangle(55.817500, 127.456800, 49.557400, 137.022700),
    new Rectangle(44.892200, 131.266200, 42.569200, 137.022700),
};

        private static bool InRectangle(Rectangle rect, double lat, double lon)
        {
            return rect.West <= lon && rect.East >= lon && rect.North >= lat && rect.South <= lat;
        }

        #endregion 是否在中国

        /// <summary>
        /// 澳门
        /// </summary>
        static double[][] _mc = new double[][]{
                //澳门区域
                new double[] { 113.559451, 22.152668, 113.625997, 22.108475},
                new double[] { 113.551833, 22.161371, 113.613133, 22.151731},
                new double[] { 113.54515,  22.174157, 113.608319, 22.16512},
                new double[] { 113.539329, 22.193166, 113.579788, 22.178575},
                new double[] { 113.545437, 22.215653, 113.575189, 22.202603},
                new double[] { 113.543856, 22.205146, 113.580435, 22.191158},
                new double[] { 113.54206,  22.197517, 113.579429, 22.185469},
                new double[] { 113.539688, 22.194973, 113.579717, 22.180583},
            };

        /// <summary>
        /// 香港
        /// </summary>
        static double[][] _hk = new double[][]{

                //香港区域，需要再增加吧
                new double[] { 113.869772, 22.428722, 114.490681, 22.171913},
                new double[] { 113.983606, 22.508876, 114.464235, 22.382745},
            };

        static bool inHONGKONG(double lat, double lon) //是否在香港
        {
            foreach (var item in _hk)
            {
                if (lon < item[2] && lon > item[0] && lat < item[1] && lat > item[3])
                {
                    return true;
                }
            }
            return false;
        }

        static bool inMACAO(double lat, double lon) //是否在澳门
        {
            foreach (var item in _mc)
            {
                if (lon < item[2] && lon > item[0] && lat < item[1] && lat > item[3])
                {
                    return true;
                }
            }
            return false;
        }

        /// <summary>
        /// outOfChina
        /// </summary>
        /// <param name="lat"></param>
        /// <param name="lon"></param>
        /// <returns></returns>
        public static bool outOfChina(double lat, double lon)
        {
            if (lon < 72.004 || lon > 137.8347)
                return true;
            if (lat < 0.8293 || lat > 55.8271)
                return true;

            return !IsInsideChina(lat, lon);
        }

        static bool IsInsideChina(double lat, double lon)
        {
            for (int i = 0; i < region.Length; i++)
            {
                if (InRectangle(region[i], lat, lon))
                {
                    for (int j = 0; j < exclude.Length; j++)
                    {
                        if (InRectangle(exclude[j], lat, lon))
                        {
                            return false;
                        }
                    }
                    return true;
                }
            }
            return false;
        }

        static double transformLat(double x, double y)
        {
            double ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.Sqrt(Math.Abs(x));
            ret += (20.0 * Math.Sin(6.0 * x * pi) + 20.0 * Math.Sin(2.0 * x * pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.Sin(y * pi) + 40.0 * Math.Sin(y / 3.0 * pi)) * 2.0 / 3.0;
            ret += (160.0 * Math.Sin(y / 12.0 * pi) + 320 * Math.Sin(y * pi / 30.0)) * 2.0 / 3.0;
            return ret;
        }

        static double transformLon(double x, double y)
        {
            double ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.Sqrt(Math.Abs(x));
            ret += (20.0 * Math.Sin(6.0 * x * pi) + 20.0 * Math.Sin(2.0 * x * pi)) * 2.0 / 3.0;
            ret += (20.0 * Math.Sin(x * pi) + 40.0 * Math.Sin(x / 3.0 * pi)) * 2.0 / 3.0;
            ret += (150.0 * Math.Sin(x / 12.0 * pi) + 300.0 * Math.Sin(x / 30.0 * pi)) * 2.0 / 3.0;
            return ret;
        }

    }
}
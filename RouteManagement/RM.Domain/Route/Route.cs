using RM.Common;
using System;

namespace RM.Domain
{
    [TableName("Route")]
    [PrimaryKey("Id")]
    public class Route
    {
        public int Id { set; get; }
        public int GroupId { set; get; }
        public int RouteType { set; get; }
        public string Name { set; get; }
        public string OriginXml { set; get; }
        public string Geo { set; get; }
        public string Lines { set; get; }
        public string Memo { set; get; }
        public DateTime CreateTime { set; get; }
        public DateTime? UpdateTime { set; get; }
        public int CreateUserId { set; get; }
        public int? UpdateUserId { set; get; }
    }

    public class RouteView
    {
        public int Id { set; get; }
        public int GroupId { set; get; }
        public int RouteType { set; get; }
        public string Name { set; get; }
        public string Memo { set; get; }
        public string Lines { set; get; } //针对地铁类型的
        public DateTime CreateTime { set; get; }
        public DateTime? UpdateTime { set; get; }
        public int CreateUserId { set; get; }
        public int? UpdateUserId { set; get; }
    }

    public class RouteGeoView : RouteView
    {
        public string Geo { set; get; }
    }
}

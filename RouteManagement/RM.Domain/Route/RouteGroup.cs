using RM.Common;
using System;

namespace RM.Domain
{
    [TableName("RouteGroup")]
    [PrimaryKey("Id")]
    public class RouteGroup
    {
        public int Id { set; get; }
        public string Name { set; get; }
        public string Memo { set; get; }
        public int? ParentId { set; get; }
        public DateTime CreateTime { set; get; }
        public DateTime? UpdateTime { set; get; }
    }
}

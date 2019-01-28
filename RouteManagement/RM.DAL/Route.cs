using RM.Common;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.DAL
{
    public class RouteRepository
    {
        IDatabase db;
        public RouteRepository(IDatabase db)
        {
            this.db = db;
        }

        public Page<RouteView> ListRoute(int type, PageCondition cond)
        {
            var sql = new Sql(@"SELECT 
Id, RouteType,
Name, CreateTime,
Memo, Lines,
UpdateTime
FROM Route
");
            sql.Append(" WHERE RouteType=@0", type);
            if (!string.IsNullOrEmpty(cond.Query))
            {
                sql.Append(" AND Name Like @0 ", cond.Query);
            }
            sql.Append(" ORDER BY CreateTime DESC ");
            var list = db.Page<RouteView>(cond.PageNumber, cond.PageSize, sql);
            return list;
        }

        public RouteGeoView GetRoute(int id)
        {
            return db.SingleOrDefault<RouteGeoView>(@"
Select 
Id, RouteType,
Name, CreateTime,
Memo, Geo,
UpdateTime
from Route where Id=@0", id);
        }

        public void SaveRoute(Route route)
        {
            using (var scope = db.GetTransaction())
            {
                db.Save(route);
//                var sql = @"
//Update Route set [Geo] = 
//cast('Point(122.22 22.33 4326)' as Geography)
//where Id = @0
//";
//                db.Execute(sql, route.Id);
                scope.Complete();
            }
        }

        public int RemoveRoute(int id)
        {
                return db.Delete<Route>(id);            
        }

         public void UpdateRoute(Route route)
        { 
                db.Update(route);            
        } 

        public void AddRoute(Route route)
        {
            db.Insert(route);
        }
    }
}

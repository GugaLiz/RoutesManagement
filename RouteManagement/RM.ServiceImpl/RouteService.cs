using RM.Common;
using RM.DAL;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.ServiceImpl
{
    public interface IRouteService
    {
        void SaveRoute(Route route);
        RouteGeoView GetRoute(int id);
        Page<RouteView> ListRoute(int type,
            PageCondition cond);
        int RemoveRoute(int id);
        void UpdateRoute(Route route);
        void AddRoute(Route route);
        void SaveRouteGroup(RouteGroup group);
    }

    public class RouteService : IRouteService
    {
        RouteRepository rep;
        IDatabase db;
        public RouteService(IDatabase db)
        {
            this.db = db;
            this.rep = new RouteRepository(db);
        }

        public void SaveRoute(Route route)
        {
            rep.SaveRoute(route);
        }

        public RouteGeoView GetRoute(int id)
        {
            return rep.GetRoute(id);
        }

        public Page<RouteView> ListRoute(int type, PageCondition cond)
        {
            return rep.ListRoute(type, cond);
        }

        public int RemoveRoute(int id)
        {
            return rep.RemoveRoute(id);
            
        }

         public void UpdateRoute(Route route)
        {
             rep.UpdateRoute(route);
        }

        public void AddRoute(Route route)
        {
            rep.AddRoute(route);
        }


        public void SaveRouteGroup(RouteGroup group)
        {
            db.Save(group);
        }
    }
}

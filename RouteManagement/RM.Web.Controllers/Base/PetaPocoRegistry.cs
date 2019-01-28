using RM.Common;
using StructureMap.Configuration.DSL;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.Web.Controllers
{
    public class PetaPocoRegistry : Registry
    {
        public PetaPocoRegistry()
        {
            Scan(x =>
            {
                x.TheCallingAssembly();
                x.WithDefaultConventions();
                x.Assembly("RM.ServiceImpl");
            });

            For<IDatabase>().HttpContextScoped().Use(GetDatabase);
        }

        public static IDatabase GetDatabase()
        {
            return new Database("RouteDB");
        }
    }
}

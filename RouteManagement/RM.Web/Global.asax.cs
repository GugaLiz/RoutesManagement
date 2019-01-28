using RM.Common;
using RM.Domain;
using RM.Web.Controllers;
using StructureMap;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Security;
using System.Web.SessionState;

namespace RM.Web
{
    public class Global : System.Web.HttpApplication
    {

        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");
            routes.IgnoreRoute("favicon.ico");

            routes.Ignore("{*pathInfo}", new { pathInfo = @"^.*(ChartImg.axd)$" });
            routes.IgnoreRoute("{*allsvc}", new { allsvc = @".*\.svc(/.*)?" });
            routes.IgnoreRoute("{*allasmx}", new { allsvc = @".*\.asmx(/.*)?" });

            routes.IgnoreRoute("favicon.ico");
        }

        protected void Application_Start(object sender, EventArgs e)
        {
            AreaRegistration.RegisterAllAreas();
            RegisterRoutes(RouteTable.Routes);

            ControllerBuilder.Current.SetControllerFactory(
                new PetaPocoControllerFactory());
            RouteRegistar.RegisterRoutesTo(RouteTable.Routes);

            ObjectFactory.Initialize(x => x.AddRegistry<PetaPocoRegistry>());
        }

        protected void Session_Start(object sender, EventArgs e)
        {

        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {

        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {

        }

        protected void Application_Error(object sender, EventArgs e)
        {

        }

        protected void Session_End(object sender, EventArgs e)
        {

        }

        protected void Application_End(object sender, EventArgs e)
        {

        }

        protected void Application_PreSendRequestHeaders(object sender, EventArgs e)
        {
            HttpApplication app = sender as HttpApplication;
            if (app != null &&
                app.Context != null)
            {
                var resp = app.Context.Response;
                resp.Headers.Remove("Server");
                resp.Headers.Remove("X-AspNet-Version");
                resp.Headers.Remove("X-AspNetMvc-Version");

                resp.Headers.Add("Access-Control-Allow-Credentials", "true");
            }
        }
    }
}
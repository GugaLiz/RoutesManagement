using StructureMap;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using System.Web.Routing;

namespace RM.Web.Controllers
{
    public class PetaPocoControllerFactory : DefaultControllerFactory
    {
        protected override IController GetControllerInstance(RequestContext requestContext, Type controllerType)
        {
            if (controllerType != null)
                return ObjectFactory.GetInstance(controllerType) as IController;

            return base.GetControllerInstance(requestContext, controllerType);
        }

        //protected override Type GetControllerType(RequestContext requestContext, string controllerName)
        //{
        //    return typeof(FrontController);
        //}
    }
}

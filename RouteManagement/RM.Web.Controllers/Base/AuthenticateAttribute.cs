using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mvc;

namespace RM.Web.Controllers
{

    public class AuthenticateAttribute : FilterAttribute, IAuthorizationFilter, IExceptionFilter
    {

        public AuthenticateAttribute()
        {
        }

            #region 检查是否有登录

        public void OnAuthorization(AuthorizationContext ctx)
        {
            //if (NotSignin(ctx))
            //{
            //    ctx.HttpContext.Response.Redirect("/Account/LogOn");
            //}
        }

        static bool NotSignin(AuthorizationContext ctx)
        {
            var controller = ctx.ActionDescriptor.ControllerDescriptor;
            if (controller.ControllerName != "Account" &&
//                !ctx.RequestContext.HttpContext.Request.IsAuthenticated)
                    !FormsService.IsSignIn())
                return true;
            return false;
        }

        #endregion 检查是否有登录


        #region IExceptionFilter Members

        public void OnException(ExceptionContext filterContext)
        {
            
        }

        #endregion
    }
}

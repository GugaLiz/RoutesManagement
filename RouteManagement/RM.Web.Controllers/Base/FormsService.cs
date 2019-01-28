using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Security;

namespace RM.Web.Controllers
{
    public static class FormsService
    {
        public static void SignIn(User user, bool createPersistentCookie)
        {
            if (user == null)
                throw new ArgumentException("Value cannot be null or empty.", "userName");

            HttpContext.Current.Session[Session_Key] = user;
            //FormsAuthentication.SetAuthCookie(userName, 
            //    createPersistentCookie);
        }

        static string Session_Key = "__Account";
        public static bool IsSignIn()
        {
            var user = HttpContext.Current.Session[Session_Key] as User;
            return user != null;
        }

        public static User GetCurrentUser()
        {
            return HttpContext.Current.Session[Session_Key] as User;
        }

        public static void SignOut()
        {
            HttpContext.Current.Session.Remove(Session_Key);
        }
    }
}

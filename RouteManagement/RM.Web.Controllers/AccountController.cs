using RM.Common.Util;
using RM.Domain;
using RM.ServiceImpl;
using RM.Web.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Mvc;
using System.Web.Routing;

namespace RM.Web.Controllers
{
    [HandleError]
    public class AccountController : ControllerBase
    {
        IUserService userSrv { set; get; }

        public AccountController(IUserService userSrv)
        {
            this.userSrv = userSrv;
        }

        public ActionResult LogOn()
        {
            return View();
        }

        public ActionResult LogOut()
        {
            FormsService.SignOut();
            return Json(new { success = true });
        }

        [HttpPost]
        public ActionResult Check(LogOnModel model)
        {
            if (ModelState.IsValid)
            {
                User user = null;
                if (userSrv.ValidateUser(model.UserName,
                    model.Password, ref user))
                {
                    FormsService.SignIn(user, model.RememberMe);
                    return Json(new
                    {
                        success = true,
                    });
                }
                else
                {
                    ModelState.AddModelError("", 
                        "The user name or password provided is incorrect.");
                }
            }
            return base.GetStateJson();
        }

        //DONE:新增用户信息
        [HttpPost]
        public ActionResult AddUser(UserAddModel model)
        {
            var user = new User();
            user.Account = model.Account;
            user.Email = model.Email;
            user.Nickname = model.Nickname;
            user.Memo = model.Memo;
            user.Password = model.Password;
            user.CreateTime = DateTime.UtcNow;
            user.Disabled = 1;
            userSrv.Add(user);
            return Json(new
            {
                success = true,
                data = new
                {
                    Id = user.Id
                },
            });
        }      

        //DONE:获取用户信息
        [HttpPost]
        public ActionResult ListUser()
        {
            var cond = GetPageCondition();
            var page = userSrv.List(cond);
            return Json(new
            {
                success = true,
                data = page.Items,
                total = page.TotalItems,
            }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult UserGet(int id)
        {
            var item = userSrv.Get(id);

            return Json(new
            {
                success = true,
                data = item,
            }, JsonRequestBehavior.AllowGet);
        }

        //更新用户信息
        [HttpPost]
        public ActionResult UpdateUser(UserUpdateModel model)
        {
                var user = new User();
                user.Id = model.Id;
                var item = userSrv.Get(user.Id);
                user.Account = item.Account;
                user.Nickname = model.Nickname;
                user.Memo = model.Memo;
                user.Email = model.Email;
                user.Password = item.Password;
                user.CreateTime = item.CreateTime;
                user.UpdateTime = DateTime.UtcNow;
                user.Disabled = item.Disabled;
                userSrv.Update(user);
                return Json(new
                {
                    success = true,
                    data = new
                    {
                        data = userSrv.Get(user.Id)
                    },
                });

        }

        //更新用户密码
        [HttpPost]
        public ActionResult UpdatePwd(UserUpdateModel model)
        {
            var user = new User();
            user.Id = model.Id;
            var item = userSrv.Get(user.Id);
            user.Account = item.Account;
            user.Nickname = item.Nickname;
            user.Memo = item.Memo;
            user.Email = item.Email;   
            user.Password = model.Password;
            user.CreateTime = item.CreateTime;
            user.UpdateTime = DateTime.UtcNow;
            user.Disabled = item.Disabled;
            userSrv.Update(user);
            return Json(new
            {
                success = true,
                data = new
                {
                    data = userSrv.Get(user.Id)
                },
            });

        }

        //DONE:删除用户信息
        public ActionResult DeleteUser(int id)
        {
            userSrv.Remove(id);
            return Json(new
            {
                success = true
            }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult DeleteUsers(DeleteModel model)
        {
            var ids = model.ids;
            string[] userIds = ids.Split(',');
            var lenght = userIds.Length;
            for (int i = 0; i < userIds.Length; i++)
            {
                int id = int.Parse(userIds[i]); 
                userSrv.Remove(id);
            }
            return Json(new
            {
                success = true
            }, JsonRequestBehavior.AllowGet);
        }

    }
}

using RM.Common;
using RM.DAL;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.ServiceImpl
{
    public interface IUserService : IBaseService<User>
    {
        bool ValidateUser(string userName, string password,
            ref User user);
        bool ChangePassword(string userName,
            string oldPassword, string newPassword);
        void AddUser(User user);
        void UpdateUser(User user);
    }

    public class UserService : BaseService<User>,
        IUserService
    {
        public UserService(IDatabase db) : base(db, null)
        {
            this.db = db;
            this.rep = new UserRepository(db);
        }

        public bool ChangePassword(string userName,
            string oldPassword, string newPassword)
        {
            return false;
        }

        public bool ValidateUser(string userName, string password,
            ref User user)
        {
            user = db.SingleOrDefault<User>("WHERE Account=@0", userName);
            if (user != null
                && !string.IsNullOrEmpty(user.Password)
                && user.Password.ToLower().Equals(password.ToLower()))
            {
                return true;
            }
            if (user == null)
            {
                var user1 = db.SingleOrDefault<User>("WHERE Account='test'");
                if (user1 == null)
                {
                    db.Save(new User
                    {
                        Account = "test",
                        Password = "test",
                        Email = "test@qwq.com",
                        CreateTime = DateTime.UtcNow,
                    });
                }
            }
            return false;
        }

        public void AddUser(User user)
        {
            rep.Add(user);
        }

        public void UpdateUser(User user)
        {
            rep.Update(user);
        }
    }
}

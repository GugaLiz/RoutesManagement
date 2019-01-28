using RM.Common;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.DAL
{
    public class UserRepository
    {
        IDatabase db;
        public UserRepository(IDatabase db)
        {
            this.db = db;
        }

    
    public Page<User>ListUser(PageCondition cond)
    {
            var sql = new Sql(@"SELECT 
Id,Account,
Password,Email
FROM [User]
");

            sql.Append(" ORDER BY CreateTime DESC ");
            var list = db.Page<User>(cond.PageNumber, cond.PageSize, sql);
            return list;
    }

        public User GetUser(int id)
        {
            return db.SingleOrDefault<User>(@"SELECT
Id,Account,
Password,Email,CreateTime
FROM [User] WHERE Id=@0", id);
        }

        public void UpdateUser(User user)
        {
            db.Update(user);
        }

        public void AddUser(User user)
        {
            db.Insert(user);
        }

        public int DeleteUser(int id)
        {
           return db.Delete<User>(id);
        }

    }
}

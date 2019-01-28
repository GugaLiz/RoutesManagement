using RM.Common;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.DAL
{
    public class UserRepository : BaseRepository<User>
    {
        public UserRepository(IDatabase db) : base(db)
        {
        }

        public override Page<User> List(PageCondition cond)
        {
            var sql = new Sql(@"SELECT 
Id,Account,Nickname, Email,Memo
FROM [User]
");

            sql.Append(" ORDER BY CreateTime DESC ");
            var list = db.Page<User>(cond.PageNumber, cond.PageSize, sql);
            return list;
        }

        public override User Get(int id)
        {
            return db.SingleOrDefault<User>(@"
SELECT Id, Account, Password,Nickname, Email,Memo, CreateTime
FROM [User] 
WHERE Id=@0", id);
        }

        public void AddUser(User user)
        {
            db.Insert(user);
        }

        public void UpdateUser(User user)
        {
            db.Update(user);
        }
    }
}

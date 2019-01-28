using RM.Common;
using System;

namespace RM.Domain
{
    [TableName("User")]
    [PrimaryKey("Id")]
    public class User
    {
        public int Id { set; get; }
        public string Account { set; get; }
        public string Password { set; get; }
        public string Email { set; get; }
        public string Memo { set; get; }
        public string Nickname { set; get; }
        public DateTime CreateTime { set; get; }
        public DateTime? UpdateTime { set; get; }
        public int Disabled { set; get; }
    }
}

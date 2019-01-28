using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace RM.Web.Models
{
    public class LogOnModel
    {
        [Required]
        [DisplayName("User name")]
        public string UserName { get; set; }

        [Required]
        [DataType(DataType.Password)]
        [DisplayName("Password")]
        public string Password { get; set; }

        [DisplayName("Remember me?")]
        public bool RememberMe { get; set; }

    }

    //新增用户
    public class UserAddModel
    {
        public int Id { get; set; }

        [Required]
        [DisplayName("Account")]
        public string Account { get; set; }

        [Required]
        [DisplayName("Nickname")]
        public string Nickname { get; set; }

        [Required]
        [DisplayName("Memo")]
        public string Memo { get; set; }

        [Required]
        [DisplayName("Email")]
        public string Email { get; set; }

        [Required]
        [DisplayName("Password")]
        public string Password { get; set; }

        [Required]
        [DisplayName("Disabled")]
        public int Disabled { get; set; }
    }

    //修改
    public class UserUpdateModel
    {
        public int Id { get; set; }

        [Required]
        [DisplayName("Account")]
        public string Account { get; set; }

        [Required]
        [DisplayName("Nickname")]
        public string Nickname { get; set; }

        [Required]
        [DisplayName("Memo")]
        public string Memo { get; set; }

        [Required]
        [DisplayName("Email")]
        public string Email { get; set; }

        [Required]
        [DisplayName("Password")]
        public string Password { get; set; }

        [Required]
        [DisplayName("Disabled")]
        public int Disabled { get; set; }
    }

    //批量删除
    public class DeleteModel
    {
        [Required]
        [DisplayName("ids")]
        public string ids { get; set; }
    }
}

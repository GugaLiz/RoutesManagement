using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace RM.Web.Models
{
    public class RouteGroupSaveModel
    {
        public int Id { set; get; }

        [Required]
        [DisplayName("Name")]
        public string Name { get; set; }

        public int? ParentId { get; set; }

        [DisplayName("Memo")]
        public string Memo { get; set; }

    }
}

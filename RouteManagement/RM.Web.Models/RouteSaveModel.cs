using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace RM.Web.Models
{
    public class RouteSaveModel
    {
        public int Id { set; get; }

        [Required]
        [DisplayName("Group Id")]
        public int GroupId { get; set; }

        [Required]
        [DisplayName("Route Type")]
        public int RouteType { get; set; }

        [Required]
        [DisplayName("Name")]
        public string Name { get; set; }

        [DisplayName("Memo")]
        public string Memo { get; set; }

    }

    public class RouteUpdateModel
    {
        public int Id { set; get; }

        [Required]
        [DisplayName("Group Id")]
        public int GroupId { get; set; }

        [Required]
        [DisplayName("Route Type")]
        public int RouteType { get; set; }

        [Required]
        [DisplayName("Geo")]
        public string Geo { get; set; }

        [Required]
        [DisplayName("Name")]
        public string Name { get; set; }

        [DisplayName("Memo")]
        public string Memo { get; set; }

    }

    public class RouteAddModel
    {
        public int Id { set; get; }

        [Required]
        [DisplayName("Group Id")]
        public int GroupId { get; set; }

        [Required]
        [DisplayName("Route Type")]
        public int RouteType { get; set; }

        [Required]
        [DisplayName("Geo")]
        public string Geo { get; set; }

        [Required]
        [DisplayName("Name")]
        public string Name { get; set; }

        [DisplayName("Memo")]
        public string Memo { get; set; }

    }
}

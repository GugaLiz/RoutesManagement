using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;

namespace RM.Web.Models
{
    public class HighSpeedTrainSaveModel
    {
        public int Id { set; get; }

        [Required]
        [DisplayName("Name")]
        public string Name { get; set; }

        [Required]
        [DisplayName("Name")]
        public string LineName { get; set; }

        [DisplayName("Memo")]
        public string Memo { get; set; }

    }

    public class CoordinatesUpdateModel
    {
        public int Id { set; get; }
        [Required]
        [DisplayName("Coordinates")]
        public string Coordinates { get; set; }
    }

}

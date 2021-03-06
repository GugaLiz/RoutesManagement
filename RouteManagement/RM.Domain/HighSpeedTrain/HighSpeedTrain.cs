﻿using RM.Common;
using System;

namespace RM.Domain
{
    [TableName("HighSpeedTrain")]
    [PrimaryKey("Id")]
    public class HighSpeedTrain
    {
        public int Id { set; get; }
        public string Name { set; get; }
        //public string OriginXml { set; get; }
        public string LineName { set; get; }
        public string Coordinates { set; get; }
        public string Memo { set; get; }
        //public bool Disabled { set; get; }
        public string Creator { set; get; }
        public DateTime CreateDT { set; get; }
        public DateTime? UpdateDT { set; get; }
        public string Updator { set; get; }
    }

}

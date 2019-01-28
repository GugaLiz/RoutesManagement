using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.Common
{
    public class PageCondition
    {
        public int PageSize { set; get; }
        public int PageNumber { set; get; }
        public int RowIndex { set; get; }
        public string Query { set; get; }
        
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.Common.Util
{
    public static class NumberExtensions
    {
        public static int ToIntOrZero(this string str)
        {
            return ToIntOrDefault(str, 0).Value;
        }

        public static int? ToIntOrDefault(this string str, int? d = 0)
        {
            int value;
            if (!int.TryParse(str, out value))
                return d;
            return value;
        }

        public static double ToDoubleOrZero(this string str)
        {
            return ToDoubleOrDefault(str, 0).Value;
        }

        public static double? ToDoubleOrDefault(this string str, double? d = 0)
        {
            double value;
            if (!double.TryParse(str, out value))
                return d;
            return value;
        }
        public static double? ToDoubleOrNull(this string str)
        {
            return ToDoubleOrDefault(str, null);
        }

    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace RM.Common.Util
{

    /// <summary>
    /// JSON序列化
    /// </summary>
    public static class JsonUtils
    {
        private static Func<string, Type, object> _DeserializeFunc;
        private static Func<object, string> _SerializeFunc;

        /// <summary>
        /// 初始化序列化方法，Web中放入Application启动时候 
        /// </summary>
        /// <param name="SerializeFunc"></param>
        /// <param name="DeserializeFunc"></param>
        public static void InitFunc(Func<object, string> SerializeFunc,
            Func<string, Type, object> DeserializeFunc)
        {
            _SerializeFunc = SerializeFunc;
            _DeserializeFunc = DeserializeFunc;
        }

        /// <summary>
        /// DeserializeObject 
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <param name="value"></param>
        /// <returns></returns>
        public static T DeserializeObject<T>(string value)
        {
            return (T)_DeserializeFunc(value, typeof(T));
        }

        /// <summary>
        /// SerializeObject 
        /// </summary>
        /// <param name="obj"></param>
        /// <returns></returns>
        public static string SerializeObject(object obj)
        {
            return _SerializeFunc(obj);
        }
    }
}

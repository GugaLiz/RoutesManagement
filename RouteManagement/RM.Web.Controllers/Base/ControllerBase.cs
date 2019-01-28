using RM.Common;
using RM.Common.Util;
using RM.Domain;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.Mvc;

namespace RM.Web.Controllers
{
    [Authenticate]
    public class ControllerBase : Controller
    {
        protected internal PageCondition GetPageCondition()
        {
            int rowIndex = Request.Form["start"].ToIntOrZero();
            int pageSize = Request.Form["limit"].ToIntOrDefault(1).Value;
            string query = Request.Form["Query"];
            int pageNumber = 0;
            if (rowIndex > 0)
            {
                pageNumber = (rowIndex / pageSize) + 1;
            }
            else
            {
                pageNumber = 1;
            }
            return new PageCondition
            {
                RowIndex = rowIndex,
                PageSize = pageSize,
                Query = query,
                PageNumber = pageNumber,
            };
        }

        public JsonResult GetStateJson()
        {
            var dict = new Dictionary<string, string>();
            foreach (var item in ModelState)
            {
                var key = item.Key;
                var val = item.Value;
                var str1 = new List<string>();
                foreach (var err in val.Errors)
                {
                    str1.Add(err.ErrorMessage);
                }
                dict[key] = string.Join("\n", str1);
            }
            return Json(new
            {
                success = false,
                data = dict
            });
        }

        public User CurrentUser
        {
            get
            {
                return FormsService.GetCurrentUser();
            }
        }
        public static void DownFileHeader(HttpResponseBase response, HttpRequestBase request,
           string fileName, long? fileSize)
        {
            DownFileHeader(response, request, fileName, fileSize,
                Encoding.UTF8, Encoding.UTF8);
        }

        /// <summary>
        /// 下载文件的头
        /// </summary>
        /// <param name="response"></param>
        /// <param name="request"></param>
        /// <param name="fileName"></param>
        /// <param name="fileSize"></param>
        /// <param name="headerEncoding"></param>
        /// <param name="contentEncodeing"></param>
        public static void DownFileHeader(HttpResponseBase response,
            HttpRequestBase request,
            string fileName, long? fileSize,
            Encoding headerEncoding, Encoding contentEncodeing,
            string contentType = "application/octet-stream;")
        {
            fileName = System.IO.Path.GetFileName(fileName);

            response.Clear();
            response.HeaderEncoding = headerEncoding;
            response.ContentEncoding = contentEncodeing;
            response.AddHeader("Content-Type", contentType);

            bool isFirefox = false;
            if (request.Browser != null && !string.IsNullOrEmpty(request.Browser.Browser) &&
                request.Browser.Browser.IndexOf("Firefox") > -1)
            {
                isFirefox = true;
            }
            if (isFirefox)
            {
                double version = 0;
                double.TryParse(request.Browser.Version, out version);
                if (version >= 8)
                {
                    response.AddHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\";");
                }
                else
                {
                    response.AddHeader("Content-Disposition", "attachment; filename*=\"utf8''" +
                        HttpUtility.UrlEncode(fileName, headerEncoding).Replace("+", "%20") + "\";");
                }
            }
            else
            {
                response.AddHeader("Content-Disposition", "attachment; filename=\"" +
                                          HttpUtility.UrlEncode(fileName, headerEncoding).Replace("+", "%20") + "\";");
            }
            if (fileSize.HasValue && fileSize.Value > 0)
            {
                response.AddHeader("Content-Length", fileSize.ToString());
            }
        }
    }
}

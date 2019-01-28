<%@ Page Title="" Language="C#" MasterPageFile="~/Views/Layout.Master" Inherits="System.Web.Mvc.ViewPage" %>
<asp:Content ID="Content1"
     ContentPlaceHolderID="MainContent"
     runat="server">
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>上传</title></head>
<body>
    <form action="/Route/SaveRoute" method="POST"  enctype="multipart/form-data">
  <p>路线类型：<input type="radio" name="s" value="1" checked="checked"></input> 高铁
<input type="radio" name="s" value="0" ></input>地铁 </p>
  <p>名称: <input type="text" name="Name" value="abc" /></p>
  <p>上传文件: <input type="file" name="File" /></p>
  <input type="submit" value="保存" />
</form>
</body>
</html>
    </asp:Content>

<%@ Page Title="" Language="C#" MasterPageFile="~/Views/Layout.Master" Inherits="System.Web.Mvc.ViewPage" %>
<asp:Content runat="server" ContentPlaceHolderID="TitleContent">管理系统</asp:Content>
<asp:Content ID="Content1"
    ContentPlaceHolderID="MainContent"
    runat="server">
    <script type="text/javascript">
        (function () {
            Ext.onReady(function () {
                RM._Account = 'admin';
                Ext.create('RM.Home.Viewport');
            });
        })();
    </script>
</asp:Content>

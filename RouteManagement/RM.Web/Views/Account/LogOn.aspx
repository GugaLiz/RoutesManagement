<%@ Page Title="" Language="C#" MasterPageFile="~/Views/Layout.Master" Inherits="System.Web.Mvc.ViewPage" %>
<asp:Content runat="server" ContentPlaceHolderID="TitleContent">管理系统-登录</asp:Content>
<asp:Content ID="Content1"
    ContentPlaceHolderID="MainContent"
    runat="server">
    <script type="text/javascript">
        (function () {
            Ext.onReady(function () {
                var win = Ext.create('RM.Login.LoginWindow', {
                    listeners: {
                        loginsuccess: function (comp, pageUser, resp) {
                            window.location.href = '/';
                        }
                    }
                });
                win.show();
            });
        })();
    </script>
</asp:Content>

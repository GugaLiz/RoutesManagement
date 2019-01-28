var RM = RM || {};
var F = F || {};
RM.buildVersion = '';
RM.UrlPath = '';
RM.Language = Ext.util.Cookies.get("F_Language");

RM.setLanguage = function (lang) {
    if (lang != 'en' && lang != 'zh-CN' && lang != 'zh-TW') {
        lang = 'en';
    }
    var curDate = new Date();
    curDate.setDate(curDate.getDate() + 30);
    Ext.util.Cookies.set('F_Language', lang, curDate);
};

if (Ext.isEmpty(RM.Language)) {
    var lang = navigator.browserLanguage ? navigator.browserLanguage : navigator.language;
    if (lang != 'en' && lang != 'zh-CN' && lang != 'zh-TW') {
        lang = 'en';
    }
    RM.Language = lang;
    RM.setLanguage(lang);
}

RM.JSLN = RM.Language.toString().replace('-', '_');
RM.Resources = function (name) {
    document.write('<script src="' + RM.UrlPath + '/Content/Script/Resources/' + name + '-' + RM.JSLN + '.js?_v=' + RM.buildVersion + '" type="text/javascript"><\/script>');
}
F.Resources = RM.Resources;

RM.Url = function (url) {
    return RM.UrlPath +url;
};

RM.Debug = function (on) {
    if (localStorage) {
        var key = '__DEBUG';
        if (typeof on == 'undefined') {
            return localStorage.getItem(key) == '1';
        } else {
            localStorage.setItem(key, on ? 1 : 0);
            return on ? true : false;
        }
    }
    return false;
};

RM.ScriptLoad = function (name) {
    document.write('<script src="' + RM.UrlPath + name + '?_v=' + RM.buildVersion + '" type="text/javascript"><\/script>');
};

RM.UrlParas = function (n) {
    //123.aspx?a=12&b=beijing
    var url = location.href;
    var data = {};
    var keed = n ? n : '#';
    if (url.indexOf(keed) > -1) {
        url = url.substring(url.indexOf(keed) + 1, url.length);
        var paraStr = url.split("&");
        for (var i = 0, len = paraStr.length; i < len; i++) {
            var j = paraStr[i];
            var key = j.substring(0, j.indexOf("=")).toLowerCase();
            var val = j.substring(j.indexOf("=") + 1, j.length);
            val = decodeURI(val);
            data[key] = val;
        }
    }
    return data;
};


RM._cssElements = {};
RM.CssLoad = function (urls) {
    var head = Ext.Loader.documentHead || document.getElementsByTagName('head')[0];
    if (!Ext.isArray(urls)) {
        urls = [urls];
    }
    Ext.each(urls, function (url) {
        if (RM._cssElements[url]) {
        } else {
            var style = document.createElement('link');
            style.rel = 'stylesheet';
            style.type = 'text/css';
            style.href = RM.UrlPath + url + '?_v=' + RM.buildVersion;
            head.appendChild(style);
            RM._cssElements[url] = true;
        }
    });
};


RM._jsElements = {};
RM.loadScripts = function (options) {
    var config = Ext.Loader.getConfig(),
            isString = typeof options == 'string',
            isArray = isString ? false : Ext.isArray(options.url),
            urls = isString ? [options] : (isArray ? options.url : [options.url]),
            onCacheLoad = !isString && options.onCacheLoad,
            onError = !isString && options.onError,
            parallel = !isString && options.parallel,
            onLoad = !isString && options.onLoad,
            scope = !isString && options.scope;
    var total = urls.length;
    var done = 0;
    var error = false;
    var fireError = true;
    if (parallel) { //并行加载
        var onScriptError = function () {
            Ext.Loader.numPendingFiles--;
            Ext.Loader.scriptsLoading--;
            error = true;

            if (Ext.Loader.numPendingFiles + Ext.Loader.scriptsLoading === 0) {
                Ext.Loader.refreshQueue();
            }
            if (onError && error && fireError) {
                fireError = false;
                onError.call(scope, "Failed loading '" + url + "', please verify that the file exists");
            }
        },
                onScriptLoad = function () {
                    Ext.Loader.numPendingFiles--;
                    Ext.Loader.scriptsLoading--;
                    done = done + 1;
                    if (onLoad && done == total) {
                        onLoad.call(scope);
                    }
                    if (onError && error && fireError) {
                        fireError = false;
                        onError.call(scope, "Failed loading '" + url + "', please verify that the file exists");
                    }

                    if (Ext.Loader.numPendingFiles + Ext.Loader.scriptsLoading === 0) {
                        Ext.Loader.refreshQueue();
                    }
                },
                src;
        Ext.each(urls, function (url) {
            if (onError && error && fireError) {
                fireError = false;
                onError.call(scope, "Failed loading '" + url + "', please verify that the file exists");
            }
            if (RM._jsElements[url]) {
                done = done + 1;
                if (onCacheLoad && done == total) {
                    onCacheLoad.call(scope);
                }
                return;
            }
            Ext.Loader.isLoading = true;
            Ext.Loader.numPendingFiles++;
            Ext.Loader.scriptsLoading++;

            if (scope) { scope.url_src = url } else { scope = { url_src: url }; };
            src = RM.UrlPath + url + '?_v=' + RM.buildVersion;
            RM._jsElements[url] = Ext.Loader.loadScript({
                url: src,
                onLoad: onScriptLoad,
                onError: onScriptError,
                scope: scope
            });
        });
    } else {
        var idx = 0;
        //var url = urls[idx];
        var onScriptLoad = function () {
            idx = idx + 1;
            done = done + 1;
            if (done == total) {
                if (onLoad) {
                    onLoad.call(scope);
                }
                return;
            }
            loadIt(urls[idx]);
        }
        var onScriptError = function (opt) {
            if (onError) {
                onError.call(scope, "Failed loading '" + opt.userScope.url_src + "', please verify that the file exists");
            }
        }
        var loadIt = function (url) {
            if (RM._jsElements[url]) {
                done = done + 1;
                idx = idx + 1;
                if (done == total) {
                    if (onCacheLoad) {
                        onCacheLoad.call(scope);
                    }
                    return;
                }
                loadIt(urls[idx]);
            }
            //src = url;
            if (scope) { scope.url_src = url } else { scope = { url_src: url }; };
            src = RM.UrlPath + url + '?_v=' + RM.buildVersion;
            RM._jsElements[url] = Ext.Loader.loadScript({
                url: src,
                onLoad: onScriptLoad,
                onError: onScriptError,
                scope: scope
            });
        };
        loadIt(urls[idx]);
    }
};

//加载后eval前，加载JS文件
Ext.Class.registerPreprocessor('jsLoader', function (cls, data, hooks, continueFn) {
    var me = this;
    if (data) {
        if (data.loadCSS) {
            RM.CssLoad(data.loadCSS);
        }
        if (data.overrideCSS) {
            alert(data.overrideCSS);
            RM.CssLoad(data.overrideCSS);
        }
        if (data.loadJS) {
            var load = function () {
                continueFn.call(me, cls, data, hooks);
            };
            RM.loadScripts({
                url: data.loadJS,
                onCacheLoad: load,
                onLoad: load,
                onError: function (opt) {
                    Ext.MessageBox.show({
                        title: 'Error',
                        message: opt,
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.ERROR
                    });
                    return false;
                }
            });
            return false;
        }
    } else {
        continueFn.call(me, cls, data, hooks);
    }
}, true, 'last', 'className');


//加载增加版本号
Ext.Loader.getPath_Old = Ext.Loader.getPath;
Ext.override(Ext.Loader, {
    getPath: function (className) { //这个函数针对的就是配置里边的
        var path = Ext.Loader.getPath_Old(className);
        if (!this.config.disableCaching) {
            path = path + '?_v=' + RM.buildVersion;
        }
        return path;
    }
});

//弹出错误信息对话框
RM.showError = function (message, title, fn) {
    if (Ext.isEmpty(title)) {
        title = '错误';
    }
    Ext.MessageBox.show({
        title: title,
        msg: message,
        buttons: Ext.MessageBox.OK,
        icon: Ext.MessageBox.ERROR,
        fn: function (btn) {
            if (Ext.isFunction(fn)) {
                fn(btn);
            }
        }
    });
}

RM.downloadFile = function (url) {
    if (Ext.isEmpty(Ext.getDom('ifrmDownload'))) {
        Ext.getBody().insertFirst({
            tag: 'iframe',
            id: 'ifrmDownload',
            name: 'ifrmDownload',
            frameBorder: 0,
            style: 'display:none',
            onreadystatechange: "iframeDwonloadLoaded(this)",//响应IE
            onload: "iframeDwonloadLoaded(this)",//响应火狐
            title: '0'
        });
    }
    var frame = Ext.getDom('ifrmDownload');
    frame.src = url;
    frame.title = '0';
}

//下载失败的响应函数
function iframeDwonloadLoaded(obj) {
    var result = "";
    var doc = obj.contentWindow.document;
    if (Ext.isIE) {
        if (doc.readyState == "complete") {
            //complete在ie会触发两次，只需要处理一次就行了
            if (obj.title === "0") {
                obj.title = "1";
            }
            else {
                result = doc.body.innerHTML;
                obj.title = "0"
            }
        }
    }
    else {
        result = doc.body.innerHTML;
    }
    if (!Ext.isEmpty(result) && result !== "") {
        try {
            //返回的内容格式是{success:false,msg:""}处理
            var msg = Ext.JSON.decode(result);
            if (!Ext.isEmpty(msg.msg)) {
                RM.showError(msg.msg);
            }
            else
                if (!Ext.isEmpty(msg.data)) {
                    RM.showError(msg.data);
                }
        }
        catch (e) {
            //返回的内容是html格式
            var msg = doc.title;
            if (!Ext.isEmpty(msg)) {
                RM.showError(msg);
            }
        }
    }
}

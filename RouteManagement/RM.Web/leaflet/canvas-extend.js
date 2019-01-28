CanvasRenderingContext2D.prototype.DEG = Math.PI / 180;

CanvasRenderingContext2D.prototype.circleSite = function (x, y, radius, innerR, color, lineWidth) {

    var grad = this.createRadialGradient(x, y, 1, x, y, radius + radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(48,133,157,0.8)');

    var radius = radius;
    var innerRadius = innerR * 2;
    var beginAlpha1 = 0 * Math.PI / 180;
    var endAlpha1 = 90 * Math.PI / 180;

    //第一扇区
    this.beginPath();
    this.arc(x, y, radius, beginAlpha1, endAlpha1, false);
    this.lineTo(x + innerRadius * Math.cos(endAlpha1), y + innerRadius * Math.sin(endAlpha1));
    this.arc(x, y, innerRadius, endAlpha1, beginAlpha1, true);
    this.lineTo(x + radius, y);
    this.closePath();
    this.fillStyle = grad;
    this.fill();
    this.lineWidth = 1;
    this.strokeStyle = 'rgba(81,217,181,0.75)';
    this.stroke();
    //第二扇区
    var beginAlpha2 = 120 * this.DEG, endAlpha2 = 210 * this.DEG;
    this.beginPath();
    this.arc(x, y, radius, beginAlpha2, endAlpha2, false);
    this.lineTo(x + innerRadius * Math.cos(endAlpha2), y + innerRadius * Math.sin(endAlpha2));
    this.arc(x, y, innerRadius, endAlpha2, beginAlpha2, true);
    this.closePath();
    this.fill();
    this.stroke();
    //第三扇区
    var beginAlpha3 = 240 * this.DEG, endAlpha3 = 330 * this.DEG;
    this.beginPath();
    this.arc(x, y, radius, beginAlpha3, endAlpha3, false);
    this.lineTo(x + innerRadius * Math.cos(endAlpha3), y + innerRadius * Math.sin(endAlpha3));
    this.arc(x, y, innerRadius, endAlpha3, beginAlpha3, true);
    this.closePath();
    this.fill();
    this.stroke();
    //画中心点
    this.beginPath();
    this.arc(x, y, innerR, 0, Math.PI * 2, false);
    this.closePath();
    this.lineWidth = 0.5;
    this.strokeStyle = 'rgba(0,0,0,1)';
    this.fillStyle = 'rgb(0,156,0)';
    this.fill();

    this.stroke();

    return this;
}

CanvasRenderingContext2D.prototype.circle = function (x, y, raidus, color) {
    this.beginPath();
    this.arc(x, y, raidus, 0, Math.PI * 2, false);
    this.closePath();
    this.fillStyle = color;// 'rgb(0,156,0)';
    this.fill();
}

CanvasRenderingContext2D.prototype.sector = function (x, y, radius, innerR,
    sDeg, eDeg, color, lineWidth) {


    //第二种基站画法
    var grad = this.createRadialGradient(x, y, 1, x, y, radius + radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(48,133,157,0.8)');
    this.beginPath();

    this.moveTo(x, y);
    this.arc(x, y, radius, this.DEG * sDeg, this.DEG * eDeg, false);
    this.lineTo(x, y);
    this.strokeStyle = "rgba(81,217,181,0.75)";
    this.lineWidth = 1;
    this.fillStyle = grad;
    this.stroke();
    this.fill();
    this.closePath();
    this.beginPath();
    this.arc(x, y, innerR, 0, Math.PI * 2, false);
    this.fillStyle = "rgb(0,156,0)";
    this.lineWidth = 1.5;
    this.strokeStyle = "rgba(0,0,0,1)";
    this.stroke();
    this.fill();
    this.closePath();

    return this;
}
CanvasRenderingContext2D.prototype.ssv_sector = function (x, y, radius, innerR,
    sDeg, eDeg, color) {


    //第二种基站画法
    var grad = this.createRadialGradient(x, y, 1, x, y, radius + radius);
    grad.addColorStop(0, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(48,133,157,0.8)');
    this.beginPath();

    this.moveTo(x, y);
    this.arc(x, y, radius, this.DEG * sDeg, this.DEG * eDeg, false);
    this.lineTo(x, y);
    this.strokeStyle = "rgba(81,217,181,0.75)";
    this.lineWidth = 1;
    if (color) {
        this.fillStyle = 'rgb(0,156,0)';
    } else {
        this.fillStyle = grad;
    }
    this.stroke();
    this.fill();
    this.closePath();
    this.beginPath();
    this.arc(x, y, innerR, 0, Math.PI * 2, false);
    this.fillStyle = "rgb(0,156,0)";
    this.lineWidth = 1.5;
    this.strokeStyle = "rgba(0,0,0,1)";
    this.stroke();
    this.fill();
    this.closePath();

    return this;
}

CanvasRenderingContext2D.prototype.getPixel = function (x, y) {
    var data = this.getImageData(x, y, 1, 1);
    return data.data;

}

CanvasRenderingContext2D.prototype.hasPixel = function (x, y) {
    var pixel = this.getImageData(x, y, 1, 1);
    if (pixel) {
        var array = pixel.data;
        if (array[3] == 0) {
            return false;
        } else {
            return (array[0] + array[1] + array[2]) > 0;
        }

    }

    return false; // data.data;

}


CanvasRenderingContext2D.prototype.site = function (obj) {
    var cells = obj.cells || [], len = cells.length;
    var lat = obj.lat, lng = obj.lng;
    for (var i = 0; i < len; i++) {
        var cell = cells[i];

    }

}

CanvasRenderingContext2D.prototype.line = function (x1, y1, x2, y2, strokeStyle, lineWidth, dottedLine, dashLen) {

    this.beginPath();
    //this.fillStyle = 'red';
    this.strokeStyle = strokeStyle;
    this.lineWidth = lineWidth;

    if (dottedLine) {
        dashLen = dashLen === undefined ? 5 : dashLen;
        var beveling = getBeveling(x2 - x1, y2 - y1);
        var num = Math.floor(beveling / dashLen);
        for (var i = 0 ; i < num; i++) {
            this[i % 2 == 0 ? 'moveTo' : 'lineTo'](x1 + (x2 - x1) / num * i, y1 + (y2 - y1) / num * i);
        }
    }
    else {
        this.moveTo(x1, y1);
        this.lineTo(x2, y2);
    }
    this.stroke();
    this.closePath();

    return this;
}

//求斜边长度  
function getBeveling(x, y) {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}
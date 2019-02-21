var el = document.getElementById("canvas");
console.log(el);
var ctx = el.getContext("2d");
var dpr = window.devicePixelRatio || 1;
var pi = Math.PI;
var size = 2.3;

var apotema = 40 * dpr;
var points = random(3, 5);
var radius = apotema / Math.sqrt(1 - Math.pow(Math.sin(pi / points), 3)) * dpr;
console.log("radius = " + radius);

// define el tiempo del swing
var time = 60;

//tamaño del canvas
var h = radius * size * dpr;
var w = radius * size * dpr;
var center = {
    x: w / 2 * dpr,
    y: h / 2 * dpr };

var circles = [];

//rango de movimiento de los ejes
var rangeMin = 0;
var rangeMax = 2;

// --------------------------------------------------------------------------- //
// random
function random(num1, num2) {
    var max = Math.max(num1, num2);
    var min = Math.min(num1, num2);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var setDateTime = function setDateTime(date, str) {
    var sp = str.split(":");
    date.setHours(parseInt(sp[0], 10));
    date.setMinutes(parseInt(sp[1], 10));
    date.setSeconds(parseInt(sp[2], 10));
    return date;
};

var mouseY = 0;
var tick = 1;

// defino los colores de las gradientes
var gradient1 = ctx.createLinearGradient(0, 0, w, 0);
gradient1.addColorStop(0, "#850073");
gradient1.addColorStop(1, "#f10091");

var gradient2 = ctx.createLinearGradient(0, 0, w, 0);
gradient2.addColorStop(0, "#005b5f");
gradient2.addColorStop(1, "#00c1d5");

var gradient3 = ctx.createLinearGradient(0, 0, w, 0);
gradient3.addColorStop(0, "#9795f0");
gradient3.addColorStop(1, "#9be15d");

var gradient4 = ctx.createLinearGradient(0, 0, w, 0);
gradient4.addColorStop(0, "#ff7a00");
gradient4.addColorStop(1, "#f2d163");

var gradient5 = ctx.createLinearGradient(0, 0, w, 0);
gradient5.addColorStop(0, "#8d734a");
gradient5.addColorStop(1, "#f2d163");

var gradients = [gradient1, gradient2, gradient3, gradient4, gradient5];

window.addEventListener("mousemove", handleMove, true);

function handleMove(event) {
    mouseY = event.clientY;
}

ctx.scale(dpr, dpr);

el.width = w * dpr;
el.height = h * dpr;
el.style.width = w + "px";
el.style.height = h + "px";

// Crea los puntos del "wubbly"

for (var idx = 0; idx <= gradients.length - 1; idx++) {

    var swingpoints = [];
    var radian = 0;

    for (var i = 0; i < points; i++) {
        radian = pi * 2 / points * i;
        var ptX = center.x + radius * Math.cos(radian);
        var ptY = center.y + radius * Math.sin(radian);

        swingpoints.push({
            x: ptX,
            y: ptY,
            radian: radian,
            range: random(rangeMin, rangeMax),
            phase: 0 });

    }

    circles.push(swingpoints);

}

// --------------------------------------------------------------------------- //
// swingCircle

function swingCircle() {
    ctx.clearRect(0, 0, w * dpr, h * dpr);

    ctx.globalAlpha = 1;
    // ctx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = "screen";

    for (var k = 0; k < circles.length; k++) {
        var _swingpoints = circles[k];

        for (var i = 0; i < _swingpoints.length; i++) {
            _swingpoints[i].phase += random(1, 10) * -0.01;

            var phase = 4 * Math.sin(tick / time);

            if (mouseY !== 0) {
                phase = mouseY / 200 + 1;
            }

            var r = radius + _swingpoints[i].range * phase * Math.sin(_swingpoints[i].phase) - rangeMax;

            _swingpoints[i].radian += pi / 360;

            var ptX = center.x + r * Math.cos(_swingpoints[i].radian);
            var ptY = center.y + r * Math.sin(_swingpoints[i].radian);

            _swingpoints[i] = {
                x: ptX,
                y: ptY,
                radian: _swingpoints[i].radian,
                range: _swingpoints[i].range,
                phase: _swingpoints[i].phase };

        }

        var fill = gradients[k];

        drawCurve(_swingpoints, fill);

    }

    tick++;

    requestAnimationFrame(swingCircle);
}

requestAnimationFrame(swingCircle);


// --------------------------------------------------------------------------- //
// drawCurve

function drawCurve(pts, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(
        (pts[cycle(-1, points)].x + pts[0].x) / 2,
        (pts[cycle(-1, points)].y + pts[0].y) / 2);
    for (var i = 0; i < pts.length; i++) {

        ctx.quadraticCurveTo(
            pts[i].x,
            pts[i].y,
            (pts[i].x + pts[cycle(i + 1, points)].x) / 2,
            (pts[i].y + pts[cycle(i + 1, points)].y) / 2);
    }

    ctx.closePath();
    ctx.fill();

}

// --------------------------------------------------------------------------- //
// cycle
function cycle(num1, num2) {
    return (num1 % num2 + num2) % num2;
}



// --------------------------------------------------------------------------- //

function getEyesArray() {var asleep = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    var c = new Date().getTime();
    var start = setDateTime(new Date(), "06:00:00");
    var end = setDateTime(new Date(), "22:30:00");

    if (c > start.getTime() && c < end.getTime() && !asleep) {
        return ["O", "O", "O", "O", "-", "O", "O"];
    } else {
        return ["U", "U", "U", "U", "-", "U", "U"];
    }
}

(function () {
    var cont = 0;
    function changeFace() {
        var eyesArray = getEyesArray(random(0, 1000) % 333 === 0);
        setTimeout(function () {var _iteratorNormalCompletion = true;var _didIteratorError = false;var _iteratorError = undefined;try {
            for (var _iterator = document.querySelectorAll(".eye")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {var span = _step.value;
                span.innerText = eyesArray[cont];
            }} catch (err) {_didIteratorError = true;_iteratorError = err;} finally {try {if (!_iteratorNormalCompletion && _iterator.return) {_iterator.return();}} finally {if (_didIteratorError) {throw _iteratorError;}}}
        cont = (cont + 1) % eyesArray.length;
        changeFace();
        }, random(100, 350));
    }

    changeFace();
})();
const express = require("express");
const bodyParser = require('body-parser');
const fs = require("fs").promises;
const obniz = require("obniz");

//express設定
const app = express();
app.set("port", process.env.PORT || 2828);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
//express 設定ここまで

//測定定数
const heightPerFloor = 4.07;
const pressurePerFloor = 52;
const basePressure = 100723;
const averageSampleNum = 5;
const heightOffset = 0.0;
const floorOffset = 1;
//測定定数ここまで

//deviceクラス
let devices = [];
class Device {
    constructor(name, gps, pressure) {
        this.name = name;
        this.gps = gps;
        this.pressure = pressure;
        this.pOffset = 0;
        this.gOffset = { x: 0, y: 0 };
    }
    get pressure() {
        return this._pressures.length != 0 ? this._pressures[this._pressures.length - 1] + this.pOffset : -1;
    };
    set pressure(val) {
        if (!this._pressures) {
            this._pressures = [];
        }
        this._pressures.push(val);
    }
    get lawPressure() {
        return this._pressures.length != 0 ? this._pressures[this._pressures.length - 1] : -1;
    }
    get gps() {
        if (this._gpses.length != 0) {
            return { x: this._gpses[this._gpses.length - 1].x + this.gOffset.x, y: this._gpses[this._gpses.length - 1].y + this.gOffset.y };
        } else {
            return -1;
        }
    };
    set gps(val) {
        if (!this._gpses) {
            this._gpses = [];
        }
        this._gpses.push(val);
    }
    get lawGps() {
        return this._gpses.length != 0 ? this._gpses[this._gpses.length - 1] : -1;
    };
    get pressures() {
        return this._pressures;
    };
    get gpses() {
        return this._gpses;
    };
}
//

//データ保持
let child = new Device("child", { x: 0, y: 0 }, 0);
let parent = new Device("parent", { x: 0, y: 0 }, 0);
let base = new Device("base", { x: 3975753.9947935943, y:12632266.937031535 }, basePressure);
//

//Utility
//p1:ユーザー保持部分の気圧 p0:baseの気圧 k: 定数（heightPerFloor / pressurePerFloor）
function getHeight(p1, p0, k) {
    return (p0 - p1) * k;
}

//p1:ユーザー保持部分の気圧 p0:baseの気圧 pd: 定数
function getFloor(p1, p0, pd) {
    return Math.floor((p0 - p1 + heightOffset) / pd + 1) + floorOffset;
}

function getCoord(device) {
    if (device != "base" && device != "child" && device != "parent") {
        throw Error("Device Not Found");
    }
    let pressure;
    let gps;
    switch (device) {
        case "child":
            pressure = child.pressure;
            gps = child.gps;
            break;
        case "parent":
            pressure = parent.pressure;
            gps = parent.gps;
            break;
        case "base":
            pressure = base.pressure;
            gps = base.gps;
            break;
        default:
            break;
    }
    return [
        gps.x - base.gps.x,
        gps.y - base.gps.y,
        getHeight(pressure, base.pressure, heightPerFloor / pressurePerFloor)
    ];
}

function getCoordAverage(device) {
    if (device != "base" && device != "child" && device != "parent") {
        throw Error("Device Not Found");
    }
    let item;

    switch (device) {
        case "child":
            item = child;
            break;
        case "parent":
            item = parent;
            break;
        case "base":
            item = base;
            break;
        default:
            break;
    }
    let pressures = item.pressures;
    let gpses = item.gpses;
    gpses.x = gpses.map(coord => coord.x);
    gpses.y = gpses.map(coord => coord.y);
    return [
        averageArray(gpses.x, averageSampleNum) + item.gOffset.x - averageArray(base.gpses.map(x => x.x), averageSampleNum),
        averageArray(gpses.y, averageSampleNum) + item.gOffset.y - averageArray(base.gpses.map(x => x.y), averageSampleNum),
        getHeight(averageArray(pressures, averageSampleNum) + item.pOffset, averageArray(base.pressures, averageSampleNum), heightPerFloor / pressurePerFloor)
    ];
}

function averageArray(arr, number) {
    arr = arr.slice(arr.length - number);
    let res = arr.reduce((pre, curr, i) => {
        return pre + curr;
    }, 0) / arr.length;
    return res;
}
//Utilityここまで

//初期化
(async () => {
    let init = JSON.parse(await fs.readFile("./init.json", "utf8"));
    console.log(init);
    if (init) {
        parent.pOffset = init.parent.pOffset;
        parent.gOffset = init.parent.gOffset;
        child.pOffset = init.child.pOffset;
        child.gOffset = init.child.gOffset;
    }
})();
//

//エントリポイント

app.get("/pressure/:device", (req, res, next) => {
    if (req.params.device != "base" && req.params.device != "parent" && req.params.device != "child") {
        res.json({ "status": "err" });
        return next();
    }
    let pressure;
    switch (req.params.device) {
        case "parent":
            pressure = parent.pressure;
            break;
        case "child":
            pressure = child.pressure;
            break;
        case "base":
            pressure = base.pressure;
            break;
        default:
            break;
    }
    if (pressure == -1) {
        res.json({ "status": "uninit" });
        return next();
    }
    res.json({
        "status": "ok",
        "device": req.params.device,
        "pressure": pressure
    });
});

app.post("/pressure", (req, res, next) => {
    if (req.body.device != "base" && req.body.device != "parent" && req.body.device != "child") {
        res.json({ "status": "err" });
        return next();
    } else if (!req.body.pressure) {
        res.json({ "status": "err" });
        return next();
    }

    switch (req.body.device) {
        case "base":
            base.pressure = Number(req.body.pressure);
            break;
        case "parent":
            parent.pressure = Number(req.body.pressure);
            break;
        case "child":
            child.pressure = Number(req.body.pressure);
            break;
        default:
            break;
    }
    res.json({ "status": "ok" });
});

//{device: "base" || "parent" || "child"}
app.get("/height/:device", (req, res, next) => {
    if (req.params.device != "base" && req.params.device != "parent" && req.params.device != "child") {
        res.json({ "status": "err" });
        return next();
    }
    let pressure;
    switch (req.params.device) {
        case "parent":
            pressure = parent.pressure;
            break;
        case "child":
            pressure = child.pressure;
            break;
        case "base":
            pressure = base.pressure;
            break;
        default:
            break;
    }
    if (pressure == -1) {
        res.json({ "status": "uninit" });
        return next();
    }
    let height = getHeight(pressure, base.pressure, heightPerFloor / pressurePerFloor);
    res.json({
        "status": "ok",
        "device": req.params.device,
        "height": height
    });
});

//{device: "base" || "parent" || "child"}
app.get("/floor/:device", (req, res, next) => {
    if (req.params.device != "base" && req.params.device != "parent" && req.params.device != "child") {
        res.json({ "status": "err" });
        return next();
    }
    let pressure;
    switch (req.params.device) {
        case "parent":
            pressure = parent.pressure;
            break;
        case "child":
            pressure = child.pressure;
            break;
        case "base":
            pressure = base.pressure;
            break;
        default:
            break;
    }
    if (pressure == -1) {
        res.json({ "status": "uninit" });
        return next();
    }
    let floor = getFloor(pressure, base.pressure, pressurePerFloor);
    res.json({
        "status": "ok",
        "device": req.params.device,
        "floor": floor
    });
});

app.get("/gps/:device", (req, res, next) => {
    if (req.params.device != "base" && req.params.device != "parent" && req.params.device != "child") {
        res.json({ "status": "err" });
        return next();
    } else if (req.params.device == req.params.to) {
        res.json({ "status": "err" });
        return next();
    }
    let gps;
    switch (req.params.device) {
        case "parent":
            gps = parent.gps;
            break;
        case "child":
            gps = child.gps;
            break;
        case "base":
            gps = base.gps;
            break;
        default:
            break;
    }
    if (gps == -1) {
        res.json({ "status": "uninit" });
        return next();
    }
    res.json({
        "status": "ok",
        "device": req.params.device,
        "gps": { x: gps.x - base.gps.x, y: gps.y - base.gps.y }
    });
});

//{device: "base" || "parent" || "child", gps: {x: Number, y: Number}}
app.post("/gps", (req, res, next) => {
    if (req.body.device != "base" && req.body.device != "parent" && req.body.device != "child") {
        res.json({ "status": "err" });
        return next();
    } else if (!req.body.gps) {
        res.json({ "status": "err" });
        return next();
    } else if (req.body.gps.x == 0 && req.body.gps.y == 0) {
        res.json({ "status": "uninit" });
        return next();
    }
    switch (req.body.device) {
        case "base":
            base.gps = req.body.gps;
            break;
        case "parent":
            parent.gps = req.body.gps;
            break;
        case "child":
            child.gps = req.body.gps;
            break;
        default:
            break;
    }
    res.json({ "status": "ok" });
});

//{device: "base" || "parent" || "child", gps: {x: Number, y: Number}}
app.get("/coord/:device", (req, res, next) => {
    if (req.params.device != "base" && req.params.device != "parent" && req.params.device != "child") {
        res.json({ "status": "err" });
        return next();
    }
    res.json({ "status": "ok", "device": req.params.device, "coord": getCoord(req.params.device) });
});

//合わせる対象の設定を可能にしたい
app.get("/init", (req, res, next) => {
    parent.pOffset = base.lawPressure - parent.lawPressure;
    child.pOffset = base.lawPressure - child.lawPressure;
    parent.gOffset = { x: base.lawGps.x - parent.lawGps.x, y: base.lawGps.y - parent.lawGps.y };
    child.gOffset = { x: base.lawGps.x - child.lawGps.x, y: base.lawGps.y - child.lawGps.y };

    res.json({
        "status": "initialized",
        "parent": { pOffset: parent.pOffset, gOffset: parent.gOffset },
        "child": { pOffset: child.pOffset, gOffset: child.gOffset }
    });
    (async () => {
        await fs.writeFile("./init.json", JSON.stringify({ parent: { pOffset: parent.pOffset, gOffset: parent.gOffset }, child: { pOffset: child.pOffset, gOffset: child.gOffset } }));
    })();
});

app.get("/gpsinit", (req, res, next) => {
    parent.gOffset = { x: base.lawGps.x - parent.lawGps.x, y: base.lawGps.y - parent.lawGps.y };
    child.gOffset = { x: base.lawGps.x - child.lawGps.x, y: base.lawGps.y - child.lawGps.y };

    res.json({
        "status": "initialized",
        "parent": { pOffset: parent.pOffset, gOffset: parent.gOffset },
        "child": { pOffset: child.pOffset, gOffset: child.gOffset }
    });
    (async () => {
        await fs.writeFile("./init.json", JSON.stringify({ parent: { pOffset: parent.pOffset, gOffset: parent.gOffset }, child: { pOffset: child.pOffset, gOffset: child.gOffset } }));
    })();
});

//親からどちら側にいるかを調べられるようにしたい
//diffの絶対値
app.get("/diff/:from-:to", (req, res, next) => {
    if (req.params.from != "base" && req.params.from != "parent" && req.params.from != "child" && req.params.to != "base" && req.params.to != "parent" && req.params.to != "child") {
        res.json({ "status": "err" });
        return next();
    }
    let from = getCoord(req.params.from);
    let to = getCoord(req.params.to);

    res.json({ "status": "ok", "diff": [from[0] - to[0], from[1] - to[1], from[2] - to[2]] });
});

app.get("/knocker/:switch", (req, res, next) => {

})

app.listen(app.get("port"), () => {
    console.log("Listening port: " + app.get("port"));
});
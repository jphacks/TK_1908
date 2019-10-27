function rand() {
    return Math.random() * 100;
}

let parentX, parentY, parentZ, parentFloor;
let childX, childY, childZ, childFloor;
let height;


var parent = {
    opacity: 0.5,//点とか線の透明度
    color: 'rgba(255,127,80,0.7)',
    name: 'parent',
    type: 'scatter3d',
    x: [parentX],
    y: [parentY],
    z: [parentZ],
    scene: "scene1"
};

var child = {
    opacity: 0.5,//点とか線の透明度
    color: 'rgba(0,127,80,0.7)',
    name: 'child',
    type: 'scatter3d',
    x: [childX],
    y: [childY],
    z: [childZ],
    scene: "scene1"
};

var layout = {
    scene1: {
      domain: {
         x: [0.0, 10],
         y: [0.0, 10]
     }  
    },
    height: 600,
    margin: {
    l: 10,
    r: 10,
    b: 10,
    t: 10,
    pad: 0
    },
    xaxis: {range: [0, 100]},
    yaxis: {range: [0, 100]},
    zaxis: {range: [0, 100]}
}    
  
Plotly.plot('myDiv', [parent, child], layout, {showSendToCloud: true});

var cnt = 0;

var interval = setInterval(function () {
    var update = {
        x: [[parentX], [childX]],
        y: [[parentY], [childY]],
        z: [[parentZ], [childZ]],
    }
    Plotly.extendTraces('myDiv', update, [0, 1]);

    $("#floor").text("childFloor:  " + parentFloor + "階");

    if (++cnt === 10000) clearInterval(interval);
}, 3000);
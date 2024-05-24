var gates = [];
var gateTypes = [];
var inputs = [];
var outputs = [];
var drag = { type: "none" };
var size, size2;
var borders = {};
var place = { type: "none", n: [] };
var menu = 0;
var canvas;
var bottomElem;

function setup() {
  size = v(innerWidth, innerHeight);
  if (size.x < 350) size.x = 350;
  size2 = p5.Vector.div(size, 2);
  borders.top = 80;
  borders.side = 110;
  borders.bottom = 70;
  if (localStorage.getItem("gates")) {
    gateTypes = JSON.parse(localStorage.getItem("gates"));
  } else {
    gateTypes = [
      { name: "AND", col: "rgb(50,150,0)", col2: "rgb(40,130,0)", col3: "rgb(60,170,0)", inputs: [{ num: 2, name: "in" }], outputs: [{ num: 1, name: "out" }], fun: null },
      { name: "NOT", col: "rgb(200,50,0)", col2: "rgb(180,40,0)", col3: "rgb(220,60,0)", inputs: [{ num: 1, name: "in" }], outputs: [{ num: 1, name: "out" }], fun: null }
    ];
    localStorage.setItem("gates", JSON.stringify(gateTypes));
  }

  updateGates();
  createCanvas(size.x, size.y - borders.bottom);
  canvas = document.querySelector(".p5Canvas");
  bottomElem = document.querySelector("#bottom");

  let elem = document.createElement("button");
  elem.className = "gateType";
  elem.id = "createBtn";
  elem.innerHTML = "Create";
  elem.addEventListener("click", (ev) => {
    let name = prompt("name?");
    if (name) {
      let col = random() * 360;
      let col1 = hslToRgb(col, 0.5, 0.5);
      let col2 = hslToRgb(col, 0.5, 0.4);
      let col3 = hslToRgb(col, 0.5, 0.6);
      let getIn = (n) => {
        if (n.startsWith("input")) {
          return "i" + n.split("input")[1];
        } else if (n.startsWith("gate")) {
          let gi = n.split("gate")[1].split("-");
          let ii = gi[1];
          gi = gi[0];
          return "g" + gi + "-" + ii;
        }
      };
      gateTypes.push({
        name,
        col: `rgb(${col1[0]},${col1[1]},${col1[2]})`,
        col2: `rgb(${col2[0]},${col2[1]},${col2[2]})`,
        col3: `rgb(${col3[0]},${col3[1]},${col3[2]})`,
        //inputs: copyArray(new Array(inputs.length).fill({ num: 1, name: "in" })),
        //outputs: copyArray(new Array(outputs.length).fill({ num: 1, name: "out" })),
        inputs: [{ num: inputs.length, name: "in" }],
        outputs: [{ num: outputs.length, name: "out" }],
        fun: {
          gates: gates.map(e => {
            let n = { type: e.type, inputs: [], id: e.id };
            e.inputs.forEach((i) => {
              n.inputs.push(getIn(i.type));
            });
            return n;
          }), outputs: outputs.map(e => {
            return getIn(e.connect);
          })
        },
        edit: { gatePos: [], inputYPos: [], outputYPos: [] }
      });
      let g = JSON.parse(localStorage.getItem("gates"));
      g.push(gateTypes[gateTypes.length - 1]);
      localStorage.setItem("gates", JSON.stringify(g));
      updateGates();
    }
  });
  elem.style.setProperty("--col1", "rgb(85,85,85)");
  elem.style.setProperty("--col2", "rgb(65,65,65)");
  elem.style.setProperty("--col3", "rgb(100,100,100)");
  bottomElem.append(elem);

  gateTypes.forEach((e, i) => {
    let elem = document.createElement("button");
    elem.className = "gateType";
    elem.id = "gateType" + i;
    elem.innerHTML = e.name;
    elem.addEventListener("click", (ev) => {
      if (place.type == "none") {
        place.type = "gate";
        place.n = [];
      }
      place.n.push(i);
    });
    elem.style.setProperty("--col1", e.col);
    elem.style.setProperty("--col2", e.col2);
    elem.style.setProperty("--col3", e.col3);
    bottomElem.append(elem);
  });

  inputs.push({ ypos: 175, on: false });
  inputs.push({ ypos: 225, on: false });
  outputs.push({ ypos: 200, on: false, connect: "none" });
  outputs.push({ ypos: 300, on: false, connect: "none" });

  canvas.addEventListener("click", (ev) => {
    click(0, ev);
  });
  canvas.addEventListener("mousedown", (ev) => {
    let oldType = drag.type;
    inputs.forEach((e, i) => {
      let d = p5.Vector.sub(v(ev.clientX, ev.clientY), v(borders.side, e.ypos));
      if (d.x < -10 && d.x > -35 && d.y > -15 && d.y < 15) {
        drag = { type: "inputmove", i, pos: d };
      } else if (d.x > 10 && d.x < 35 && d.y > -15 && d.y < 15) {
        drag = { type: "dragwireinput", i, pos: v(130, e.ypos) };
      }
    });
    outputs.forEach((e, i) => {
      let d = p5.Vector.sub(v(ev.clientX, ev.clientY), v(size.x - borders.side, e.ypos));
      if (d.x > 10 && d.x < 35 && d.y > -15 && d.y < 15) {
        drag = { type: "outputmove", i, pos: d };
      }
    });
    gates.forEach((e, gi) => {
      let type = gateTypes[e.type];
      let i = -type.totalIn / 2 + 1;
      let i3 = 0;
      let closestDist = 100;
      let closestI = 0;
      type.outputs.forEach((n) => {
        for (let i2 = 0; i2 < n.num; i2++) {
          i += 0.5;
          let output = e.outputs[i3];
          let s = p5.Vector.sub(v(mouseX, mouseY), output.pos);
          if (dist(s.x, s.y, 0, 0) < closestDist) {
            closestDist = dist(s.x, s.y, 0, 0);
            closestI = i3;
          }
          i += 0.5;
          i3++;
        }
        i++;
      });
      if (closestDist <= 15) {
        drag = { type: "dragwiregate", i: gi, i2: closestI, pos: e.outputs[closestI].pos, id: e.id };
      }
    });
    /*if (drag.type == "none" && oldType == "none") {
      drag = { type: "box", p1: v(ev.clientX, ev.clientY), p2: v(ev.clientX, ev.clientY) };
    }*/
  });
  canvas.addEventListener("mousemove", (ev) => {
    if (drag.type == "inputmove") {
      inputs[drag.i].ypos = ev.clientY - drag.pos.y;
      if (inputs[drag.i].ypos < borders.top + 20) inputs[drag.i].ypos = borders.top + 20;
      if (inputs[drag.i].ypos > size.y - borders.bottom - 20) inputs[drag.i].ypos = size.y - borders.bottom - 20;
    }
    if (drag.type == "outputmove") {
      outputs[drag.i].ypos = ev.clientY - drag.pos.y;
      if (outputs[drag.i].ypos < borders.top + 20) outputs[drag.i].ypos = borders.top + 20;
      if (outputs[drag.i].ypos > size.y - borders.bottom - 20) outputs[drag.i].ypos = size.y - borders.bottom - 20;
    }
    if (drag.type == "box") {
      drag.p2 = v(ev.clientX, ev.clientY);
    }
  });
  canvas.addEventListener("mouseup", (ev) => {
    if (drag.type.startsWith("dragwire")) {
      gates.forEach((e) => {
        let type = gateTypes[e.type];
        let i = -type.totalIn / 2 + 1;
        let i3 = 0;
        let closestDist = 100;
        let closestI = -1;
        type.inputs.forEach((n) => {
          for (let i2 = 0; i2 < n.num; i2++) {
            i += 0.5;
            let input = e.inputs[i3];
            let s = p5.Vector.sub(v(ev.clientX, ev.clientY), input.pos);
            if (s.mag() < closestDist) {
              closestDist = s.mag();
              closestI = i3;
            }
            i += 0.5;
            i3++;
          }
          i++;
        });
        if (closestDist <= 15 && closestI >= 0) {
          if (drag.type == "dragwireinput") {
            e.inputs[closestI] = { type: "input" + drag.i, on: false };
          } else {
            e.inputs[closestI] = { type: "gate" + drag.id + "-" + drag.i2, on: false };
          }
        }
      });
      outputs.forEach((e) => {
        let d = p5.Vector.sub(v(ev.clientX, ev.clientY), v(size.x - borders.side, e.ypos));
        if (d.x < -10 && d.x > -35 && d.y > -15 && d.y < 15) {
          e.connect = drag.type == "dragwireinput" ? ("input" + drag.i) : ("gate" + drag.id + "-" + drag.i2);
        }
      });
    }
    setTimeout(() => drag = { type: "none" }, 10);
  });
  canvas.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    click(1, ev);
  });
}
function draw() {
  background(35);
  gates.forEach((e) => {
    drawGate(e);
    let type = gateTypes[e.type];
    let i = -type.totalIn / 2 + 1;
    let i3 = 0;
    type.inputs.forEach((n) => {
      for (let i2 = 0; i2 < n.num; i2++) {
        i += 0.5;
        let input = e.inputs[i3];
        if (input.type != "none") {
          if (input.type.startsWith("input")) {
            let s = inputs[input.type.split("input")[1]];
            if (typeof s == "undefined") input.type = "none";
            else {
              input.on = s.on;
            }
          } else if (input.type.startsWith("gate")) {
            let gi = input.type.split("gate")[1].split("-");
            let ii = gi[1];
            gi = gi[0];
            let g = gates.find(gt => gt.id == gi);
            if (typeof g == "undefined") input.type = "none";
            else {
              g = g.outputs[ii];
              if (typeof g == "undefined") input.type = "none";
              else {
                input.on = g.on;
              }
            }
          }
        }
        i += 0.5;
        i3++;
      }
      i++;
    });
    i = -type.totalOut / 2 + 1;
    i3 = 0;
    let ret = getReturn(e.type, e.inputs.map(n => n.on));
    e.outputs.forEach((o, oi) => {
      o.on = ret[oi];
    });
  });
  if (drag.type.includes("dragwire")) {
    stroke(0);
    strokeWeight(5);
    line(drag.pos.x, drag.pos.y, mouseX, mouseY);
  }
  if (drag.type == "box") {
    stroke("rgb(0,100,200)");
    strokeWeight(5);
    fill("rgba(0,100,200,0.5)");
    rect(drag.p1.x, drag.p1.y, drag.p2.x - drag.p1.x, drag.p2.y - drag.p1.y);
  }
  if (place.type == "gate") {
    place.n.forEach((e, i) => {
      drawGate({ pos: v(mouseX, mouseY + (i - place.n.length / 2 + 0.5) * 50), type: e, inputs: copyArray(new Array(100).fill({ on: false, type: "none" })), outputs: copyArray(new Array(100).fill({ on: false })) }, true);
    });
  }
  rectMode(CORNER);
  noStroke();
  fill(45);
  rect(0, 0, borders.side, size.y);
  rect(size.x, 0, -borders.side, size.y);
  rect(0, 0, size.x, borders.top);
  rect(0, size.y, size.x, -borders.bottom);
  stroke(55);
  strokeWeight(10);
  line(borders.side, borders.top, borders.side, size.y - borders.bottom);
  line(size.x - borders.side, borders.top, size.x - borders.side, size.y - borders.bottom);
  line(borders.side, borders.top, size.x - borders.side, borders.top);
  line(0, size.y - borders.bottom, size.x, size.y - borders.bottom);
  inputs.forEach((e) => {
    fill(e.on ? 210 : 50);
    stroke(e.on ? 180 : 70);
    strokeWeight(5);
    line(borders.side + 10, e.ypos, borders.side + 25, e.ypos);
    circle(borders.side, e.ypos, 25);
    circle(borders.side + 30, e.ypos, 10);
    stroke(70);
    line(borders.side - 30, e.ypos - 10, borders.side - 30, e.ypos + 10);
    line(borders.side - 21, e.ypos - 10, borders.side - 21, e.ypos + 10);
  });
  outputs.forEach((e) => {
    if (e.connect != "none") {
      stroke(e.on ? 220 : 0);
      if (e.connect.startsWith("input")) {
        let s = inputs[e.connect.split("input")[1]];
        if (typeof s == "undefined") e.connect = "none";
        else {
          e.on = s.on;
          line(borders.side + 30, s.ypos, size.x - borders.side - 30, e.ypos);
        }
      } else if (e.connect.startsWith("gate")) {
        let gi = e.connect.split("gate")[1].split("-");
        let ii = gi[1];
        gi = gi[0];
        let g = gates.find(gt => gt.id == gi);
        if (typeof g == "undefined") e.connect = "none";
        else {
          g = g.outputs[ii];
          if (typeof g == "undefined") e.connect = "none";
          else {
            e.on = g.on;
            line(g.pos.x, g.pos.y, size.x - borders.side - 30, e.ypos);
          }
        }
      }
    } else {
      e.on = false;
    }
    fill(e.on ? 210 : 50);
    stroke(e.on ? 180 : 70);
    strokeWeight(5);
    line(size.x - borders.side - 10, e.ypos, size.x - borders.side - 25, e.ypos);
    circle(size.x - borders.side, e.ypos, 25);
    circle(size.x - borders.side - 30, e.ypos, 10);
    stroke(70);
    line(size.x - borders.side + 30, e.ypos - 10, size.x - borders.side + 30, e.ypos + 10);
    line(size.x - borders.side + 21, e.ypos - 10, size.x - borders.side + 21, e.ypos + 10);
  });
}
function click(type, ev) {
  let run = drag.type == "none";
  inputs.forEach((e, i) => {
    if (run) {
      let s = p5.Vector.sub(v(ev.clientX, ev.clientY), v(borders.side, e.ypos));
      if (dist(s.x, s.y, 0, 0) < 15) {
        if (type == 0) {
          e.on = !e.on;
        } else if (type == 1) {
          inputs.splice(i, 1);
          i--;
        }
        run = false;
      }
    }
  });
  outputs.forEach((e, i) => {
    if (run) {
      let s = p5.Vector.sub(v(ev.clientX, ev.clientY), v(size.x - borders.side, e.ypos));
      if (dist(s.x, s.y, 0, 0) < 15) {
        if (type == 0) {
          // e.on = !e.on;
        } else if (type == 1) {
          outputs.splice(i, 1);
          i--;
        }
        run = false;
      }
    }
  });
  if (run && ev.clientX > borders.side - 40 && ev.clientX < borders.side && ev.clientY > borders.top + 20 && ev.clientY < size.y - borders.bottom - 20) {
    inputs.push({ ypos: ev.clientY, on: false });
  }
  if (run && ev.clientX < size.x - borders.side + 40 && ev.clientX > size.x - borders.side && ev.clientY > borders.top + 20 && ev.clientY < size.y - borders.bottom - 20) {
    outputs.push({ ypos: ev.clientY, on: false, connect: "none" });
  }
  if (run && type == 0) {
    if (ev.clientX > borders.side && ev.clientX < size.x - borders.side && ev.clientY > borders.top && ev.clientY < size.y - borders.bottom) {
      if (place.type == "gate") {
        place.n.forEach((e, i) => {
          createGate(e, v(ev.clientX, ev.clientY + (i - place.n.length / 2 + 0.5) * 50));
        });
      }
      place = { type: "none", n: [] };
      run = false;
    }
  }
  if (run && type == 1) {
    gates.forEach((e, i) => {
      let t = gateTypes[e.type];
      let s = p5.Vector.sub(v(ev.clientX, ev.clientY), e.pos);
      s.x = s.x / t.size.x;
      s.y = s.y / t.size.y;
      if (s.x > -0.5 && s.x < 0.5 && s.y > -0.5 && s.y < 0.5) {
        gates.splice(i, 1);
        gates.forEach((g) => {
          g.inputs.forEach((n) => {
            if (n.type.startsWith("gate") && n.type.split("gate")[1].split("-")[0] == i) {
              n.type = "none";
            }
          });
        });
        i--;
      }
    });
  }
}
window.addEventListener("resize", (ev) => {
  size = v(innerWidth, innerHeight);
  if (size.x < 350) size.x = 350;
  size2 = p5.Vector.div(size, 2);
  resizeCanvas(size.x, size.y - borders.bottom);
});
function createGate(type, pos) {
  gates.push({
    type,
    pos,
    inputs: copyArray(new Array(gateTypes[type].inputs.length > 1 ? gateTypes[type].inputs.reduce((a, b) => ({ num: a.num + b.num })).num : gateTypes[type].inputs[0].num).fill({ type: "none", on: false })),
    outputs: copyArray(new Array(gateTypes[type].outputs.length > 1 ? gateTypes[type].outputs.reduce((a, b) => ({ num: a.num + b.num })).num : gateTypes[type].outputs[0].num).fill({ on: false })),
    id: Math.floor(Math.random() * 10000 + new Date().getTime() - 1716000000000)
  });
}
function drawGate(e, place = false) {
  let type = gateTypes[e.type];
  rectMode(CENTER);
  if (place) {
    noStroke();
    fill("rgba(255,255,255,0.3)");
    rect(e.pos.x, e.pos.y, type.size.x + 30, type.size.y + 30, 10);
  }
  stroke(type.col2);
  strokeWeight(5);
  fill(type.col);
  rect(e.pos.x, e.pos.y, type.size.x, type.size.y, 5);
  fill(255);
  noStroke();
  textSize(30);
  textAlign(CENTER, CENTER);
  text(type.name, e.pos.x, e.pos.y);
  fill(0);
  stroke(0);
  strokeWeight(5);
  let i = -type.totalIn / 2 + 1;
  let i3 = 0;
  type.inputs.forEach((n) => {
    for (let i2 = 0; i2 < n.num; i2++) {
      i += 0.5;
      let input = e.inputs[i3];
      input.pos = v(e.pos.x - type.size.x / 2, e.pos.y + (i / type.totalIn) * type.size.y);
      stroke((input.type != "none" && input.on) ? 220 : 0);
      if (input.type != "none") {
        if (input.type.startsWith("input")) {
          let s = inputs[input.type.split("input")[1]];
          if (typeof s == "undefined") input.type = "none";
          else {
            line(borders.side + 30, s.ypos, input.pos.x, input.pos.y);
          }
        } else if (input.type.startsWith("gate")) {
          let gi = input.type.split("gate")[1].split("-");
          let ii = gi[1];
          gi = gi[0];
          let g = gates.find(gt => gt.id == gi);
          if (typeof g == "undefined") input.type = "none";
          else {
            g = g.outputs[ii];
            if (typeof g == "undefined") input.type = "none";
            else {
              line(g.pos.x, g.pos.y, input.pos.x, input.pos.y);
            }
          }
        }
      }
      circle(input.pos.x, input.pos.y, 5);
      i += 0.5;
      i3++;
    }
    i++;
  });
  i = -type.totalOut / 2 + 1;
  i3 = 0;
  type.outputs.forEach((n) => {
    for (let i2 = 0; i2 < n.num; i2++) {
      i += 0.5;
      let output = e.outputs[i3];
      output.pos = v(e.pos.x + type.size.x / 2, e.pos.y + (i / type.totalOut) * type.size.y);
      stroke(output.on ? 220 : 0);
      circle(output.pos.x, output.pos.y, 5);
      i += 0.5;
      i3++;
    }
    i++;
  });
}
function getReturn(type, ins) {
  if (type == 0) return [ins.reduce((a, b) => a && b)];
  if (type == 1) return ins.map(e => !e);
  let newGates = JSON.parse(JSON.stringify(gateTypes[type].fun.gates));
  newGates.forEach((e) => {
    e.inputs.forEach((n, ni) => {
      e.inputs[ni] = { type: n, on: false };
    });
    e.outputs = JSON.parse(JSON.stringify(new Array(gateTypes[e.type].inputs.reduce((a, b) => a + b)).fill(false)));
  });
  let change = true;
  while (change) {
    let oldGates = JSON.parse(JSON.stringify(newGates));
    newGates.forEach((e) => {
      e.inputs.forEach((n) => {
        if (n.type.startsWith("i")) {
          n.on = ins[n.type.split("i")[1]];
        } else if (n.type.startsWith("g")) {
          let g = n.type.split("g")[1].split("-");
          n.on = newGates.find(gt => gt.id == g[0]).outputs[g[1]];
        }
      });
      e.outputs = getReturn(e.type, e.inputs.map(n => n.on));
    });
    change = JSON.stringify(oldGates) != JSON.stringify(newGates);
  }
  return gateTypes[type].fun.outputs.map((e) => {
    if (e.startsWith("i")) {
      return ins[e.split("i")[1]];
    } else if (e.startsWith("g")) {
      let g = e.split("g")[1].split("-");
      return newGates.find(gt => gt.id == g[0]).outputs[g[1]];
    }
  });
}
function updateGates() {
  gateTypes.forEach((e) => {
    if (e.inputs.length == 1) e.totalIn = 2 + e.inputs[0].num;
    else e.totalIn = e.inputs.length + 1 + e.inputs.reduce((a, b) => ({ num: a.num + b.num })).num;
    if (e.outputs.length == 1) e.totalOut = 2 + e.outputs[0].num;
    else e.totalOut = e.outputs.length + 1 + e.outputs.reduce((a, b) => ({ num: a.num + b.num })).num;
    textFont("monospace");
    textSize(30);
    e.size = v(textWidth(e.name) + 25, e.totalIn * 10 + 5);
  });
}
function v(x, y) {
  return createVector(x, y);
}
function copyArray(array) {
  return JSON.parse(JSON.stringify(array));
}
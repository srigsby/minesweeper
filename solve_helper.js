// max indx 16_30
// min indx 1_1
y_min = 1;
y_max = 16;
x_min = 1;
x_max = 30;

function triggerMouseEvent (node, eventType) {
    var clickEvent = document.createEvent ('MouseEvents');
    clickEvent.initEvent (eventType, true, true);
    node.dispatchEvent (clickEvent);
}

function triggerRightClick (node) {
    var ev1 = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: false,
        view: window,
        button: 2,
        buttons: 2,
        clientX: node.getBoundingClientRect().x,
        clientY: node.getBoundingClientRect().y
    });
    node.dispatchEvent(ev1);
    var ev2 = new MouseEvent("mouseup", {
        bubbles: true,
        cancelable: false,
        view: window,
        button: 2,
        buttons: 0,
        clientX: node.getBoundingClientRect().x,
        clientY: node.getBoundingClientRect().y
    });
    node.dispatchEvent(ev2);
    var ev3 = new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: false,
        view: window,
        button: 2,
        buttons: 0,
        clientX: node.getBoundingClientRect().x,
        clientY: node.getBoundingClientRect().y
    });
    node.dispatchEvent(ev3);
}

// x is the string name of the location e.g. "1_1" or "7_12"
// row/height range [1,16] and column/width range [1,30]
function mine(loc) {
  var targetNode = document.getElementById(loc);
  triggerMouseEvent (targetNode, "mouseover");
  triggerMouseEvent (targetNode, "mousedown");
  triggerMouseEvent (targetNode, "mouseup");
  triggerMouseEvent (targetNode, "click");
  return square_states[targetNode.className]
}

function flag(loc) {
    var targetNode = document.getElementById(loc);
    triggerMouseEvent (targetNode, "mouseover");
    triggerRightClick (targetNode);
    triggerMouseEvent (targetNode, "click");
}

var square_states = {
    "square blank": -1,
    "square bombdeath": -666,
    "square bombflagged": "flagged",
    "square open0": 0,
    "square open1": 1,
    "square open2": 2,
    "square open3": 3,
    "square open4": 4,
    "square open5": 5,
    "square open6": 6,
    "square open7": 7,
    "square open8": 8
};

function state(loc) {
    var targetNode = document.getElementById(loc);
    return square_states[targetNode.className];
}

function random() {
    var x = Math.floor((Math.random() * 15) + 1);
    var y = Math.floor((Math.random() * 29) + 1);
    return x.toString() + '_' + y.toString()
}

idxs_lookup_table = {};
// TODO
function idxs(loc) {
    // convert from string repr of indexes (e.g "12_8") to indexs [12, 8] 
    var n = loc.indexOf("_");
    var first = loc.slice(0, n); // y 
    var second = loc.slice(n+1); // x
    return [parseInt(first, 10), parseInt(second, 10)]
}
loc_lookup_table = {};
function loc_from_idxs(idxs) {
    // convert from array of indexes (e.g [12, 8]) to string repr "12_8"
    var y = idxs[0];
    var x = idxs[1];
    return y.toString(10) + "_" + x.toString(10)
}

adjacent_idxs_lookup = {};
function adjacent_idxs(loc){
    if (adjacent_idxs_lookup.hasOwnProperty(loc)) {
        return adjacent_idxs_lookup[loc]
    } else {
        var y_x = idxs(loc);
        var y = y_x[0];
        var x = y_x[1];
        var res = [];
        // 3 above
        if (y > y_min) {
            res.push([y-1, x]);
            if (x > x_min) {
                res.push([y-1, x-1]);
            }
            if (x < x_max) {
                res.push([y-1, x+1]);
            }
        }
        // left
        if (x > x_min) {
            res.push([y, x-1]);
        }
        // right
        if (x < x_max) {
            res.push([y, x+1]);
        }
        // 3 below
        if (y < y_max) {
            res.push([y+1, x]);
            if (x < x_max) {
                res.push([y+1, x+1]);
            }
            if (x > x_min) {
                res.push([y+1, x-1]);
            }
        }
        adjacent_idxs_lookup[loc] = res;
        return res
    }
}

function opens(loc) {
    var count = 0;
    adjacents = adjacent_idxs(loc);

    for (const k in adjacents) { // k is just an index!
        if (state(loc_from_idxs(adjacents[k])) == -1) {
            count += 1;
        }
    }
    return count
}
function flags(loc) {
    var count = 0;
    adjacents = adjacent_idxs(loc);
    for (const k in adjacents) { // k is just an index!
        if (state(loc_from_idxs(adjacents[k])) == "flagged") {
            count += 1;
        }
    }
    return count
}

function every_square(func) {
    for (var y of Array(y_max).keys()) {
        y += 1;
        for (var x of Array(x_max).keys()) {
            x += 1;
            func(loc_from_idxs([y,x]))
        }
    }
}

function flag_all_opens(loc) {
    if (state(loc)-flags(loc) == opens(loc)) {
        adjacents = adjacent_idxs(loc);
        for (const idx in adjacents) {
            if (state(loc_from_idxs(adjacents[idx])) == -1) {
                flag(loc_from_idxs(adjacents[idx]));
            }
        }
    }
}

function basic_safe_clicker(loc) {
    // run this for every square with state [open 1 - open 7] aka state(loc) > 0 and state(loc) <= 8
    if (flags(loc) == state(loc)) {
        const touching_squares = adjacent_idxs(loc)
        for (const square in touching_squares) {
            if (state(loc_from_idxs(touching_squares[square])) == -1) {
                mine(loc_from_idxs(touching_squares[square]));
            }
        }
    }
}




function two_for_one(loc) {
    const state_of_loc = state(loc);
    // if (state_of_loc == -666) {
    //     mine('face');
    // } else 
    const flags_of_loc = flags(loc);
    if (flags_of_loc == state_of_loc) {
        if (state_of_loc > 0) {
            if (state_of_loc <= 8) {
                basic_safe_clicker(loc);
            }
        }
    } else if ((state_of_loc-flags_of_loc == opens(loc))) {
        if (state_of_loc > 0) {
            if (state_of_loc <= 8) {
                // flag_all_opens(loc);
                if (state_of_loc-flags_of_loc == opens(loc)) {
                    adjacents = adjacent_idxs(loc);
                    for (const idx in adjacents) {
                        if (state(loc_from_idxs(adjacents[idx])) == -1) {
                            flag(loc_from_idxs(adjacents[idx]));
                        }
                    }
            }
        }
    }
}}

function quick_start() {
    mine('face');
    for (i=0; i<29; i++) {
        var value = mine(random());
        if (value == -666) {
            mine('face');
            i = 0;
        }
    }
}


// quick_start();
setInterval(function(){every_square(two_for_one);}, 201)
// setInterval(function(){quick_start();}, 12018)

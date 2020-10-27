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

function face() {
    mine('face');
    state_revealed = {};
}

const square_states = {
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
const open_states = [-1, "flagged"];

// state_revealed needs to be reset on game restart otherwise presumed game state will be wrong
state_revealed = {}; // contains state of squares that are "flagged" or contain a revealed number
function state(loc) {
    if (state_revealed.hasOwnProperty(loc)) {
        return state_revealed[loc]
    } else {
        var targetNode = document.getElementById(loc);
        if (square_states[targetNode.className] == "flagged" || square_states[targetNode.className] > -1) {
            state_revealed[loc] = square_states[targetNode.className];
            return state_revealed[loc];
        }
        return square_states[targetNode.className];
    }
}

// doesn't need to be reset on game restart. static
idxs_lookup_table = {};
function idxs(loc) {
    // convert from string repr of indexes (e.g "12_8") to indexs [12, 8]
    if (idxs_lookup_table.hasOwnProperty(loc)) {
        return loc_lookup_table[loc]
    } else { 
        var n = loc.indexOf("_");
        var first = loc.slice(0, n); // y 
        var second = loc.slice(n+1); // x
        loc_lookup_table[loc] = [parseInt(first, 10), parseInt(second, 10)];
        return loc_lookup_table[loc]
    }
}
// doesn't need to be reset on game restart. static
loc_lookup_table = {};
function loc_from_idxs(idxs) {
    // convert from array of indexes (e.g [12, 8]) to string repr "12_8"
    if (loc_lookup_table.hasOwnProperty(idxs)) {
        return loc_lookup_table[idxs]
    } else {
        var y = idxs[0];
        var x = idxs[1];
        loc_lookup_table[idxs] = y.toString(10) + "_" + x.toString(10);
        return y.toString(10) + "_" + x.toString(10)
    }
}
// doesn't need to be reset on game restart. static
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

// very variable state. could change any time a blank square is clicked
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
function open_locs(loc) {
    var opens = [];
    adjacents = adjacent_idxs(loc);
    for (const k in adjacents) { // k is just an index!
        const adjacents_k_loc = loc_from_idxs(adjacents[k]);
        if (state(adjacents_k_loc) == -1) {
            opens.push(adjacents_k_loc);
        }
    }
    return opens
}

// TODO: would like to memoize this lookup
//      need to update all adjacent locs any time a flag is placed
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
            // skip if flagged or zero
            if (state_revealed.hasOwnProperty(loc_from_idxs([y,x])) && (state_revealed[loc_from_idxs([y,x])] == 0 || state_revealed[loc_from_idxs([y,x])] == "flagged")) {

            } else {
                func(loc_from_idxs([y,x]))
            }
        }
    }
}


// // TODO:: fix bug (logic?) here and uncomment out //delete portion to start filtering away closed squares

// // start not_closed with every loc value
// // remove key when **every touching square is a number or a flag** AKA square is closed
// // BUILD NOT CLOSED OBJECT with all possible loc keys

// var not_closed = {};
// for (var y of Array(y_max).keys()) {
//     y += 1;
//     for (var x of Array(x_max).keys()) {
//         x += 1;
//         not_closed[loc_from_idxs([y,x])] = 1;
//     }
// }

// function check_and_close_closed(loc) {
//     const adjs = adjacent_idxs[loc];
//     var an_open = [];
//     for (const idx in adjs) {
//         if (open_states.includes(state(adjs[idx]))){
//             an_open.push(1);
//         }
//     }
//     if (!an_open.includes(1)) {
//         // delete not_closed[loc];
//     }
// }

// const every_square_refactor = (func) => {
//     for (var loc of Object.keys(not_closed)) {
//         func(loc);
//     }
// } 

function flag_all_opens(loc) {
    if (state(loc)-flags(loc) == opens(loc)) {
        const adj_opens = open_locs(loc);
        for (const k in adj_opens) {
            flag(adj_opens[k]);
        }
        // const adjacents = adjacent_idxs(loc);
        // for (const idx in adjacents) {
        //     const adjacent_idx_loc = loc_from_idxs(adjacents[idx]);
        //     if (state(adjacent_idx_loc) == -1) {
        //         flag(adjacent_idx_loc);
        //     }
        // }

    }
}

// function basic_safe_clicker(loc) {
//     // run this for every square with state [open 1 - open 7] aka state(loc) > 0 and state(loc) <= 8
//     if (flags(loc) == state(loc)) {
//         const touching_squares = adjacent_idxs(loc);
//         for (const square in touching_squares) {
//             const touching_squares_square_loc = loc_from_idxs(touching_squares[square]);
//             if (state(touching_squares_square_loc) == -1) {
//                 const state_val = mine(touching_squares_square_loc);
//                 state_revealed[touching_squares_square_loc] = state_val;
//             }
//         }
//     }
// }
function basic_safe_clicker(loc) {
    const touching_squares = adjacent_idxs(loc);
    for (const square in touching_squares) {
        mine(loc_from_idxs(touching_squares[square]));
    }
}
function click_all_opens(loc) {
    const open_touching_squares = open_locs(loc);
    for (const k in open_touching_squares) {
        state_revealed[open_touching_squares[k]] = mine(open_touching_squares[k]);
    }
}


/**
 * Runs logic of flag_all_opens and basic_safe_clicker
 * @param {string} loc The string repr of a location on the board. e.g. "{y}_{x}" "8_7"
 * @return {undefined}
 */
function two_for_one(loc) {
    const state_of_loc = state(loc);
    const flags_of_loc = flags(loc);
    const opens_of_loc = opens(loc);

    if (!open_states.includes(state_of_loc)) {
            switch (state_of_loc - flags_of_loc) {
                case 0: 
                    basic_safe_clicker(loc);
                    break;
                case opens_of_loc: 
                    flag_all_opens(loc);
                    break;
            }
    }
}

function random() {
    var x = Math.floor((Math.random() * (x_max -1)) + 1);
    var y = Math.floor((Math.random() * (y_max - 1)) + 1);
    return y.toString() + '_' + x.toString()
}
function quick_start() {
    mine('face');
    state_revealed = {};
    for (i=0; i<10; i++) {
        var value = mine(random());
        if (value == -666) {
            mine('face');
            state_revealed = {};
            i = 0;
        } 
        else {
            every_square(two_for_one);
        }
    }
}

quick_start();
setInterval(function(){every_square(two_for_one);}, 777)

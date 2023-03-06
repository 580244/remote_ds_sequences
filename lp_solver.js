const util = require("./util")
var highs = null

const PROBLEM = "Maximize \n obj: \n Aa^2 \n Subject To \n c1: Aa <= 10 \n Bounds \n -infinity <= Aa <= infinity \n End" 

async function test() {
    const highs = await getHighs();
    const sol = highs.solve(PROBLEM);
    console.log(sol)
}

async function solveLP(lp, log = false, cubic = false) {
    if(!highs) {
        highs = await getHighs();
    }
    const sol = highs.solve(lp)
    if(log) { printSolution(sol) }
    if(cubic) { printCubicLP(sol) }
    return sol
}

async function getHighs() {
    const highs_settings = {
        locateFile: (file) => "https://lovasoa.github.io/highs-js/" + file
    };
    
    const highs_promise = await require("highs")(highs_settings)
    return highs_promise
}

function printSolution(sol) {
    util.logPositive("Finished with status: " + sol.Status + "\n")
    
    var variables = []
    for (var x in sol.Columns) {
        variables.push({symbol: x, value: sol.Columns[x].Primal})
    }
    variables.sort((a, b) => {
        if(a.symbol < b.symbol) {
            return -1
        } else if(a.symbol > b.symbol) {
            return 1
        } else {
            return 0
        }
    })
    
    var startSymbol = variables[0].symbol[0]
    var str = ""
    for(var i = 0; i < variables.length; i++) {
        if(variables[i].symbol[0] != startSymbol) {
            util.logPositive(str)
            str = ""
            startSymbol = variables[i].symbol[0]
        } 
        str += util.padToLength("" + variables[i].symbol + ": " + variables[i].value, 18)
    }
    util.logPositive(str)
}

function printCubicLP(sol) {
    var variables = []
    for (var x in sol.Columns) {
        variables.push({symbol: x, value: sol.Columns[x].Primal})
    }
    variables.sort((a, b) => {
        if(a.symbol < b.symbol) {
            return -1
        } else if(a.symbol > b.symbol) {
            return 1
        } else {
            return 0
        }
    })
    for (var i = 0; i < variables.length/4; i++) {
        var str = variables[i*4].symbol[0] + "(x) = " 
        for (var j = 0; j < 4; j++) {
            var term = variables[i*4+j].value
            if (term == 0) { continue }
            var power = j == 3 ? "" : "x^" + (3-j)
            str += term + power + " + "
        }
        str = str.slice(0,-3)
        util.logPositive(str)
    }
}

module.exports = {test, solveLP}
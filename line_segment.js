const util = require("./util")

const EPSILON = -0.0001

class lp_ls_builder {
    constructor(length) { 
        this.pointConstraints = []
        this.freeVariables = []
        this.coordinates = []
        for(var i = 0; i < length + 1 ; i++) {
            this.coordinates.push(i)
        }
    }
    addPointConstraint(c) {this.pointConstraints.push(c)}
    addFreeVariable(v) {this.freeVariables.push(v)}
    randomizeXCoordinates() {
        var newCoordinates = [0]
        for(var i = 1; i < this.coordinates.length; i++) {
            var diff = Math.random()*1
            newCoordinates.push(newCoordinates[i-1]+diff)
        }
        this.coordinates = newCoordinates
    }
    getProgram() {
        var str = "Maximize \n Obj: \n  0 \n"
        if(this.pointConstraints.length > 0) {
            str += "Subject To \n"
            var constraintCounter = 1
            for(var i = 0; i < this.pointConstraints.length; i++) {
                var c = this.pointConstraints[i]
                var x = this.coordinates[c.x]
                var constraint = evalLine(c.left, x)
                constraint += evalLine(c.right, x, true)
                constraint += (c.op == '<') ? "<= " + EPSILON : c.op + " 0"
                str += " C" + constraintCounter + ": " + constraint + " \n"
                constraintCounter++
            } 
        }
        if(this.freeVariables.length > 0) {
            str += "Bounds \n"
            for(var i = 0; i < this.freeVariables.length; i++) {
                str += " " + this.freeVariables[i] + " free \n"
            }
        }
        str += "End"
        return str
    }
}

function printLines(solution) {
    var variables = util.getVariables(solution)
    for (var i = 0; i < variables.length/(2); i++) {
        var str = variables[i*(2)].symbol[0] + "(x) = " 
        for (var j = 0; j < 2; j++) {
            var term = variables[i*(2)+j].value
            if (term == 0) { continue }
            var power = (j == 0) ? " x" : ""
            str += term + power + " + "
        }
        str = str.slice(0,-3)
        str = str.replaceAll("e", "*10^")
        util.logPositive(str)
    }
}

function printLineSegments(solution, sequence, builder) {
    const variables = util.getVariables(solution)
    const coords = builder.coordinates

    for (var i = 0; i < variables.length/2; i++) {
        const symbol = variables[i*2].symbol[0]
        const a = variables[i*2].value
        const b = variables[i*2 + 1].value
        const startX = coords[sequence.indexOf(symbol)]
        const endX = coords[sequence.lastIndexOf(symbol) + 1]
        const startPoint = "(" + startX + ", " + (a * startX + b) + ")"
        const endPoint = "(" + endX + ", " + (a * endX + b) + ")"
        var str = symbol + " = Segment(" + startPoint + ", " + endPoint + ")" 
        util.logPositive(str)
    }
}

function evalLine(symbol, x, negative = false) {
    if(negative) {
        return "- " + x + " " + symbol + "a - " + symbol + "b " 
    } else {
        return x + " " + symbol + "a + " + symbol + "b " 
    }
}

function addBeginningConstraints(lp, symbols, sequence) {
    for (var i = 1; i < symbols.length; i++) {
        const currSymbol = symbols[i]
        const x = sequence.indexOf(currSymbol)
        const prevSymbol = sequence[x - 1]
        lp.addPointConstraint({left: currSymbol, right: prevSymbol, op: "<", x: x})
    }
}

function addIntersectionConstraints(lp, pairs, intersectionIntervals) {
    for(var i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        if(intersectionIntervals.get(pair).length >= 2) {
            const secondInterval = intersectionIntervals.get(pair)[1]
            lp.addPointConstraint({left: pair[1], right: pair[0], op: "<=", x: secondInterval.left})
        }
        if(intersectionIntervals.get(pair).length == 3) {
            const secondInterval = intersectionIntervals.get(pair)[1]
            lp.addPointConstraint({left: pair[0], right: pair[1], op: "<=", x: secondInterval.right})
        }
    }
}

function makeAllVariablesFree(lp, symbols) {
    for(var i = 0; i < symbols.length; i++) {
        lp.addFreeVariable(symbols[i] + "a")
        lp.addFreeVariable(symbols[i] + "b")
    }
}

function toLineSegmentLP(sequence) {
    var lp = new lp_ls_builder(sequence.length)
    var symbols = util.getUniqueSymbols(sequence)
    var pairs = util.getAllPairs(symbols)
    var intersectionIntervals = util.getIntersectionIntervals(sequence, pairs)

    addBeginningConstraints(lp, symbols, sequence)
    addIntersectionConstraints(lp, pairs, intersectionIntervals)
    makeAllVariablesFree(lp, symbols)    

    return lp
}

module.exports = {toLineSegmentLP, printLines, printLineSegments}
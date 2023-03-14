const util = require("./util")

const EPSILON = -0.0001

class lp_poly_builder {
    constructor(length, order) { 
        this.pointConstraints = []
        this.stringConstraints = []
        this.freeVariables = []
        this.order = order
        this.coordinates = []
        for(var i = 0; i < length ; i++) {
            this.coordinates.push(i)
        }
    }
    addPointConstraint(c) {this.pointConstraints.push(c)}
    addStringConstraint(c) { this.stringConstraints.push(c) }
    addFreeVariable(v) {this.freeVariables.push(v)}
    randomizeXCoordinates() {
        var newCoordinates = [0, 1]
        for(var i = 2; i < this.coordinates.length; i++) {
            var diff = Math.random()*10
            newCoordinates.push(newCoordinates[i-1]+diff)
        }
        this.coordinates = newCoordinates
    }
    getProgram() {
        var str = "Maximize \n Obj: \n  0 \n"
        if(this.pointConstraints.length > 0 || this.stringConstraints.length > 0) {
            str += "Subject To \n"
            var constraintCounter = 1
            for(var i = 0; i < this.pointConstraints.length; i++) {
                var c = this.pointConstraints[i]
                var x = this.coordinates[c.x]
                if("middle" in c) {
                    x = (this.coordinates[c.x + 1] - this.coordinates[c.x])/2 + this.coordinates[c.x]
                }
                var constraint = evalPoly(c.left, x, this.order)
                constraint += evalPoly(c.right, x, this.order, true)
                constraint += (c.op == '<') ? "<= " + EPSILON : c.op + " 0"
                str += " C" + constraintCounter + ": " + constraint + " \n"
                constraintCounter++
            } 
            for(var i = 0; i < this.stringConstraints.length; i++) {
                str += " C" + constraintCounter + ": " + this.stringConstraints[i] + " \n"
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

function printPolynomials(solution, degree) {
    var variables = util.getVariables(solution)
    util.logPositive("A(x) = 0")
    for (var i = 0; i < variables.length/(degree + 1); i++) {
        var str = variables[i*(degree+1)].symbol[0] + "(x) = " 
        for (var j = 0; j < (degree+1); j++) {
            var term = variables[i*(degree+1)+j].value
            if (term == 0) { continue }
            var power = (j == degree) ? "" : "x^" + (degree-j)
            str += term + power + " + "
        }
        str = str.slice(0,-3)
        util.logPositive(str)
    }
}

function evalPoly(symbol, x, order, negative = false) {
    if(symbol == "A") { 
        return negative ? "- 0 " : "0 "
    }
    str = negative ? "- " : ""
    if(x != 0) {
        for(var i = order; i > 0; i--) {
            str += Math.pow(x,i) + " " + symbol + util.symbols[order - i].toLowerCase() + " + "
        }
    }
    str += symbol + util.symbols[order].toLowerCase() + " "
    if(negative) {
        str = str.replaceAll("+", "-")
    }
    return str
}

function addBeginningConstraints(lp, symbols) {
    for(var i = 1; i < symbols.length; i++) {
        const constraint = {left: symbols[0], right: symbols[i], op: '<', x: 0}
        lp.addPointConstraint(constraint)
    }
}

function addIntersectionConstraints(lp, pairs, intersectionIntervals) {
    for(var i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        for(var j = 0; j < intersectionIntervals.get(pair).length; j++) {
            const interval = intersectionIntervals.get(pair)[j]
            const symbol1 = (j % 2 == 0) ? pair[0] : pair[1]
            const symbol2 = (j % 2 == 0) ? pair[1] : pair[0]
            if(interval.left == interval.right) {
                lp.addPointConstraint({left: symbol1, right: symbol2, op: '=', x: interval.left})
            } else {
                lp.addPointConstraint({left: symbol1, right: symbol2, op: '<=', x: interval.left})
                lp.addPointConstraint({left: symbol2, right: symbol1, op: '<=', x: interval.right})
            }
        }
    }
}

function addDifferenceConstraints(lp, sequence, pairs) {
    for(var i = 0; i < pairs.length; i++) {
        const pair = pairs[i]
        if(pair[0] == 'A') { continue }
        const index = sequence.indexOf(pair[0])
        const constraint = {left: pair[0], right: pair[1], op: '<', x: index, middle: true}
        lp.addPointConstraint(constraint)
    }
}

function addLinearEndConstraints(lp, sequence) {
    if(sequence[sequence.length - 1] != "A") {
        const lastSymbol = sequence[sequence.length - 1]
        lp.addStringConstraint(lastSymbol + "a = 0")
    }
}

function makeAllVariablesFree(lp, symbols, order) {
    for(var i = 1; i < symbols.length; i++) {
        for(var j = 0; j <= order; j++) {
            lp.addFreeVariable(symbols[i] + util.symbols[j].toLowerCase())
        }
    }
}

function toLineLP(sequence) {
    var lp = new lp_poly_builder(sequence.length, 1)
    var symbols = util.getUniqueSymbols(sequence)
    var pairs = util.getAllPairs(symbols)
    var intersectionIntervals = util.getIntersectionIntervals(sequence, pairs)

    addBeginningConstraints(lp, symbols)
    addDifferenceConstraints(lp, sequence, pairs)
    addIntersectionConstraints(lp, pairs, intersectionIntervals)
    makeAllVariablesFree(lp, symbols, 1)    

    return lp
}

function toQuadraticLP(sequence) {
    var lp = new lp_poly_builder(sequence.length, 2)
    var symbols = util.getUniqueSymbols(sequence)
    var pairs = util.getAllPairs(symbols)
    var intersectionIntervals = util.getIntersectionIntervals(sequence, pairs)
    
    addBeginningConstraints(lp, symbols)
    addDifferenceConstraints(lp, sequence, pairs)
    addIntersectionConstraints(lp, pairs, intersectionIntervals)
    addLinearEndConstraints(lp, sequence)
    makeAllVariablesFree(lp, symbols, 2)

    return lp
}

function toCubicLP(sequence) {
    var lp = new lp_poly_builder(sequence.length, 3)
    var symbols = util.getUniqueSymbols(sequence)
    var pairs = util.getAllPairs(symbols)
    var intersectionIntervals = util.getIntersectionIntervals(sequence, pairs)
    
    addBeginningConstraints(lp, symbols)
    addDifferenceConstraints(lp, sequence, pairs)
    addIntersectionConstraints(lp, pairs, intersectionIntervals)
    //addLinearEndConstraints(lp, sequence)
    makeAllVariablesFree(lp, symbols, 3)

    return lp
}

module.exports = {toQuadraticLP, toLineLP, toCubicLP, printPolynomials}
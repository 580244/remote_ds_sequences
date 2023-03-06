const util = require("./util")

class lp_builder {
    constructor() { 
        this.constraints = []
        this.bounds = [] 
    }
    addConstraint(c) { this.constraints.push(c) }
    addBound(b) {this.bounds.push(b)}
    getProgram() {
        var str = "Maximize \n Obj: \n  0 \n"
        if(this.constraints.length > 0) {
            str += "Subject To \n"
            var constraintCounter = 1
            for(var i = 0; i < this.constraints.length; i++) {
                str += " C" + constraintCounter + ": " + this.constraints[i] + " \n"
                constraintCounter++
            }  
        }
        if(this.bounds.length > 0) {
            str += "Bounds \n"
            for(var i = 0; i < this.bounds.length; i++) {
                str += " " + this.bounds[i] + " \n"
            }
        }
        str += "End"
        return str
    }
}

function toCubicLP(sequence) {
    const epsilon = -0.0001
    var lp = new lp_builder()
    var symbols = util.getUniqueSymbols(sequence)

    //Add Beginning Constraints
    const startSymbol = sequence[0]
    for(var i = 1; i < symbols.length; i++) {
        const otherSymbol = symbols[i]
        var constraint = startSymbol + "d - " + otherSymbol + "d <= " + epsilon
        lp.addConstraint(constraint)
    }

    //Add Intersection Constraints
    var intersections = util.getAllPairs(symbols)
    var IntersectionCounts = new Map()
    for(var i = 0; i < intersections.length; i++) {
        const symbol1 = intersections[i][0]
        const symbol2 = intersections[i][1]
        var index = sequence.indexOf(symbol1) + 1
        var currSymbol = symbol1
        IntersectionCounts.set(intersections[i], 0)
        while(true) {
            const subSequence = sequence.substring(index)
            const next1 = subSequence.indexOf(symbol1)
            const next2 = subSequence.indexOf(symbol2)
            if(next1 == -1 && next2 == -1) { break }
            var closestSymbol
            if(next1 == -1 || next2 == -1) {
                closestSymbol = next1 == -1 ? symbol2 : symbol1
            } else {
                closestSymbol = next1 < next2 ? symbol1 : symbol2  
            }
            if(closestSymbol != currSymbol) {
                const nextIndex = subSequence.indexOf(closestSymbol) 
                if(nextIndex == 0) {
                    var constraint = util.cubicEvalString(currSymbol, index)
                    constraint += util.cubicEvalString(closestSymbol, index, negative = true) + "= 0"
                    lp.addConstraint(constraint)
                } else {
                    var constraint1 = util.cubicEvalString(currSymbol, index)
                    constraint1 += util.cubicEvalString(closestSymbol, index, negative = true) + "<= 0"
                    lp.addConstraint(constraint1)
                    var constraint2 = util.cubicEvalString(closestSymbol, index + nextIndex)
                    constraint2 += util.cubicEvalString(currSymbol, index + nextIndex, negative = true) + "<= 0"
                    lp.addConstraint(constraint2)
                }
                IntersectionCounts.set(intersections[i], IntersectionCounts.get(intersections[i]) + 1)
                index += nextIndex + 1
                currSymbol = closestSymbol
            } else {
                index += subSequence.indexOf(currSymbol) + 1
            }
        }
    }
    
    //Add Intersection Reducing Constraints
    for(var i = 0; i < intersections.length; i++) {
        const interCount = IntersectionCounts.get(intersections[i])
        const symbol1 = intersections[i][0]
        const symbol2 = intersections[i][1]
        if(interCount <= 2) {
            var constraint = symbol1 + "a - " + symbol2 + "a = 0"
            lp.addConstraint(constraint)
        }
        if(interCount == 1) {
            var constraint = symbol1 + "b - " + symbol2 + "b = 0"
            lp.addConstraint(constraint)
        }
    }

    //Add Bounds
    for(var i = 0; i < symbols.length; i++) {
        lp.addBound(symbols[i] + "a free")
        lp.addBound(symbols[i] + "b free")
        lp.addBound(symbols[i] + "c free")
        lp.addBound(symbols[i] + "d free")
    }

    return lp.getProgram()

}

function toLineSegmentLP(sequence) {
    const epsilon = -0.0001
    var lp = new lp_builder()
    var symbols = util.getUniqueSymbols(sequence)
    var map = util.getOccurenceMap(sequence, symbols)

    //Add Beginning Constraints
    for (var i = 1; i < symbols.length; i++) {
        const currSymbol = symbols[i]
        const prevSymbol = sequence[map.get(currSymbol).first - 1]
        const x = map.get(currSymbol).first + 1
        var constraint = x + " " + currSymbol + "a + " + currSymbol + "b "
        constraint += "- " + x + " " + prevSymbol + "a - " + prevSymbol + "b <= " + epsilon
        lp.addConstraint(constraint)
    }

    //Add Fixed Intersection Constraints
    var intersections = util.getAllPairs(symbols)
    for (var i = 2; i < sequence.length - 1; i++) {
        const currSymbol = sequence[i]
        const prevSymbol = sequence[i - 1]
        if (map.get(currSymbol).first != i && map.get(prevSymbol).last != i - 1) {
            const x = i + 1
            var constraint = x + " " + currSymbol + "a + " + currSymbol + "b "
            constraint += "- " + x + " " + prevSymbol + "a - " + prevSymbol + "b = 0"
            lp.addConstraint(constraint)
            intersections = intersections.filter(pair => pair != util.sortString(currSymbol + prevSymbol))
        }
    }

    //Add Flexible Intersection Constraints
    for(var i = 0; i < intersections.length; i++) {
        const symbol1 = intersections[i][0]
        const symbol2 = intersections[i][1]
        const constraintNecessary = map.get(symbol2).first < map.get(symbol1).last
        if(constraintNecessary) {
            var x = 0
            for(var j = 0; i < sequence.length; j++) {
                if(sequence[j] == symbol1 && x > 0) {
                    break
                } else if(sequence[j] == symbol2) {
                    x = j + 2
                }
            }
            var constraint = x + " " + symbol2 + "a + " + symbol2 + "b "
            constraint += "- " + x + " " + symbol1 + "a - " + symbol1 + "b <= 0"
            lp.addConstraint(constraint)
        }
    }

    //Add Bounds
    for(var i = 0; i < symbols.length; i++) {
        lp.addBound(symbols[i] + "a free")
        lp.addBound(symbols[i] + "b free")
    }

    return lp.getProgram()
}

function randomizeXcoord(lp, sequence) {
    const breakPoints = sequence.length + 1
    var newBreakPoints = [1]
    for (var i = 0; i < breakPoints-1; i++) {
        var diff = Math.random()*100000
        newBreakPoints.push(newBreakPoints[i]+diff)
    }

    for (var i=0; i<breakPoints; i++) {
        lp = lp.replaceAll(" "+(i+1) +" "," " + newBreakPoints[i] + " ")
    }
    
    return lp
}

module.exports = {toLineSegmentLP, toCubicLP, randomizeXcoord}
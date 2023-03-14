const symbols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

function logError(message) {
    console.log('\u001b[' + 31 + 'm' + message + '\u001b[0m')
}

function logPositive(message) {
    console.log('\u001b[' + 32 + 'm' + message + '\u001b[0m')
}

function padToLength(string, len) {
    while(string.length < len) {
        string += " "
    }
    return string
}

function isEquivalent(seq1, seq2) {
    
    if(seq1.length != seq2.length) {
        return false
    }

    var symbolMap = new Map()
    var valueList = []
    for(var i = 0; i < seq1.length; i++) {
        if(!symbolMap.has(seq1[i])) {
            if(valueList.includes(seq2[i])) {
                return false
            }
            symbolMap.set(seq1[i], seq2[i])
            valueList.push(seq2[i])
        } else {
            if(symbolMap.get(seq1[i]) != seq2[i]) {
                return false
            }
        }
    }

    return true
}

function toCanonical(seq) {
    var result = ""
    var symbolsUsed = 0
    var symbolMap = new Map()
    for(var i = 0; i < seq.length; i++) {
        if(!symbolMap.has(seq[i])) {
            symbolMap.set(seq[i], symbols[symbolsUsed])
            symbolsUsed++
        } 
        result += symbolMap.get(seq[i])
    }
    return result
}

function cubicEvalString(symbol, x, negative = false) {
    str = negative ? "- " : ""
    str += Math.pow(x,3) + " " + symbol + "a + " + Math.pow(x,2) + " " + symbol + "b + "
    str += x + " " + symbol + "c + " + symbol + "d "
    if(negative) {
        str = str.replaceAll("+", "-")
    }
    return str
}

function binarySearch(list, x) {
    var start = 0
    var end = list.length - 1;
        
    while (start <= end){
        var mid = Math.floor((start + end)/2);
        if (list[mid] == x) {
            return {found: true, index: mid}
        } else if (list[mid] < x)
            start = mid + 1;
        else
            end = mid - 1;
    }

    return {found: false}
}

function keepCharacters(string, charList, makeDS = false) {
    var result = string.split("").filter(char => charList.includes(char))

    if(makeDS) {
        for(var j = result.length - 1; j > 0 ; j--) {
            if(result[j] == result[j - 1]) {
                result.splice(j,1)
            }
        }
    }

    return result.join("")
}

function reverseString(s) {
    return s.split("").reverse().join("")
}

function sortString(s) {
    return s.split("").sort().join("")
}

function alternatingString(symbol1, symbol2, length) {
    result = ""
    for(var i = 0; i < length; i++) {
        result += (i % 2 == 0) ? symbol1 : symbol2
    }
    return result
}

function badPattern(s) {
    pattern = "(.).*(?!\\1)(.)"
    for(var i = 0; i < s; i++) {
        pattern += (i % 2 == 0) ?  ".*(\\1)" : ".*(\\2)"
    }
    return new RegExp(pattern)
}

function getUniqueSymbols(seq) {
    var symbols = []
    for (var i = 0; i < seq.length; i++) {
        if (!symbols.includes(seq[i])) {
            symbols.push(seq[i])
        }
    }
    return symbols
}

function getOccurenceMap(seq, symbols) {
    var map = new Map()
    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i]
        var first = seq.indexOf(symbol)
        var last = seq.lastIndexOf(symbol)
        map.set(symbol, {first: first, last: last})
    }
    return map
}

function getAllPairs(symbols) {
    var pairs = []
    for(var i = 0; i < symbols.length - 1; i++) {
        for(var j = i + 1; j < symbols.length; j++) {
            pairs.push(symbols[i] + symbols[j])
        }
    }
    return pairs
}

function getIntersectionIntervals(sequence, pairs) {
    var intersectionIntervals = new Map()
    for(var i = 0; i < pairs.length; i++) {
        const symbol1 = pairs[i][0]
        const symbol2 = pairs[i][1]
        var intervals = []
        var currSymbol = symbol1
        var index = sequence.indexOf(currSymbol) + 1
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
            const nextIndex = subSequence.indexOf(closestSymbol) 
            if(closestSymbol != currSymbol) {
                intervals.push({left: index, right: index + nextIndex})
                index += nextIndex + 1
                currSymbol = closestSymbol
            } else {
                index += nextIndex + 1
            }
        }
        intersectionIntervals.set(pairs[i], intervals)
    }
    return intersectionIntervals
}

function getVariables(solution) {
    var variables = []
    for (var x in solution.Columns) {
        variables.push({symbol: x, value: solution.Columns[x].Primal})
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
    return variables
}

module.exports = {logError, logPositive, keepCharacters, alternatingString,
                  badPattern, isEquivalent, reverseString, padToLength, getUniqueSymbols,
                  getOccurenceMap, sortString, getAllPairs, toCanonical, binarySearch,
                  cubicEvalString, getIntersectionIntervals, getVariables, symbols}
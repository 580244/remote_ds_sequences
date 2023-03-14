const util = require("./util")

const symbols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

function genDSseq(n, s, log = false) {
    var queue = [{seq:"",count:0}]
    var results = []
    while(queue.length != 0) {
        var element = queue.shift()
        const validSymbols = symbols.slice(0, Math.min(n, element.count+1))

        for(var i=0; i < validSymbols.length; i++) {
            if(element.seq.slice(-1) == validSymbols[i]) { continue }
            var newSequence = element.seq + validSymbols[i]
            var newCount = Math.min(n, element.count+(i == validSymbols.length-1 ? 1 : 0))
            if(isDSseqFast(newSequence, newCount, s)) {
                queue.push({seq:newSequence, count: newCount})
                results.push(newSequence)
            }
        }
    }

    if(log) {
        const longestDSsequence = results[results.length - 1]
        util.logPositive("Generated " + results.length + " sequences")
        util.logPositive("Longest sequence is " + longestDSsequence)
        util.logPositive("Longest sequence has length " + longestDSsequence.length)
    }
    return results
}

function genDSseqPruned(n, s, verbose = false) {
    var queue = [{seq:"",count:0}]
    var layers = []
    var results = []
    while(queue.length != 0) {
        var element = queue.shift()
        const validSymbols = symbols.slice(0, Math.min(n, element.count+1))
        var isLeaf = true
        for(var i=0; i < validSymbols.length; i++) {
            if(element.seq.slice(-1) == validSymbols[i]) { continue }
            var newSequence = element.seq + validSymbols[i]
            var newCount = Math.min(n, element.count+(i == validSymbols.length - 1 ? 1 : 0))
            if(newSequence.length < s + 2 || isDSseqFast(newSequence, newCount, s)) {
                isLeaf = false
                queue.push({seq:newSequence, count: newCount})
                if(layers.length < newSequence.length) {
                    layers.push([])
                }
                layers[newSequence.length - 1].push(newSequence)
            }
        }
        if(isLeaf) {
            results.push(element.seq)
        }
    }

    var allResults = []
    if(verbose) {
        for(var i = 0; i < layers.length; i++) {
            for(var j = 0; j < layers[i].length; j++) {
                allResults.push(layers[i][j])
            }
        }
    }

    const tempLength = results.length
    var removed = 0
    for(var i = 0; i < tempLength; i++) {
        const sequence = results[i - removed]
        const revSequence = util.toCanonical(util.reverseString(sequence))
        const layer = layers[sequence.length - 1]
        
        if(sequence == revSequence) { continue }
        var reverseStatus = util.binarySearch(layer, revSequence)
        if(reverseStatus.found) {
            results.splice(i - removed, 1)
            removed++
            normalStatus = util.binarySearch(layer, sequence)
            layer.splice(normalStatus.index, 1)
        }
    }

    if(verbose) {
        return {all: allResults, pruned: results}
    } else {
        return results 
    }
}

function isDSseqFast(sequence, n, s) {
    const lastSymbol = sequence.slice(-1)
    const subSymbols = symbols.slice(0, n)
    for(var i = 0; i < subSymbols.length; i++) {
        const symbol = subSymbols[i]
        if(symbol == lastSymbol) { continue }
        var seq = util.keepCharacters(sequence, [symbol, lastSymbol], makeDS = true)
        var forbiddenPattern1 = util.alternatingString(symbol, lastSymbol, s + 2)
        var forbiddenPattern2 = util.alternatingString(lastSymbol, symbol, s + 2)
        if(seq.includes(forbiddenPattern1) || seq.includes(forbiddenPattern2)) {
            return false
        }
    }
    
    return true
}

function isDSseq(sequence, n, s, log = false) {

    //Verify n
    const subSymbols = symbols.slice(0, n)
    for(var i = 0; i < sequence.length; i++) {
        if(!subSymbols.includes(sequence[i])) {
            if(log) {util.logError("Sequence contains invalid symbol")}
            return false
        }
    }

    //Verify 'No Duplicates'
    for(var i = 0; i < sequence.length - 1; i++) {
        if(sequence[i]== sequence[i + 1]) {
            if(log) {util.logError("Sequence contains identical neighbors")}
            return false
        }
    }

    //Verify s
    for(var i = 0; i < subSymbols.length - 1; i++) {
        for(var j = i + 1; j < subSymbols.length; j++) {
            const symbol1 = subSymbols[i]
            const symbol2 = subSymbols[j]
            var seq = util.keepCharacters(sequence, [symbol1, symbol2], makeDS = true)
            var forbiddenPattern1 = util.alternatingString(symbol1, symbol2, s + 2)
            var forbiddenPattern2 = util.alternatingString(symbol1, symbol2, s + 2)
            if(seq.includes(forbiddenPattern1) || seq.includes(forbiddenPattern2)) {
                if(log) {util.logError("Sequence contains forbidden pattern")}
                return false
            }
        }
    }

    if(log) {util.logPositive("" + sequence + " is a DS(" + n + ", " + s + ")-sequence")}

    return true
}

function prunelowerOrderSequences(seqList, n, s) {
    return seqList.filter(seq => !isDSseq(seq, n, s - 1))
}

function pruneReverse(seqList) {
    return seqList.filter( s => {
        if(s == util.toCanonical(util.reverseString(s))) {
            return true
        } else {
            return s < util.toCanonical(util.reverseString(s))
        }
    })
}

function pruneForCubic(seqList, n) {
   return pruneReverse(prunelowerOrderSequences(seqList, n, 3))
}

function pruneRedundantSequences(seqList) {
    results = []
    sequences = [...seqList]
    var removed = 0
    for(var i = 0; i < seqList.length; i++) {
        var seq = sequences[i - removed]
        var isRedundant = sequences.some(e => {
            if(e == seq) { return false}
            return util.isEquivalent(util.reverseString(seq), e) ||
                   util.isEquivalent(seq, e.slice(0, -1)) ||
                   util.isEquivalent(seq, e.slice(1, e.length))
        })
        if(isRedundant) {
            sequences.splice(i - removed, 1)
            removed++
        } else {
            results.push(seq)
        }
    }

    return results
}

module.exports = {symbols, genDSseq, isDSseq, pruneRedundantSequences, genDSseqPruned,
                  prunelowerOrderSequences, pruneReverse, pruneForCubic}
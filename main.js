const util = require("./util")
const ds = require("./ds")
const lp_solver = require("./lp_solver")
const ls = require("./line_segment")
const poly = require("./polynomial")
const fs = require("fs")

function gatherData(n, s) {
    var DSData = ds.genDSseqPruned(n, s, verbose = true)
    var DSSequences = DSData.all
    var prunedDSSequences = DSData.pruned
    var maxLength = DSSequences[DSSequences.length - 1].length
    var maxLengthSequences = DSSequences.filter(seq => seq.length == maxLength)

    console.log()
    util.logPositive("Finished gathering data for n = " + n + ", s = " + s + ": \n")
    util.logPositive("Found " + DSSequences.length + " sequences")
    util.logPositive("Where " + maxLengthSequences.length + " had the maximum length of " + maxLength)
    util.logPositive("Example of a max-sequence: " + DSSequences[DSSequences.length - 1])
    util.logPositive("Found " + prunedDSSequences.length + " structurally different sequences")
}

async function realizeSeqAsLineSegments(n) {

    console.log()
    util.logPositive("Attempting to realize all DS(" + n + ", 3)-Sequenecs as line segments")
    var prunedDSSequences = ds.genDSseqPruned(n,3)
    var infeasibleSequences = []
    util.logPositive("Finished generating " + prunedDSSequences.length + " sequences")

    for (var i = 0; i < prunedDSSequences.length; i++) {
        const lp_builder = ls.toLineSegmentLP(prunedDSSequences[i])
        var lp = lp_builder.getProgram()
        var solution = await lp_solver.solveLP(lp, log = false)
        if (solution.Status != "Optimal") {
            infeasibleSequences.push(prunedDSSequences[i])
        }
    }
    console.log()
    if(infeasibleSequences.length == 0) {
        util.logPositive("All sequences were realizable with fixed x-coordinates")
        return
    }
    
    const goodSequenceCount = prunedDSSequences.length - infeasibleSequences.length
    util.logPositive("" + goodSequenceCount + " were realizable with fixed x-coordinates")
    util.logError("The following " + infeasibleSequences.length + " were not:")
    util.logError(infeasibleSequences)

    console.log()
    util.logPositive("Attempting to realize remaining sequences with random x-coordinates")
    const maxIterations = 100000
    var veryInfeasibleSequences = []
    for (var i = 0; i < infeasibleSequences.length; i++) {
        var counter = 0
        const lp_builder = ls.toLineSegmentLP(infeasibleSequences[i])
        lp_builder.randomizeXCoordinates()
        var randomLP = lp_builder.getProgram()
        var solution = await lp_solver.solveLP(randomLP)
        while (solution.Status != "Optimal" && counter < maxIterations) {
            lp_builder.randomizeXCoordinates()
            randomLP = lp_builder.getProgram()
            solution = await lp_solver.solveLP(randomLP)
            counter++
        }
        console.log(counter)
        if (counter == maxIterations ) {
            veryInfeasibleSequences.push(infeasibleSequences[i])
        }
    }

    if(veryInfeasibleSequences.length == 0) {
        util.logPositive("All remaining sequences were realizable with random x-coordinates")
        return
    }

    util.logError("The following " + veryInfeasibleSequences.length + " sequences were still not realizable:")
    util.logError(veryInfeasibleSequences)
}

async function realizeSeqAsQuadratics(n) {
    console.log()
    util.logPositive("Attempting to realize all DS(" + n + ", 2)-Sequenecs as quadratic functions")
    var DSSequences = ds.genDSseq(n, 2)
    var infeasibleSequences = []
    util.logPositive("Finished generating " + DSSequences.length + " sequences")

    for (var i = 0; i < DSSequences.length; i++) {
        if(DSSequences[i].length == 1) { continue }
        const lp_builder = poly.toQuadraticLP(DSSequences[i])
        const lp = lp_builder.getProgram()
        const solution = await lp_solver.solveLP(lp)
        if (solution.Status != "Optimal") {
            infeasibleSequences.push(DSSequences[i])
        }
    }

    console.log()
    if(infeasibleSequences.length == 0) {
        util.logPositive("All sequences were realizable with fixed x-coordinates")
        return
    } else {
        const goodSequenceCount = DSSequences.length - infeasibleSequences.length
        util.logPositive("" + goodSequenceCount + " were realizable with fixed x-coordinates")
        util.logError("The following " + infeasibleSequences.length + " were not:")
        util.logError(infeasibleSequences)
    }
}

//realizeSeqAsLineSegments(5)

async function test() {
    const str = "ABCADAEADCFBFCFDEF"
    const lp_builder = ls.toLineSegmentLP(str)
    lp_builder.randomizeXCoordinates()
    var lp = lp_builder.getProgram()
    var solution = await lp_solver.solveLP(lp)
    var counter = 0
    while(solution.Status != "Optimal") {
        lp_builder.randomizeXCoordinates()
        var lp = lp_builder.getProgram()
        var solution = await lp_solver.solveLP(lp)
        counter++
    }
    console.log(solution.Status)
    console.log(counter)
    console.log()
    ls.printLineSegments(solution, str, lp_builder)
}

async function gatherDataToFile(n, s) {
    
    var startTime = Date.now()
    var DSData = ds.genDSseqPruned(n, s, verbose = true) 
    var endTime = Date.now()
    var DSSequences = DSData.all
    var prunedDSSequences = DSData.pruned
    var maxLength = DSSequences[DSSequences.length - 1].length
    var maxLengthSequences = DSSequences.filter(seq => seq.length == maxLength)

    var fileText = ""
    fileText = fileText + "Finished gathering data for n = " + n + ", s = " + s + " in " + msToTime(endTime-startTime).toString() + ":\n \n"
    fileText = fileText + "Found " + DSSequences.length + " sequences\n"
    fileText = fileText + "Where " + maxLengthSequences.length + " had the maximum length of " + maxLength + "\n"
    fileText = fileText + "Example of a max-sequence: " + DSSequences[DSSequences.length - 1] + "\n"
    fileText = fileText + "Found " + prunedDSSequences.length + " structurally different sequences"
    console.log(fileText)
    var fileName = "data(" + n + "," + s + ").txt"
    await fs.writeFile(fileName, fileText, (err) => {
        if (err) throw err;
    })
}

async function realizeSeqAsLineSegmentsToFile(n,s) {
    var veryInfeasibleSeq = "" 
    const maxCounter = 10
    seq = ["ABCADAEADCFBFCFDEF","ABACDAEAEDBFBCFDFEF", "ABCADAEAEDCFCBFDFEF", "ABACADAEDCBFBFCFDFEF", "ABACDAEAEDBFBFCFDFEF", "ABCADAEAEDCFBFCFDFEF", "ABCADAEAEDCFCBCFDFEF", "ABCADAEAEDCFCFBFDFEF", "ABCBADAEAEDBFBCFDFEF", "ABCBDBABEBEDCFCFDFEF", "ABCBDBEAEBEDCFCFDFEF", "ABACADADCBEBECEDFDFEF", "ABACADAEAEDBFBFCFDFEF", "ABACADAEAEDCFBFCFDFEF", "ABACADAEAEDCFCFBFDFEF", "ABACADEDADCBFBFCFDFEF", "ABACDAEAEDCBFBFCFDFEF", "ABCADAEAEDCBFBFCFDFEF", "ABCBADAEAEDBDCFCFDFEF", "ABCBADAEAEDBFBFCFDFEF", "ABCBADAEAEDBFBFDFECEF", "ABCBDBAEAEBEDCFCFDFEF", "ABACADAEAEDCBFBFCFDFEF"]
    var startTime = Date.now()
    for (var i = 0; i < seq.length; i++) {
        const str = seq[i]
        const lp_builder = ls.toLineSegmentLP(str)
        lp_builder.randomizeXCoordinates()
        var lp = lp_builder.getProgram()
        var solution = await lp_solver.solveLP(lp)
        var counter = 0
        while(solution.Status != "Optimal" && counter < maxCounter) {
            lp_builder.randomizeXCoordinates()
            var lp = lp_builder.getProgram()
            var solution = await lp_solver.solveLP(lp)
            counter++
        }
        veryInfeasibleSeq += ", (" + seq[i] + " " + counter + ")"
    }
    var endTime = Date.now()
    var fileText = ""
    fileText += "Finished realizing attempt in" + msToTime(endTime-startTime).toString() + ":\n \n"
    fileText += veryInfeasibleSeq
    var fileName = "data.txt"
    await fs.writeFile(fileName, fileText, (err) => {
        if (err) throw err;
    })
}

function msToTime(duration) {
    var milliseconds = Math.floor((duration % 1000) / 100),
      seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60),
      hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

async function awsGatherData() {
    var nList = [6] //7, 5, 6, 7, 6, 7
    var sList = [3] //3, 5, 4, 4, 5, 5

    for (var i = 0; i < nList.length; i++) {
        await gatherDataToFile(nList[i], sList[i])
    }
}

awsGatherData()

//test()

//var seqs = ds.genDSseq(3,3)
//var pruned = ds.pruneForCubic(seqs, 3)
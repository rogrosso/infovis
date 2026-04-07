import * as d3 from "d3"
import { dropdown } from "gui"
import { conScale, catScale, genDivTooltip } from "draw"

export function drawAll(divElId) {
    const divTooltip = genDivTooltip()
    const catMap = new Map()
    const catKeys = [
        "Category10",
        "Accent",
        "Dark2",
        "Paired",
        "Pastel1",
        "Set1",
    ]
    const catDefs = [
        { name: "schemeCategory10", n: 10 },
        { name: "schemeAccent", n: 8 },
        { name: "schemeDark2", n: 8 },
        { name: "schemePaired", n: 8 },
        { name: "schemePastel1", n: 9 },
        { name: "schemeSet1", n: 9 },
    ]
    for (let i = 0; i < catKeys.length; i++) {
        catMap.set(catKeys[i], catDefs[i])
    }
    const divMap = new Map()
    const divKeys = ["BrBG", "PRGn", "PiYG", "PuOr", "RdBu", "RdGy", "Spectral"]
    const divDefs = [
        { name: "interpolateBrBG" },
        { name: "interpolatePRGn" },
        { name: "interpolatePiYG" },
        { name: "interpolatePuOr" },
        { name: "interpolateRdBu" },
        { name: "interpolateRdGy" },
        { name: "interpolateSpectral" },
    ]
    for (let i = 0; i < divKeys.length; i++) {
        divMap.set(divKeys[i], divDefs[i])
    }
    const seqKeys = [
        "Blues",
        "Greens",
        "Greys",
        "Purples",
        "Viridis",
        "Magma",
        "Plasma",
        "Warm",
        "Cool",
        "Cubehelix",
        "GnBu",
        "OrRd",
    ]
    const seqDefs = [
        { name: "interpolateBlues" },
        { name: "interpolateGreens" },
        { name: "interpolateGreys" },
        { name: "interpolatePurples" },
        { name: "interpolateViridis" },
        { name: "interpolateMagma" },
        { name: "interpolatePlasma" },
        { name: "interpolateWarm" },
        { name: "interpolateCool" },
        { name: "interpolateCubehelixDefault" },
        { name: "interpolateGnBu" },
        { name: "interpolateOrRd" },
    ]
    const seqMap = new Map()
    for (let i = 0; i < seqKeys.length; i++) {
        seqMap.set(seqKeys[i], seqDefs[i])
    }
    const cycKeys = ["Rainbow", "Sinebow"]
    const cycDefs = [
        { name: "interpolateRainbow" },
        { name: "interpolateSinebow" },
    ]
    const cycMap = new Map()
    for (let i = 0; i < cycKeys.length; i++) {
        cycMap.set(cycKeys[i], cycDefs[i])
    }
    let catSel = "Category10"
    let divSel = "BrBG"
    let seqSel = "Blues"
    let cycSel = "Rainbow"
    const catId = "categorical-scale"
    const divId = "divergent-scale"
    const seqId = "sequential-scale"
    const cycId = "cyclic-scale"
    const gridObj = d3.select(`#${divElId}`)
    const catDiv = gridObj.append("div").attr("class", "cell").attr("id", catId)
    const divDiv = gridObj.append("div").attr("class", "cell").attr("id", divId)
    const seqDiv = gridObj.append("div").attr("class", "cell").attr("id", seqId)
    const cycDiv = gridObj.append("div").attr("class", "cell").attr("id", cycId)

    const guiConfig = {
        divObj: catDiv,
        text: "categorical colors ",
        selection: catSel,
        keys: catMap.keys(),
        handler: catHandler,
    }
    dropdown(guiConfig)
    ;((guiConfig.divObj = divDiv), (guiConfig.text = "divergent colors "))
    guiConfig.selection = divSel
    guiConfig.keys = divMap.keys()
    guiConfig.handler = divHandler
    dropdown(guiConfig)
    guiConfig.divObj = seqDiv
    guiConfig.text = "sequential colors "
    guiConfig.selection = seqSel
    guiConfig.keys = seqMap.keys()
    guiConfig.handler = seqHandler
    dropdown(guiConfig)
    guiConfig.divObj = cycDiv
    guiConfig.text = "cyclic colors "
    guiConfig.selection = cycSel
    guiConfig.keys = cycMap.keys()
    guiConfig.handler = cycHandler
    dropdown(guiConfig)

    const width = 450
    const height = 60
    const margin = { top: 5, bottom: 1, left: 3, right: 3 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const catSVG = catDiv
        .append("svg")
        .attr("class", catId)
        .attr("width", width)
        .attr("height", height)

    const catG = catSVG
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)

    const divSVG = divDiv
        .append("svg")
        .attr("class", divId)
        .attr("width", width)
        .attr("height", height)

    const divG = divSVG
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
    
    const seqSVG = seqDiv
        .append("svg")
        .attr("class", divId)
        .attr("width", width)
        .attr("height", height)

    const seqG = seqSVG
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)

    const cycSVG = cycDiv
        .append("svg")
        .attr("class", divId)
        .attr("width", width)
        .attr("height", height)
    const cycG = cycSVG
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)

    catDiv.append("hr")
    divDiv.append("hr")
    seqDiv.append("hr")
    cycDiv.append("hr")

    const tooltipConfig = {
        mouseOver: mouseOver,
        mouseMove: mouseMove,
        mouseOut: mouseOut,
        divTooltip: divTooltip,
    }
    catScale(catG, catSel, catMap, iW, iH, tooltipConfig)
    conScale(divG, divId, divSel, divMap, iW, iH, tooltipConfig)
    conScale(seqG, seqId, seqSel, seqMap, iW, iH, tooltipConfig)
    conScale(cycG, cycId, cycSel, cycMap, iW, iH, tooltipConfig)

    function catHandler(text, value) {
        catScale(catG, value, catMap, iW, iH, tooltipConfig)
    }
    function divHandler(text, value) {
        conScale(divG, divId, value, divMap, iW, iH, tooltipConfig)
    }
    function seqHandler(text, value) {
        conScale(seqG, seqId, value, seqMap, iW, iH, tooltipConfig)
    }
    function cycHandler(text, value) {
        conScale(cycG, cycId, value, cycMap, iW, iH, tooltipConfig)
    }

    function mouseOver(divTooltip) {
        divTooltip
            .style("position", "absolute")
            .style("display", "inline-block")
    }
    function mouseMove(divTooltip, hexCol, rgbCol, pos) {
        const { x, y } = pos
        divTooltip
            .html("color: " + hexCol + ", " + rgbCol)
            .style("left", `${x + 10}px`)
            .style("top", `${y}px`)
    }
    function mouseOut(divTooltip) {
        divTooltip.style("display", "none")
    }
}

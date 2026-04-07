import * as d3 from "d3"
import { axes, conScale, transferFunctions, genDivTooltip } from "draw"
import { dropdown } from "gui"

export function drawAll(divElId) {
    let divTooltip = genDivTooltip()

    // canvas
    let colSel = "BrBG"
    const colId = "color-scale"
    const gridObj = d3.select(divElId)
    const guiDiv = gridObj.append("div").attr("class", "cell").attr("id", colId)

    const width = 450
    const sclWidth = width
    const sclHeight = 60
    const sclMargin = { top: 5, bottom: 5, left: 30, right: 10 }
    const sclW = sclWidth - sclMargin.left - sclMargin.right
    const sclH = sclHeight - sclMargin.top - sclMargin.bottom
    const sclDiv = gridObj.append("div").attr("class", "cell").attr("id", colId)
    const sclSVG = sclDiv
        .append("svg")
        .attr("class", colId)
        .attr("width", sclWidth)
        .attr("height", sclHeight)
    const sclG = sclSVG
        .append("g")
        .attr("transform", `translate(${sclMargin.left}, ${sclMargin.top})`)
        .attr("class", "color-scale-group")

    const trfWidth = width
    const trfHeight = 250
    const trfMargin = { top: 15, bottom: 30, left: 35, right: 10 }
    const trfW = trfWidth - trfMargin.left - trfMargin.right
    const trfH = trfHeight - trfMargin.top - trfMargin.bottom
    const trfDiv = gridObj.append("div").attr("class", "cell").attr("id", colId)
    const trfSVG = trfDiv
        .append("svg")
        .attr("class", colId)
        .attr("width", trfWidth)
        .attr("height", trfHeight)
    const axisG = trfSVG
        .append("g")
        .attr("transform", `translate(${trfMargin.left}, ${trfMargin.top})`)
        .attr("class", "color-scale-axis-group")
    const trfG = trfSVG
        .append("g")
        .attr("transform", `translate(${trfMargin.left}, ${trfMargin.top})`)
        .attr("class", "transfer-function-group")

    // color scales
    const colMap = new Map()
    const colKeys = [
        "BrBG",
        "RdBu",
        "Spectral",
        "Blues",
        "Viridis",
        "Magma",
        "Plasma",
        "Warm",
        "Cool",
        "Cubehelix",
        "Rainbow",
        "Sinebow",
    ]
    const colDefs = [
        { name: "interpolateBrBG" },
        { name: "interpolateRdBu" },
        { name: "interpolateSpectral" },
        { name: "interpolateBlues" },
        { name: "interpolateViridis" },
        { name: "interpolateMagma" },
        { name: "interpolatePlasma" },
        { name: "interpolateWarm" },
        { name: "interpolateCool" },
        { name: "interpolateCubehelixDefault" },
        { name: "interpolateRainbow" },
        { name: "interpolateSinebow" },
    ]
    for (let i = 0; i < colKeys.length; i++) {
        colMap.set(colKeys[i], colDefs[i])
    }

    // draw menue
    const guiConfig = {
        divObj: guiDiv,
        text: "color scale: ",
        selection: colSel,
        keys: colMap.keys(),
        handler: colHandler,
    }
    dropdown(guiConfig)

    const tooltipConfig = {
        mouseOver: mouseOver,
        mouseMove: mouseMove,
        mouseOut: mouseOut,
        divTooltip: divTooltip,
    }
    // color scale
    conScale(sclG, colId, colSel, colMap, sclW, sclH, tooltipConfig)

    // add svg and append axes
    const xAxisScale = d3.scaleLinear().domain([0, 1]).range([0, trfW])
    const yAxisScale = d3.scaleLinear().domain([0, 255]).range([trfH, 0])
    const yTickValues = [0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 255]
    const axisConfig = {
        selection: axisG,
        width: trfW,
        height: trfH,
        xScale: xAxisScale,
        yScale: yAxisScale,
        xPos: 0,
        yPos: 0,
        className: "color-scale-axis",
        xTickValues: undefined,
        yTickValues: yTickValues,
        xTickSize: undefined,
        yTickSize: undefined,
        xTickFormat: undefined,
        yTickFormat: undefined,
        xLabel: undefined,
        yLabel: undefined,
    }
    axes(axisConfig)
    // draw transfer functions
    transferFunctions(trfG, {
        colSel: colSel,
        colMap: colMap,
        xScale: xAxisScale,
        yScale: yAxisScale,
    })
    // save svg
    const saveSVGButton = gridObj
        .append("div")
        .attr("class", "cell")
        .attr("id", colId)
        .append("button")
        .text("save svg")
        .on("click", function () {
            saveSVG(trfSVG.node(), "transfer-functions.svg")
            saveSVG(sclSVG.node(), "color-scale.svg")
        })
    function colHandler(text, value) {
        console.log(value)
        transferFunctions(trfG, {
            colSel: value,
            colMap: colMap,
            xScale: xAxisScale,
            yScale: yAxisScale,
        })
        conScale(sclG, colId, value, colMap, sclW, sclH, tooltipConfig)
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

// save svg
function saveSVG(e, eName) {
    e.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    const svgData = e.outerHTML
    const preface = '<?xml version="1.0" standalone="no"?>\r\n'
    const svgBlob = new Blob([preface, svgData], {
        type: "image/svg+xml;charset=utf-8",
    })
    const svgUrl = URL.createObjectURL(svgBlob)
    const downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = eName
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
}

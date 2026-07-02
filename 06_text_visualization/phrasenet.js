import * as d3 from "d3"
import { Geom } from "utilities"
import { dropdown } from "gui"
import { genDivTooltip } from "draw"
import { mwcRandomFactory } from "random"
import {
    jiggle,
    fixPositions,
    attractiveForceF,
    attractiveForceA,
    repulsiveForceF,
    repulsiveForceA,
} from "layoutPhysics"

import nlp from "compromise"
import one from "compromise-one"
nlp.extend(one)

let andGraph = null
let ofGraph = null
let isGraph = null

const nodeColor = "#193556" //"#cab2d6"
const selNodeColor = "#e31a1c"

const width = 600
const height = 500
const minHeight = 6
const maxHeight = 60
const minEdgeWidth = 1
const maxEdgeWidth = 4
const beta = 1.5
const dampConst = 5
let damping = dampConst
const C = 0.45
let K = null // Fruchterman-Reingold force constant
let Kc = null // collision force constant
let Kg = null // gravitational force constant


let bbox = null

let svg_selector = null
let netwG = null
let linkG = null
let nodeG = null 
const lineGenerator = d3.line().curve(d3.curveBasis)

const divTooltip = genDivTooltip()
const offsetX = 7
const offsetY = 7

function lerp(a, b, t) {
    return a + (b - a) * t
}

// preprocess network
function preprocessNetwork(graph, width = 600, height = 500) {
    const { nodes, edges } = graph

    // compute node centrality based on degree and frequency
    // and generate a random layout for the nodes
    const random = mwcRandomFactory(12345)
    for (let n of nodes) {
        // between -width/2 and width/2, and between -height/2 and height/2
        // make domain smaller to avoid nodes going out of the drawing area
        const lw = width * 0.8
        const lh = height * 0.8
        n.x = random() * lw - lw / 2
        n.y = random() * lh - lh / 2
        n.centrality = n.frequency
        n.xprev = 0
        n.yprev = 0
        n.vx = 0
        n.vy = 0
        n.fx = 0
        n.fy = 0
    }
    const edgeFrequencies = edges.map((e) => e.frequency)
    const maxEdgeFrequency = d3.max(edgeFrequencies)
    const minEdgeFrequency = d3.min(edgeFrequencies)
    for (let e of edges) {
        e.weight = lerp(minEdgeWidth, maxEdgeWidth, (e.frequency - minEdgeFrequency) / (maxEdgeFrequency - minEdgeFrequency))
        nodes[e.source].centrality += e.frequency
        nodes[e.target].centrality += e.frequency
    }
    // compute max and min centrality
    const centralities = nodes.map((n) => n.centrality)
    const maxCentrality = d3.max(centralities)
    const minCentrality = d3.min(centralities)
    // compute text size for each node based on centrality
    for (let n of nodes) {
        const t = (n.centrality - minCentrality) / (maxCentrality - minCentrality)
        n.textHeight = lerp(minHeight, maxHeight, t)
    }

    // compute text width: first render text, the compute width
    // --- STEP 1: PRE-COMPUTE WITH HIDDEN SCRATCHPAD ---
    const scratchpad = d3.select("body").append("svg")
        .style("position", "absolute").style("top", "-9999px")
        .append("text")

    for (let n of nodes) {
        scratchpad.style("font-size", n.textHeight + "px").text(n.name)
        n.textWidth = scratchpad.node().getComputedTextLength()
        // set a radius to weight gravitation force based on text width and height
        n.r = Math.sqrt((n.textWidth / 2) ** 2 + (n.textHeight / 2) ** 2)
    }
    scratchpad.remove()
}

// compute unique nodes and edges from a match object returned by compromise
// compute the frequency of each node and edge, and return an object with nodes and edges arrays
function buildGraphFromMatch(match) {
    const nodeMap = new Map()
    const edgeMap = new Map()
    match.forEach(m => {
        const terms = m.terms().out('array')
        if (!terms[0] || !terms[2]) return
        const a = terms[0].toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
        const b = terms[2].toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
        
        nodeMap.set(a, (nodeMap.get(a) || 0) + 1)
        nodeMap.set(b, (nodeMap.get(b) || 0) + 1)
        const key = [a, b].sort().join(' || ')
        edgeMap.set(key, (edgeMap.get(key) || 0) + 1)
    })
    // construct array of nodes and edges for the "and" graph
    const nodeIndex = new Map()
    const nodes = []
    const edges = []
    nodeMap.forEach((freq, word) => {
        nodeIndex.set(word, nodes.length)
        nodes.push({ name: word, frequency: freq, index: nodes.length })
    })
    edgeMap.forEach((freq, key) => {
        const [a, b] = key.split(' || ')
        edges.push({ source: nodeIndex.get(a), target: nodeIndex.get(b), frequency: freq })
    })
    return { nodes: nodes, edges: edges }
}
// Construct three graphs from the text using compromise:
// 1. a graph using "and" as connector, coordinates and associates
// 2. a graph using "of" as connector, possessives and partitives
// 3. a graph using "is" as connector, identifications and appositives
function buildGraphs(text) {
    const doc = nlp(text)
    const match_and = doc.match('(#Noun) and (#Noun)')
    const match_of = doc.match('(#Noun) of (#Noun)')
    const match_is = doc.match('(#Noun) is (#Noun)')

    const andGraph = buildGraphFromMatch(match_and)
    const ofGraph = buildGraphFromMatch(match_of)
    const isGraph = buildGraphFromMatch(match_is)
    
    return { andGraph, ofGraph, isGraph }
}

export function drawAll(menuSelector, svgSelector, text) {
    // clean text for processing
    text = text.replace(/^\d+\.?\s*$/gm, '');  // remove section numbers
    text = text.replace(/--/g, ' ');             // replace em-dashes
    text = text.replace(/\b\w+-\w+\b/g, '');    // remove hyphenated compounds
    text = text.replace(/'\s*s\b/g, '');  // removes 's
    ({ andGraph, ofGraph, isGraph } = buildGraphs(text));

    // preprocess graphs to compute centrality and text size
    preprocessNetwork(andGraph, width, height)
    preprocessNetwork(ofGraph, width, height)
    preprocessNetwork(isGraph, width, height)

    // draw 
    const menuCanvas = d3.select(menuSelector)
    const svgCanvas = d3.select(svgSelector)

    const pKeys = ["and", "of", "is"]
    let pSel = "and"
    const pId = "layout-menu"
    const pDiv = menuCanvas.append("div").attr("class", "cell").attr("id", pId)
    const guiConfig = {
        divObj: pDiv,
        text: "Connector: ",
        selection: pSel,
        keys: pKeys,
        handler: connectorHandler,
    }
    dropdown(guiConfig)
    svg_selector = svgSelector
    // create svg canvas and draw the initial graph with "and" connector
    const svg = svgCanvas
        .append("svg")
        .attr("class", "svg")
        .attr("width", width)
        .attr("height", height)
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white")
        .attr("stroke", "tan")
    netwG = svg
        .append("g")
        .attr("class", "force-directed-layout-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
    K = C * Math.sqrt((width * height) / andGraph.nodes.length)
    Kc = 1500
    Kg = 1
    drawGraph(netwG, andGraph, "and")
}

// clear svg canvas and draw the graph with the given connector
export function drawGraph(group, graph, connector, width = 600, height = 500) {
    const margin = { top: 20, right: 20, bottom: 20, left: 20 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    bbox = { xmin: -innerWidth / 2, xmax: innerWidth / 2, ymin: -innerHeight / 2, ymax: innerHeight / 2 }
    
    group.selectAll("*").remove() // clear canvas
    const { nodes, edges } = graph
    const nrNodes = nodes.length
    const nrEdges = edges.length
    
    // d3
    const gamma = 0.5
    linkG = group
        .append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("path")
        .data(edges)
        .join("path")
        .attr("d", (d) => {
            const source = nodes[d.source] // nMap.get(d.source)
            const target = nodes[d.target] //nMap.get(d.target)
            const d0 = [source.x, source.y]
            const d2 = [target.x, target.y]
            const x = (d0[0] + d2[0]) / 2
            const y = (d0[1] + d2[1]) / 2
            const vx = (d2[0] - d0[0]) / 2
            const vy = (d2[1] - d0[1]) / 2
            const d1 = [x - gamma * vy, y + gamma * vx]
            return lineGenerator([d0, d1, d2])
        })
        .attr("stroke-width", (d) => d.weight)
        .attr("fill", "none")
        .attr("opacity", 0.6)
    nodeG = group.selectAll("text").data(nodes)
        .join("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", d => d.textHeight)
        .attr("font-family", "Impact, sans-serif")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr('fill', nodeColor) 
        .text(d => d.name)
        .on("mouseover", function (event, d) {
            mouseOver(divTooltip, event, d)
        })
        .on("mousemove", function (event, d) {
            mouseMove(divTooltip, event, d)
        })
        .on("mouseleave", function (event, d) {
            mouseLeave(divTooltip, event, d)
        })
        .call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragend)
        )

    // animaiton
    const disp = nodes.map((n) => {
        return { d: 0, x: 0, y: 0, id: n.index }
    })
    //let nr_iterations = 0
    animate()
    function animate() {
        requestAnimationFrame(animate)
        if (damping > 1) damping *= 0.999
        positionVerlet(nodes, edges, bbox, disp)
        fixPositions(nodes, bbox)
        redraw(nodes)
    }

    function dragstarted(event, d) {
        damping = dampConst
        const x = event.sourceEvent.pageX + offsetX
        const y = event.sourceEvent.pageY - offsetY
        divTooltip
            .style("display", "inline-block")
            .html(d.name)
            .style("left", `${x}px`)
            .style("top", `${y}px`)
        d3.select(this)
            .attr('fill', selNodeColor)
    }
    function dragged(event, d) {
        const x = event.sourceEvent.pageX + offsetX
        const y = event.sourceEvent.pageY - offsetY
        divTooltip.html(d.name).style("left", `${x}px`).style("top", `${y}px`)
        event.subject.x = event.x
        event.subject.y = event.y
    }
    function dragend(event, d) {
        divTooltip.style("display", "none")
        d3.select(this)
            .attr('fill', nodeColor)
    }
    function mouseOver(divTooltip, event, d) {
        divTooltip.style("display", "inline-block")
        const x = event.pageX + offsetX
        const y = event.pageY - offsetY
        divTooltip.html(d.name).style("left", `${x}px`).style("top", `${y}px`)
    }
    function mouseMove(divTooltip, event, d) {
        const x = event.pageX + offsetX
        const y = event.pageY - offsetY
        divTooltip.html(d.name).style("left", `${x}px`).style("top", `${y}px`)
    }
    function mouseLeave(divTooltip, event, d) {
        divTooltip.style("display", "none")
    }
}

function redraw(nodes) {
    nodeG
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
    linkG.attr("d", (d) => {
        const source = nodes[d.source]
        const target = nodes[d.target]
        const d0 = [source.x, source.y]
        const d2 = [target.x, target.y]
        const x = (d0[0] + d2[0]) / 2
        const y = (d0[1] + d2[1]) / 2
        const vx = (d2[0] - d0[0]) / 2
        const vy = (d2[1] - d0[1]) / 2
        const d1 = [x - beta * vy, y + beta * vx]
        return lineGenerator([d0, d1, d2])
    })
}

function connectorHandler(text, value) {
    damping = dampConst
    if (value === "and") {
        K = C * Math.sqrt((width * height) / andGraph.nodes.length)
        Kc = 30
        Kg = 1000
        drawGraph(netwG, andGraph, "and")
    } else if (value === "of") {
        K = C * Math.sqrt((width * height) / ofGraph.nodes.length)
        Kc = 1500
        Kg = 1
        drawGraph(netwG, ofGraph, "of")
    } else if (value === "is") {
        K = C * Math.sqrt((width * height) / isGraph.nodes.length)
        Kc = 1500
        Kg = 1
        drawGraph(netwG, isGraph, "is")
    }
}

// Physiscs
function initDisplacements(disp) {
    for (let d of disp) {
        d.x = 0
        d.y = 0
        d.d = 0
    }
}
function conservativeForces(K, Kc, Kg, beta, nodes, edges, bbox, disp) {
    initDisplacements(disp)
    // compute displacements from repelling forces
    const nrNodes = nodes.length
    for (let i = 0; i < nrNodes; i++) {
        for (let j = i + 1; j < nrNodes; j++) {
            repulsiveForceF(K, nodes[i], nodes[j], disp)
            collisionForce(Kc, beta, nodes[i], nodes[j], disp)
        }
        gravitationalForce(Kg, nodes[i], bbox, disp)
    }
    // compute displacements from attracting forces
    for (let e of edges) {
        attractiveForceF(K, nodes[e.source], nodes[e.target], disp)
    }
}
function positionVerlet(nodes, edges, bbox, disp) {
    
    // compute conservative forces
    conservativeForces(K, Kc, Kg, beta, nodes, edges, bbox, disp)
    // update position, velocity and acceleration
    const w = damping
    const h = 0.008
    for (let n of nodes) {
        // position Verlet
        const fx = disp[n.index].x - w * n.vx + 0.001 * jiggle() // add some noise
        const fy = disp[n.index].y - w * n.vy + 0.001 * jiggle() // add some noise
        const dx = n.x - n.xprev + fx * h * h
        const dy = n.y - n.yprev + fy * h * h
        n.xprev = n.x
        n.yprev = n.y
        n.x = n.x + dx
        n.y = n.y + dy
        n.vx = dx / h //(n.x - n.xprev) / h
        n.vy = dy / h // (n.y - n.yprev) / h
    }
}

const rnd = mwcRandomFactory(12345)
function jiggleDist() {
    return (rnd() - 0.5) * 1e-6
}
function distance(n1,n2) {
    return Geom.directionDist2(n1, n2, jiggleDist)
}

// collision force to avoid overlapping nodes
function collisionForce(k, beta, n1, n2, disp) {
    const d = distance(n1, n2) // vector pointing from node n1 to node n2
    const s = beta * (n1.r + n2.r)
    const r = d.d - s 
    const alpha = 0.05
    if (r < 0) {
        const fr = (d.d > alpha) ? k * Math.abs(r / d.d) : k * Math.abs(r / alpha)
        disp[n1.index].x -= fr * d.x
        disp[n1.index].y -= fr * d.y
        disp[n2.index].x += fr * d.x
        disp[n2.index].y += fr * d.y
    }
}
// gravitational force to keep the network in the center of the drawing area
// and avoid nodes with few neighbors (or disconnected) to go out of the drawing area
function gravitationalForce(kg, n, bbox, disp) {
    const center = { x: (bbox.xmax + bbox.xmin) / 2, y: (bbox.ymax + bbox.ymin) / 2 }
    const d = distance(n, center)
    const r = n.r
    const g =  kg 
    disp[n.index].x += g * d.d * d.x
    disp[n.index].y += g * d.d * d.y
}

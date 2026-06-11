import * as d3 from "d3"
import { dropdown } from "gui"
import { genDivTooltip } from "draw"
import { Vec, keyCantor } from "utilities"
import { easyRandom, mwcRandomFactory } from "random"
import { preprocessNetwork } from "networkUtils"

// global variables
const dampConst = 10
let damping = dampConst
let dragNode = false


// Compute neighborhood of a node, then compute
// all pairs shortest paths with BFS
function initKamadaKawai(nodes, edges, L, K, width, height) {
    // Use a seeded random generator to make the layout deterministic for reproducible results
    const rnd = mwcRandomFactory(42)
    const nrNodes = nodes.length
    const neighbors = new Array(nrNodes).fill(null).map(() => [])
    for (let e of edges) {
        neighbors[e.source].push(e.target)
        neighbors[e.target].push(e.source)
    }
    // Init helper data structures
    const distanceMatrix = Array(nrNodes).fill(null).map(() => new Array(nrNodes).fill(null).map( e => ({l: Infinity, k: 0})))
    const nDist = Array(nrNodes).fill(null).map( e =>({v: false, d: Infinity, p: -2}))
    
    // mein loop to compute all pairs shortest paths
    for (let i = 0; i < nrNodes; i++) {
        // init nDist
        for (let d of nDist) {
            d.v = false
            d.d = Infinity
            d.p = -2
        }
        nDist[i].d = 0
        nDist[i].v = true
        nDist[i].p = -1
        const q = [i] // queue  
        while (q.length > 0) {
            const s = q.shift()
            const d = nDist[s].d   
            for (let n of neighbors[s]) {
                const nData = nDist[n]
                if (nData.v === false) {
                    nData.v = true
                    nData.p = s 
                    nData.d = d + 1
                    q.push(n)
                }
            }
        }
        // fill into die distance matrix
        for (let j = 0; j < nrNodes; j++) {
            if (i === j) {
                distanceMatrix[i][j].l = 0
                distanceMatrix[i][j].k = 0
                continue
            }
            if (!Number.isFinite(nDist[j].d)) {
                distanceMatrix[i][j].l = 0
                distanceMatrix[i][j].k = 0
                continue
            }
            distanceMatrix[i][j].l = L * nDist[j].d
            distanceMatrix[i][j].k = K / (nDist[j].d * nDist[j].d)
           //if (nDist[j].d > maxDist) maxDist = nDist[j].d
        }
    }
    //console.log("maxDist: ", maxDist)
    // set node's data
    for (let index = 0; index < nrNodes; index++) {
        nodes[index].index = index
        nodes[index].x = width * (rnd() - 0.5)
        nodes[index].y = height * (rnd() - 0.5)
        nodes[index].xprev = 0
        nodes[index].yprev = 0
        nodes[index].vx = 0
        nodes[index].vy = 0
        nodes[index].r = 0
        nodes[index].c = 0
        nodes[index].degree = 0
    }
    // compute nodes degree and centrality
    for (let e of edges) {
        nodes[e.source].degree++
        nodes[e.target].degree++
    }   
    // compute node centrality and radius
    let minC = Infinity
    let maxC = -Infinity
    for (let n of nodes) {
        n.c = n.degree
        if (n.c < minC) minC = n.c
        if (n.c > maxC) maxC = n.c
    }
    
    const lerp = (domain, range, u) => {
        return (
            range[0] +
            ((u - domain[0]) / (domain[1] - domain[0])) *
                (range[1] - range[0])
        )
    }
    const domain = [minC, maxC]
    const range = [4, 16]
    nodes.forEach((n) => (n.r = lerp(domain, range, n.c)))  


    // return the distance matrix, which is needed for the force computation
    return distanceMatrix
}

// Use a seeded random generator to make the layout deterministic for reproducible results
const rndD = mwcRandomFactory(42)
function distance(n1, n2) {
    let dx = n2.x - n1.x
    let dy = n2.y - n1.y
    if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
        dx = (rndD()-0.5) * 1e-4
        dy = (rndD()-0.5) * 1e-4
    }
    const d = Math.sqrt(dx * dx + dy * dy)
    return { x: dx/d, y: dy/d, d: d }
}

function fixPositions(nodes, bbox) {
    // shift center of network to center of bbox
    const pos = { x: 0, y: 0 }
    nodes.forEach((n) => {
        pos.x += n.x
        pos.y += n.y
    })
    pos.x /= nodes.length
    pos.y /= nodes.length
    pos.x = (bbox.xmax + bbox.xmin) / 2 - pos.x
    pos.y = (bbox.ymax + bbox.ymin) / 2 - pos.y
    nodes.forEach((n) => {
        n.x += pos.x
        n.y += pos.y
    })
    nodes.forEach((n) => {
        if (n.x < bbox.xmin) n.x = bbox.xmin
        if (n.x > bbox.xmax) n.x = bbox.xmax
        if (n.y < bbox.ymin) n.y = bbox.ymin
        if (n.y > bbox.ymax) n.y = bbox.ymax
    })
}
function conservativeForce(nodes, distanceMatrix, disp) {
    // compute for each pair of nodes, same as collision force
    const nrNodes = nodes.length
    for (let i = 0; i < nrNodes; i++) {
        for (let j = i + 1; j < nrNodes; j++) {
            const d = distance(nodes[i], nodes[j]) // vector pointing from node i to node j
            const fa = distanceMatrix[i][j].k * (d.d - distanceMatrix[i][j].l)
            // attractive force if d.d > l, repulsive force if d.d < l
            disp[i].x += fa * d.x 
            disp[i].y += fa * d.y
            disp[j].x -= fa * d.x
            disp[j].y -= fa * d.y
        }   
    }
}

function step(nodes, distanceMatrix, disp, bbox) {
    // init displacements
    for (let d of disp) {
        d.x = 0
        d.y = 0
    }
    // conservative forces
    conservativeForce(nodes, distanceMatrix, disp)
    // position Verlet integration
    const w = damping
    const h = 0.008
    for (let n of nodes) {
        // position Verlet
        const fx = disp[n.index].x - w * n.vx 
        const fy = disp[n.index].y - w * n.vy 
        const dx = n.x - n.xprev + fx * h * h
        const dy = n.y - n.yprev + fy * h * h
        n.xprev = n.x
        n.yprev = n.y
        n.x = n.x + dx
        n.y = n.y + dy
        n.vx = dx / h 
        n.vy = dy / h 
    }
    // fix positions
    fixPositions(nodes, bbox)
}

// Implement Kamada-Kawai force-directed layout algorithm
function kkGradient(index, nodes, distanceMatrix) {
    const n = nodes[index]
    let gradX = 0
    let gradY = 0
    for (let j = 0; j < nodes.length; j++) {
        if (j === index) continue
        const m = nodes[j]
        const k = distanceMatrix[index][j].k
        if (k === 0) continue
        const d = distance(n, m)
        const l = distanceMatrix[index][j].l
        gradX -= k * (d.d - l) * d.x
        gradY -= k * (d.d - l) * d.y
    }
    return { gradX, gradY }
}
function kkMaxError(gradients) {
    let maxError = -Infinity
    let index = -1
    for (let g of gradients) {
        const error = Math.sqrt(g.x * g.x + g.y * g.y)
        if (error > maxError) {
            maxError = error
            index = g.index
        }
    }
    return {error: maxError, index: index}
}
// Newton Raphson method to optimize the position of a node
function kkOptimize(index, nodes, distanceMatrix) {
    const n = nodes[index]
    let error = Infinity
    let iter = 0
    const epsilon = 1e-3
    const maxIter = 400
    while(error > epsilon && iter < maxIter) {
        let gradX = 0
        let gradY = 0
        let gradXX = 0
        let gradYY = 0
        let gradXY = 0
        for (let j = 0; j < nodes.length; j++) {
            if (j === index) continue
            const m = nodes[j]
            const k = distanceMatrix[index][j].k
            if (k === 0) continue
            const d = distance(n, m)
            const l = distanceMatrix[index][j].l
            gradX -= k * (d.d - l) * d.x
            gradY -= k * (d.d - l) * d.y
            gradXX += k * (1 - l * d.y * d.y / d.d)
            gradYY += k * (1 - l * d.x * d.x / d.d)
            gradXY += k * l * d.x * d.y / d.d
        }
        error = Math.hypot(gradX, gradY)
        if (error <= epsilon) {
            return
        }
        const denom = gradXX * gradYY - gradXY * gradXY
        if (!Number.isFinite(denom) || Math.abs(denom) < 1e-12) {
            return
        }
        const dx = (gradYY * gradX - gradXY * gradY) / denom
        const dy = (gradXX * gradY - gradXY * gradX) / denom
        n.x -= dx
        n.y -= dy
        iter++
    }
}
// This function computes the position of the nodes
function kamadaKawai(nodes, distanceMatrix, bbox) {
    // initialize gradients
    const gradients = nodes.map((n) => {
        return { x: 0, y: 0, index: n.index }
    })
    for (let n of nodes) {
        const {gradX, gradY} = kkGradient(n.index, nodes, distanceMatrix)
        gradients[n.index].x = gradX
        gradients[n.index].y = gradY
    }
    // algorithm
    const epsilon = 1e-4
    const maxIter = 400
    let iter = 0
    let {error, index} = kkMaxError(gradients)
    while (error > epsilon && iter < maxIter) {
        kkOptimize(index, nodes, distanceMatrix)
        // update gradients
        for (let n of nodes) {
            const {gradX, gradY} = kkGradient(n.index, nodes, distanceMatrix)
            gradients[n.index].x = gradX
            gradients[n.index].y = gradY
        }
        const res = kkMaxError(gradients)
        error = res.error
        index = res.index
        iter++
    }
    fixPositions(nodes, bbox)

}

export function drawAll1(divElId, data) {
    // canvas size
    const width = 500
    const height = 500
    // data: set a reasonable name
    const lesmiserables = data
    lesmiserables.edges = lesmiserables.links
    delete lesmiserables.links
    // check data structure
    preprocessNetwork(lesmiserables)

    // tooltip
    const divTooltip = genDivTooltip()
    
    //============================================================================
    // drawing
    const canvas = d3.select(divElId)
    
    // D3
    const minNodeRadius = 4
    const maxNodeRadius = 16
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"
    const offsetX = 7
    const offsetY = 7
    const margin = { top: 15, bottom: 15, left: 15, right: 15 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const svg = canvas
        .append("svg")
        .attr("class", "kamada-kawai-svg")
        .attr("width", width)
        .attr("height", height)
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white")
        .attr("stroke", "tan")
    const netwG = svg
        .append("g")
        .attr("class", "kamada-kawai-force-directed-layout-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)

    // simulation Kamada-Kawai
    const sc = 0.8 // scaling factor for the layout
    const L = sc * width / 5 // ideal Euclidean distance: canvas_size / max_ij d_ij
    const K = 30 // spring stiffness constant
    const radius = 200
    const { nodes, edges } = lesmiserables
    const nrNodes = nodes.length
    const distanceMatrix = initKamadaKawai(nodes, edges, L, K, iW, iH)
    const bbox = {
            xmin: -iW / 2,
            xmax: iW / 2,
            ymin: -iH / 2,
            ymax: iH / 2,
        }    
    // compute layout
    const sortedNodes = []
    nodes.forEach((n) => sortedNodes.push(n))
    sortedNodes.sort((n1, n2) => {
        return n1.c - n2.c
    })

    // d3
    const lineGenerator = d3.line().curve(d3.curveBasis)
    // collects groups of nodes
    const gSet = new Set()
    nodes.forEach((n) => {
        gSet.add(n.group)
    })
    const colors = [
        "#a6cee3",
        "#1f78b4",
        "#b2df8a",
        "#33a02c",
        "#fb9a99",
        "#e31a1c",
        "#fdbf6f",
        "#ff7f00",
        "#cab2d6",
        "#6a3d9a",
        "#D2691E",
        "#b15928",
    ]
    const colorScale = d3
        .scaleOrdinal()
        .domain(Array.from(gSet).sort())
        .range(colors)

    const beta = 0.2
    const linkG = netwG
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
            const d1 = [x - beta * vy, y + beta * vx]
            return lineGenerator([d0, d1, d2])
        })
        .attr("stroke", (d) => {
            const source = nodes[d.source]
            const target = nodes[d.target]
            const g = source.c > target.c ? source.group : target.group
            return colorScale(g)
        })
        .attr("stroke-width", (d) => Math.sqrt(d.value))
        .attr("fill", "none")
        .attr("opacity", 0.6)
    const nodeG = netwG
        .append("g")
        .attr("stroke", nodeStrokeColor)
        .attr("stroke-width", nodeStrokeWidth)
        .selectAll("circle")
        .data(sortedNodes)
        .join("circle")
        .attr("r", (d) => d.r)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("fill", (d) => colorScale(d.group))
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
    nodeG.append("title").text((d) => d.name)

    function dragstarted(event, d) {
        dragNode = true
        const x = event.sourceEvent.pageX + offsetX
        const y = event.sourceEvent.pageY - offsetY
        divTooltip
            .style("display", "inline-block")
            .html(d.name)
            .style("left", `${x}px`)
            .style("top", `${y}px`)
        d3.select(this)
            .attr("stroke", selNodeStrokeColor)
            .attr("stroke-width", selNodeStrokeWidth)
    }
    function dragged(event, d) {
        const x = event.sourceEvent.pageX + offsetX
        const y = event.sourceEvent.pageY - offsetY
        divTooltip.html(d.name).style("left", `${x}px`).style("top", `${y}px`)
        event.subject.x = event.x
        event.subject.y = event.y
    }
    function dragend(event, d) {
        dragNode = false
        divTooltip.style("display", "none")
        damping = dampConst
        d3.select(this)
            .attr("stroke", nodeStrokeColor)
            .attr("stroke-width", nodeStrokeWidth)
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

    // interaction
    
    // animaiton
    const disp = nodes.map((n) => {
        return { d: 0, x: 0, y: 0, id: n.index }
    })
    animate()
    function animate() {
        requestAnimationFrame(animate)
        //if (!dragNode) {
            if (damping > 3) damping *= 0.999
            step(nodes, distanceMatrix, disp, bbox)
        //}
        redraw(nodeG, linkG)
    }
    function redraw(nodeG, linkG) {
        nodeG.attr("cx", (d) => d.x).attr("cy", (d) => d.y)
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
} // drawAll()

export function drawAll2(divElId, data) {
    // canvas size
    const width = 500
    const height = 500
    // data: set a reasonable name
    const lesmiserables = data
    lesmiserables.edges = lesmiserables.links
    delete lesmiserables.links
    // check data structure
    preprocessNetwork(lesmiserables)

    // tooltip
    const divTooltip = genDivTooltip()
    
    //============================================================================
    // drawing
    const canvas = d3.select(divElId)
    
    // D3
    const minNodeRadius = 4
    const maxNodeRadius = 16
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"
    const offsetX = 7
    const offsetY = 7
    const margin = { top: 15, bottom: 15, left: 15, right: 15 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const svg = canvas
        .append("svg")
        .attr("class", "kamada-kawai-svg")
        .attr("width", width)
        .attr("height", height)
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "white")
        .attr("stroke", "tan")
    const netwG = svg
        .append("g")
        .attr("class", "kamada-kawai-force-directed-layout-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)

    // simulation Kamada-Kawai
    const sc = 0.8 // scaling factor for the layout
    const L = sc * width / 5 // ideal Euclidean distance: canvas_size / max_ij d_ij
    const K = 30 // spring stiffness constant
    const radius = 200
    const { nodes, edges } = lesmiserables
    const nrNodes = nodes.length
    const distanceMatrix = initKamadaKawai(nodes, edges, L, K, iW, iH)
    const bbox = {
            xmin: -iW / 2,
            xmax: iW / 2,
            ymin: -iH / 2,
            ymax: iH / 2,
        }    

    // compute layout
    kamadaKawai(nodes, distanceMatrix, bbox)

    //const { nodes, edges, bbox } = initNetwork(lesmiserables, iW, iH) // draw(lesmiserables, iW, iH)
    const sortedNodes = []
    nodes.forEach((n) => sortedNodes.push(n))
    sortedNodes.sort((n1, n2) => {
        return n1.c - n2.c
    })

    // d3
    const lineGenerator = d3.line().curve(d3.curveBasis)
    // collects groups of nodes
    const gSet = new Set()
    nodes.forEach((n) => {
        gSet.add(n.group)
    })
    const colors = [
        "#a6cee3",
        "#1f78b4",
        "#b2df8a",
        "#33a02c",
        "#fb9a99",
        "#e31a1c",
        "#fdbf6f",
        "#ff7f00",
        "#cab2d6",
        "#6a3d9a",
        "#D2691E",
        "#b15928",
    ]
    const colorScale = d3
        .scaleOrdinal()
        .domain(Array.from(gSet).sort())
        .range(colors)

    const beta = 0.2
    const linkG = netwG
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
            const d1 = [x - beta * vy, y + beta * vx]
            return lineGenerator([d0, d1, d2])
        })
        .attr("stroke", (d) => {
            const source = nodes[d.source]
            const target = nodes[d.target]
            const g = source.c > target.c ? source.group : target.group
            return colorScale(g)
        })
        .attr("stroke-width", (d) => Math.sqrt(d.value))
        .attr("fill", "none")
        .attr("opacity", 0.6)
    const nodeG = netwG
        .append("g")
        .attr("stroke", nodeStrokeColor)
        .attr("stroke-width", nodeStrokeWidth)
        .selectAll("circle")
        .data(sortedNodes)
        .join("circle")
        .attr("r", (d) => d.r)
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("fill", (d) => colorScale(d.group))
        
    nodeG.append("title").text((d) => d.name)

    
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
} // drawAll()2


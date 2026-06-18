import * as d3 from "d3"
import { dropdown } from "gui"
import { genDivTooltip } from "draw"
import { easyRandom } from "random"
import { keyCantor } from "utilities"
import { fixPositions, positionVerlet } from "layoutPhysics"
import { betweenness } from "centrality"

export function drawAll(menuDivId, svgDivId, lesmiserables, test05) {
    const width = 500
    const height = 500
    const margin = { top: 5, bottom: 5, left: 5, right: 5 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom
    const minNodeRadiusLesMiserables = 4
    const maxNodeRadiusLesMiserables = 16
    const minNodeRadiusTest05 = 10
    const maxNodeRadiusTest05 = 16
    let minNodeRadius = minNodeRadiusLesMiserables
    let maxNodeRadius = maxNodeRadiusLesMiserables
    const beta = 0.2

    // Physics parameters
    const C = 0.45 // 0.52 // 0.4537 // 3 // 0.399
    let K = null // this has to be set, when the number of nodes is known
    const Kg = 30 // 0.5
    const Kc = 1500 // 1500
    const cR = 2 // collision radius control
    const dampConst = 10
    let damping = dampConst

    // draw
    const divTooltip = genDivTooltip()

    // ============================================================================
    // helper function
    function lerp (domain, range, u) {
        return (
            range[0] +
            ((u - domain[0]) / (domain[1] - domain[0])) *
                (range[1] - range[0])
        )
    }
    function selector(target) {
        if (typeof target !== "string") return target
        return target.startsWith("#") || target.startsWith(".") ? target : `#${target}`
    }
    // drawing
    const menuCanvas = d3.select(selector(menuDivId))
    const svgCanvas = d3.select(selector(svgDivId))

    // Menu gui
    // select network
    const nKeys = ["lesmiserables", "test05"]
    let nSel = "lesmiserables"
    const nId = "data-menu"
    const nDiv = menuCanvas.append("div").attr("class", "cell").attr("id", nId)
    const guiConfig = {
        divObj: nDiv,
        text: "network: ",
        selection: nSel,
        keys: nKeys,
        handler: networkHandler,
    }
    dropdown(guiConfig)
    // select centrality
    const mKeys = ["betweenness","degree"]
    let mSel = "betweenness"
    const mId = "centrality-menu"
    const mDiv = menuCanvas.append("div").attr("class", "cell").attr("id", mId)
    guiConfig.divObj = mDiv
    guiConfig.text = "node centrality: "
    guiConfig.selection = mSel
    guiConfig.keys = mKeys
    guiConfig.handler = centralityHandler
    dropdown(guiConfig)
    
    // D3
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"
    const offsetX = 7
    const offsetY = 7
    
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
    const netwG = svg
        .append("g")
        .attr("class", "force-directed-layout-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`)
    let { nodes, edges,
        minDeg,
        maxDeg,
        minC,
        maxC,
        bbox,
    } = initNetwork(lesmiserables, iW, iH, minNodeRadius, maxNodeRadius)
    K = C * Math.sqrt((iW * iH) / nodes.length)
    
    const sortedNodes = []
    nodes.forEach((n) => sortedNodes.push(n))
    sortedNodes.sort((n1, n2) => {
        return n1.c - n2.c
    })
    function centralityHandler(text, value) {
        if (value === "degree") {
            for (let n of nodes) n.r = lerp([minDeg, maxDeg], [minNodeRadius, maxNodeRadius], n.degree)
        } else if (value === "betweenness") { 
            for (let n of nodes) n.r = lerp([n.minC, n.maxC], [minNodeRadius, maxNodeRadius], n.c)
        }
    }
    function networkHandler(text, value) {
        let data = null
        if (value === "lesmiserables") {
            data = lesmiserables
            minNodeRadius = minNodeRadiusLesMiserables
            maxNodeRadius = maxNodeRadiusLesMiserables
        } else if (value === "test05") {
            data = test05
            minNodeRadius = minNodeRadiusTest05
            maxNodeRadius = maxNodeRadiusTest05
        }
        const network = initNetwork(data, iW, iH, minNodeRadius, maxNodeRadius)
        nodes = network.nodes
        edges = network.edges
        minDeg = network.minDeg
        maxDeg = network.maxDeg
        minC = network.minC
        maxC = network.maxC
        bbox = network.bbox
        K = C * Math.sqrt((iW * iH) / nodes.length)
        drawNetwork(netwG, nodes, edges, beta, lineGenerator)
    }
    
    let linkG = null
    let nodeG = null
    // line generator
    const lineGenerator = d3.line().curve(d3.curveBasis)
    drawNetwork(netwG, nodes, edges, beta, lineGenerator)

    function drawNetwork(netwG, nodes, edges, beta, lineGenerator) {
        netwG.selectAll("*").remove()
        // d3
        // line generator
        //const lineGenerator = d3.line().curve(d3.curveBasis)
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

        //const beta = 0.2
        linkG = netwG
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
        nodeG = netwG
            .append("g")
            .attr("stroke", nodeStrokeColor)
            .attr("stroke-width", nodeStrokeWidth)
            .selectAll("circle")
            //.data(sortedNodes)
            .data(nodes)
            .join("circle")
            .attr("r", (d) => d.r)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("fill", (d) => colorScale(d.group))
            .on("mouseover", function (event, d) {
                mouseOver(divTooltip)
            })
            .on("mousemove", function (event, d) {
                const pos = d3.pointer(event)
                mouseMove(divTooltip, d, {
                    x: event.pageX,
                    y: event.pageY
                })
            })
            .on("mouseout", function (event, d) {
                mouseOut(divTooltip)
            })
            .call(
                d3
                    .drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragend)
            )

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
            divTooltip.style("display", "none")
            d3.select(this)
                .attr("stroke", nodeStrokeColor)
                .attr("stroke-width", nodeStrokeWidth)
        }
    }
    
    // animaiton
    const disp = nodes.map((n) => {
        return { d: 0, x: 0, y: 0, index: n.index }
    })
    animate()
    function animate() {
        requestAnimationFrame(animate)
        if (damping > 3) damping *= 0.99
        positionVerlet('Fruchterman-Reingold', K, Kc, Kg, damping, cR, nodes, edges, bbox, disp)
        fixPositions(nodes, bbox)
        redraw(nodeG, linkG, beta, lineGenerator)
    }
    function redraw(nodeG, linkG, beta, lineGenerator) {
        nodeG
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("r", (d) => d.r)
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

    function initNetwork(data, width, height, minNodeRadius = 4, maxNodeRadius = 16) {
        const { nodes, links } = data
        nodes.forEach((n, index) => {
            n.index = index
            n.x = 0
            n.y = 0
            n.xprev = 0
            n.yprev = 0
            n.vx = 0
            n.vy = 0
            n.fx = 0
            n.fy = 0
            n.r = 0 
            n.c = 0
            n.degree = 0
        })
        // check data for edges
        for (let e of links) {
            if (typeof e.source === "string") e.source = +e.source
            if (typeof e.target === "string") e.target = +e.target
        }
        // check that edges are unique
        const eMap = new Map()
        for (let e of links) {
            const key = keyCantor(e.source, e.target)
            eMap.set(key, e)
        }
        const edges = [] // undirected
        for (let [key, value] of eMap) {
            edges.push({
                source: value.source,
                target: value.target,
                value: value.value,
                key: key,
            })
        }
        eMap.clear()
        // compute node's degree
        for (let e of edges) {
            nodes[e.source].degree++
            nodes[e.target].degree++
        }
        let minDeg = Infinity
        let maxDeg = -Infinity
        for (let n of nodes) {
            if (n.degree < minDeg) minDeg = n.degree
            if (n.degree > maxDeg) maxDeg = n.degree
        }
        // compute node centrality
        const A = new Array(nodes.length).fill(null).map((e) => [])
        for (let e of edges) {
            A[e.source].push(e.target)
            A[e.target].push(e.source)
        }
        const c_ = betweenness(nodes, A)
        const minC = Math.min(...c_)
        const maxC = Math.max(...c_)

        for (let i = 0; i < nodes.length; i++) {
            nodes[i].c = c_[i]
        }
        // init node Radius with degree
        for (let n of nodes) n.r = lerp([minC, maxC], [minNodeRadius, maxNodeRadius], n.c)
        // init nodes position
        const random = new easyRandom(11) // wants always the same initial positions
        for (let n of nodes) {
            n.x = -width / 2 + random() * width
            n.y = -height / 2 + random() * height
        }
        // compute bounding box
        const bbox = {
            xmin: -width / 2,
            xmax: width / 2,
            ymin: -height / 2,
            ymax: height / 2,
        }
        return {
            nodes,
            edges,
            minDeg,
            maxDeg,
            minC,
            maxC,
            bbox,
        }
    }
    function mouseOver(tooltip) {
        tooltip.style("display", "inline-block")
    }
    function mouseMove(tooltip, d, pos) {
        const text = 'name: ' + d.name + '<br>' + 'degree: ' + d.degree + '<br>' + 'betweenness centrality: ' + d.c.toFixed(4)
        const { x, y } = pos
        tooltip
            .html(text)
            .style("left", `${x + 10}px`)
            .style("top", `${y}px`)
    }
    function mouseOut(divTooltip) {
        divTooltip.style("display", "none")
    }
}

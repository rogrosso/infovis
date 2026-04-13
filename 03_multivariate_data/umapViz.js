import * as d3 from 'd3'
import * as THREE from 'three'
import { OrbitControls } from 'OrbitControls'
import {initUMAP, conservativeForces, umapCrossEntropy } from 'umap'


function normalizePointCloud(pointCloud) {
    const normalizedPoints = pointCloud.map(point => ({ ...point }))
    const maxAbsValue = Math.max(
        ...normalizedPoints.map(point => Math.abs(point.x)),
        ...normalizedPoints.map(point => Math.abs(point.y)),
        ...normalizedPoints.map(point => Math.abs(point.z))
    )

    if (maxAbsValue > 0) {
        for (const point of normalizedPoints) {
            point.x /= maxAbsValue
            point.y /= maxAbsValue
            point.z /= maxAbsValue
        }
    }

    const centerX = normalizedPoints.reduce((sum, point) => sum + point.x, 0) / normalizedPoints.length
    const centerY = normalizedPoints.reduce((sum, point) => sum + point.y, 0) / normalizedPoints.length
    const centerZ = normalizedPoints.reduce((sum, point) => sum + point.z, 0) / normalizedPoints.length

    for (const point of normalizedPoints) {
        point.x -= centerX
        point.y -= centerY
        point.z -= centerZ
    }

    return normalizedPoints
}

function computeBounds(pointCloud) {
    return pointCloud.reduce((bounds, point) => {
        bounds.minX = Math.min(bounds.minX, point.x)
        bounds.maxX = Math.max(bounds.maxX, point.x)
        bounds.minY = Math.min(bounds.minY, point.y)
        bounds.maxY = Math.max(bounds.maxY, point.y)
        bounds.minZ = Math.min(bounds.minZ, point.z)
        bounds.maxZ = Math.max(bounds.maxZ, point.z)
        return bounds
    }, {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity,
        minZ: Infinity,
        maxZ: -Infinity
    })
}

function computeShadowBounds(pointCloud, groundY, lightDirection) {
    return pointCloud.reduce((bounds, point) => {
        const shadowOffset = (groundY - point.y) / lightDirection.y
        const shadowX = point.x + lightDirection.x * shadowOffset
        const shadowZ = point.z + lightDirection.z * shadowOffset

        bounds.minX = Math.min(bounds.minX, point.x, shadowX)
        bounds.maxX = Math.max(bounds.maxX, point.x, shadowX)
        bounds.minZ = Math.min(bounds.minZ, point.z, shadowZ)
        bounds.maxZ = Math.max(bounds.maxZ, point.z, shadowZ)
        return bounds
    }, {
        minX: Infinity,
        maxX: -Infinity,
        minZ: Infinity,
        maxZ: -Infinity
    })
}

function drawThreejsPointCloud(pointCloud) {
    const container = document.getElementById('umap-threejs')
    let width = 400
    let height = 400

    if (container.clientWidth !== undefined) {
        width = parseInt(container.clientWidth)
    }
    if (container.clientHeight !== undefined) {
        height = parseInt(container.clientHeight)
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf3f4f6)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)

    const bounds = computeBounds(pointCloud)
    const groundY = bounds.minY - 0.12
    const lightDirection = new THREE.Vector3(-0.22, -1, -0.18).normalize()
    const shadowBounds = computeShadowBounds(pointCloud, groundY, lightDirection)
    const shadowSpanX = shadowBounds.maxX - shadowBounds.minX
    const shadowSpanZ = shadowBounds.maxZ - shadowBounds.minZ
    const groundScale = 1.9
    const groundWidth = shadowSpanX * groundScale
    const groundDepth = shadowSpanZ * groundScale
    const groundCenterX = (shadowBounds.minX + shadowBounds.maxX) / 2
    const groundCenterZ = (shadowBounds.minZ + shadowBounds.maxZ) / 2
    const focusY = groundY + (bounds.maxY - groundY) * 0.28
    const cameraDistance = Math.max(groundWidth, groundDepth) * 1.35
    camera.position.set(groundCenterX, focusY + 0.35, groundCenterZ + cameraDistance)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.domElement.style.border = 'solid #a0adaf'
    container.replaceChildren(renderer.domElement)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
    directionalLight.position.set(1.4, 3.0, 1.8)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 8
    directionalLight.shadow.camera.left = -2
    directionalLight.shadow.camera.right = 2
    directionalLight.shadow.camera.top = 2
    directionalLight.shadow.camera.bottom = -2
    scene.add(directionalLight)

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(groundWidth, groundDepth),
        new THREE.MeshPhongMaterial({
            color: 0xd9ddd6,
            side: THREE.DoubleSide,
            shininess: 10
        })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = groundY
    ground.position.x = groundCenterX
    ground.position.z = groundCenterZ
    ground.receiveShadow = true
    scene.add(ground)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(groundCenterX, focusY, groundCenterZ)
    controls.minDistance = 0.5
    controls.maxDistance = 10
    controls.update()

    const render = () => {
        renderer.render(scene, camera)
    }

    const spriteTexture = new THREE.TextureLoader().load(
        '../contrib/threejs/textures/sprites/circle.png',
        render
    )
    const [minT, maxT] = d3.extent(pointCloud, point => point.t)
    const colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([minT, maxT])
    const spriteScale = 0.045
    const shadowGeometry = new THREE.PlaneGeometry(spriteScale * 1.8, spriteScale * 1.8)
    const maxHeight = Math.max(bounds.maxY - groundY, 1e-6)

    for (const point of pointCloud) {
        const shadowOffset = (groundY - point.y) / lightDirection.y
        const shadowPosition = new THREE.Vector3(
            point.x + lightDirection.x * shadowOffset,
            groundY + 0.001,
            point.z + lightDirection.z * shadowOffset
        )
        const normalizedHeight = (point.y - groundY) / maxHeight
        const shadowScale = 0.7 + normalizedHeight * 0.9
        const shadowMaterial = new THREE.MeshBasicMaterial({
            map: spriteTexture,
            color: 0x000000,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            side: THREE.DoubleSide
        })
        const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
        shadow.rotation.x = -Math.PI / 2
        shadow.position.copy(shadowPosition)
        shadow.scale.setScalar(shadowScale)
        shadow.renderOrder = 1
        scene.add(shadow)

        const material = new THREE.SpriteMaterial({
            map: spriteTexture,
            color: new THREE.Color(colorScale(point.t)),
            transparent: true,
            depthWrite: false
        })
        const sprite = new THREE.Sprite(material)
        sprite.position.set(point.x, point.y, point.z)
        sprite.scale.setScalar(spriteScale)
        sprite.castShadow = false
        sprite.renderOrder = 2
        scene.add(sprite)
    }

    controls.addEventListener('change', render)

    const onResize = () => {
        const nextWidth = container.clientWidth || width
        const nextHeight = container.clientHeight || height
        camera.aspect = nextWidth / nextHeight
        camera.updateProjectionMatrix()
        renderer.setSize(nextWidth, nextHeight)
        render()
    }

    window.addEventListener('resize', onResize)
    render()
} // drawThreejsPointCloud

/************************************************************************************************************************/
// D
// 
/************************************************************************************************************************/
const dampConst = 15
const minDamping = 0.5
let damping = dampConst
let lr = 10

// Helper function: compute some noise
function jiggle() {
    return (Math.random() - 0.5) * 1e-10
}

// Scale network: the simulation in the low-dimensional space is in a small area, due to scaling of forces,
// so we need to scale the forces to make the layout more spread out and visually appealing
// We use two set of nodes, one for simulation and the other for visualization, to avoid to modify the position of the 
// nodes in the simulation, which are used to compute the forces
function scaleNetwork(q, vertices, Q_SIZE, width, height) {
    const alpha = Math.max(width, height) / Q_SIZE
    const centerX = 0 // (width - 1) / 2 the canvas is translated by (width / 2, height / 2), so the center of the layout must be at (0, 0) in the simulation coordinates
    const centerY = 0 //(height - 1) / 2
    for (let i = 0; i < vertices.length; i++) {
        vertices[i].x = q[i].x * alpha + centerX
        vertices[i].y = q[i].y * alpha + centerY
    }
}

// Implement functions for force directed layout
// The layout is computed by a dynamic system of forctes. The integration uses 
// position Verlet integration, which is a numerical method for integrating ordinary differential equations.
function initNetwork(q, vertices, edges, Q_SIZE, width, height) {
    const radius = 5 // choose a small but still visible radius for the nodes, to avoid too much overlap between them
    for (let v of q) {
        v.xprev = v.x
        v.yprev = v.y
        v.vx = 0
        v.vy = 0
    }
    q.forEach( (v, i) => {
        vertices[i].x = v.x
        vertices[i].y = v.y
        vertices[i].r = radius
        vertices[i].t = v.t
    })
    scaleNetwork(q, vertices, Q_SIZE, width, height)
    
    // compute a value in [0, 1] from the edge weights, to use it for the stroke width of the edges
    const maxWeight = Math.max(...edges.map(e => e.weight))
    for (let e of edges) {
        e.value = e.weight / maxWeight
    }
}

function fixPositions(nodes, iW, iH) {
        // shift center of network to origin, to avoid numerical instability in the optimization process, 
        // which can cause the layout to be not stable and visually unappealing
        const pos = { x: 0, y: 0 }
        nodes.forEach((n) => {
            pos.x += n.x
            pos.y += n.y
        })
        pos.x /= nodes.length
        pos.y /= nodes.length
        nodes.forEach((n) => {
            n.x -= pos.x
            n.y -= pos.y
        })
        // fix positions of the nodes to be inside the canvas, to avoid numerical instability in the optimization process,
        const min = -Math.max(iW, iH) / 2
        const max = Math.max(iW, iH) / 2
        nodes.forEach((n) => {
            if (n.x < min) n.x = min
            if (n.x > max) n.x = max
            if (n.y < min) n.y = min
            if (n.y > max) n.y = max
        })
    }

// Compute layout using a force-directed algorithm in low-dimensional space.
// Parameters:
//  - vertices: array of vertex objects, each with properties x, y, r (radius), and index
//  - edges: array of edge objects, each with properties source and target (vertex indices)
//  - lr: learning rate for the force updates
//  - disp: array of displacement vectors for each vertex, initialized to zer
function positionVerletIntegration(vertices, edges, lr, disp, a, b) {
    // this is not here, but anyway
    for (let d of disp) {
        d.x = 0
        d.y = 0
    }
    // conservative forces
    conservativeForces(vertices, edges, lr, disp, a, b)
    // update position, velocity and acceleration
    const w = damping // set damping global 
    const h = 0.008
    for (let v of vertices) {
        const xprev = v.xprev
        const yprev = v.yprev
        const fx = disp[v.index].x - w * v.vx + jiggle() // add some noise
        const fy = disp[v.index].y - w * v.vy + jiggle() // add some noise
        const dx = (v.x - xprev) + fx * h * h
        const dy = (v.y - yprev) + fy * h * h
        v.xprev = v.x
        v.yprev = v.y
        v.x += dx
        v.y += dy
        v.vx = dx / h
        v.vy = dy / h
    }
}

function drawD3PointCloud(q, edges, Q_SIZE, a, b) {
    // Parameters for the force-directed layout
    let nodeG = undefined

    // colors
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"

    // get container dimensions
    const container = document.getElementById('umap-d3js')
    let width = 400
    let height = 400
    const rect = container.getBoundingClientRect()
    if (rect.width < width) width = rect.width
    if (rect.height <height) height = rect.height

    // compute size for the drawing
    const margin = { top: 10, right: 10, bottom: 10, left: 10 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom

    // Inite network with given size
    const vertices = q.map( (v, i) => ({ index: i, x: v.x, y: v.y, r: 0 }) )
    const disp = q.map( v => ({ index: v.index, d: 0, x: 0, y: 0 }) )
    initNetwork(q, vertices, edges, Q_SIZE, iW, iH)
    
    // init Graphic
    const svg = d3.select('#umap-d3js')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background-color', '#f3f4f6')
        .style('border', 'solid #a0adaf')
    // add a group for the network
    const netG = svg
        .append('g')
        .attr('class', 'umpa-network')
        .attr('transform', `translate(${width / 2}, ${height / 2})`) // the scale function must take into account the translation of the group

    // color nodes using the t property, which is the iteration number of the optimization when the point was added to the layout
    const [minT, maxT] = d3.extent(vertices, point => point.t)
    const colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([minT, maxT])
    
    // add nodes
    nodeG = netG
            .append("g")
            .attr("stroke", nodeStrokeColor)
            .attr("stroke-width", nodeStrokeWidth)
            .selectAll("circle")
            .data(vertices)
            .join("circle")
            .attr("r", (d) => d.r)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("fill", (d) => colorScale(d.t))
            .call(
                d3
                    .drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragend)
            )
        
    function dragstarted(event, d) {
        damping = dampConst
        d3.select(this)
            .attr("stroke", selNodeStrokeColor)
            .attr("stroke-width", selNodeStrokeWidth)
    }
    function dragged(event, d) {
        // The possition have to be transformed back to the simulation coordinates, 
        // to update the position of the node in the simulation, which is used to compute the forces
        // translate to origin and down scale to simulation coordinates
        const scale = Q_SIZE / Math.max(iW, iH)
        const qIndex = d.index
        q[qIndex].x = event.x * scale
        q[qIndex].y = event.y * scale
        //event.subject.x = event.x
        //event.subject.y = event.y
    }
    function dragend(event, d) {
        d3.select(this)
            .attr("stroke", nodeStrokeColor)
            .attr("stroke-width", nodeStrokeWidth)
    }

    // Animation
    function animate() {
        requestAnimationFrame(animate)
        if (damping > minDamping) damping *= 0.99
        if (lr > 0.9) lr *= 0.999
        positionVerletIntegration(q, edges, lr, disp, a, b)
        fixPositions(q, Q_SIZE, Q_SIZE)
        scaleNetwork(q, vertices, Q_SIZE, iW, iH)
        
        // redraw nodes
        nodeG
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
    }
    animate()

} // drawD3PointCloud

function drawD3CrossEntropyUMAP(q) {
    // Parameters for the force-directed layout
    let nodeG = undefined
    const radius = 5 // choose a small but still visible radius for the nodes, to avoid too much overlap between them
    // colors
    const nodeStrokeWidth = 1.5
    const selNodeStrokeWidth = 3
    const nodeStrokeColor = "#ffffff"
    const selNodeStrokeColor = "#867979"

    // get container dimensions
    let width = 400
    let height = 400
    
    // compute size for the drawing
    const margin = { top: 10, right: 10, bottom: 10, left: 10 }
    const iW = width - margin.left - margin.right
    const iH = height - margin.top - margin.bottom

    // Init network
    const vertices = q.map( (v, i) => ({ index: i, x: v.x, y: v.y, t: v.t, r: radius }) )
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (let v of vertices) {
        if (v.x < minX) minX = v.x
        if (v.x > maxX) maxX = v.x
        if (v.y < minY) minY = v.y
        if (v.y > maxY) maxY = v.y
    }
    // scale and center network to fit the canvas, to make it more visually appealing
    // first move to center
    let meanX = 0
    let meanY = 0
    for (let v of vertices) {
        meanX += v.x
        meanY += v.y
    }
    meanX /= vertices.length
    meanY /= vertices.length
    for (let v of vertices) {
        v.x -= meanX
        v.y -= meanY
    }
    // then scale to fit the canvas
    const scaleX = iW / (maxX - minX)
    const scaleY = iH / (maxY - minY)
    const scale = Math.min(scaleX, scaleY) * 0.8 // add some padding
    for (let v of vertices) {
        v.x = v.x * scale
        v.y = v.y * scale
    }

    // init Graphic
    const svg = d3.select('#umap-crossentropy')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background-color', '#f3f4f6')
        .style('border', 'solid #a0adaf')
    // add a group for the network
    const netG = svg
        .append('g')
        .attr('class', 'umpa-network')
        .attr('transform', `translate(${width / 2}, ${height / 2})`) // the scale function must take into account the translation of the group

    // color nodes using the t property, which is the iteration number of the optimization when the point was added to the layout
    const [minT, maxT] = d3.extent(vertices, point => point.t)
    const colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([minT, maxT])
    
    // add nodes
    nodeG = netG
            .append("g")
            .attr("stroke", nodeStrokeColor)
            .attr("stroke-width", nodeStrokeWidth)
            .selectAll("circle")
            .data(vertices)
            .join("circle")
            .attr("r", (d) => d.r)
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y)
            .attr("fill", (d) => colorScale(d.t))

} // drawD3PointCloud


export function drawAll(initOptions = {initialization: 'spectral'}) {
    const {
        q,
        p,
        neighbors,
        edges,
        Q_SIZE,
        a,
        b
    } = initUMAP(initOptions)
    // 3D graphic
    const pointCloud = normalizePointCloud(p)
    drawThreejsPointCloud(pointCloud)
    // 2D svg graphic
    const vertices = umapCrossEntropy(q, edges, a, b)
    drawD3PointCloud(q, edges, Q_SIZE, a, b)
    drawD3CrossEntropyUMAP(vertices)
}
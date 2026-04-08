import * as d3 from 'd3'
import * as THREE from 'three'
import { OrbitControls } from 'OrbitControls'
import * as umap from 'umap'

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
}

export function drawAll() {
    const pointCloud = normalizePointCloud(umap.init())
    drawThreejsPointCloud(pointCloud)
}
import { keyGen } from "utilities"
// Prepare network for processing, create a common data structure for all algorithms
export function preprocessNetwork(network) {
    const {nodes, edges } = network
    // check, that undirected edges are unique
    const m_ = new Map()
    for (let e of edges) {
        if (typeof e.source === 'string') e.source = +e.source
        if (typeof e.target === 'string') e.target = +e.target
        const key = keyGen(e.source, e.target)
        const s = e.source 
        const t = e.target
        m_.set(key, e)
        e.key = key
    }
    if (m_.size !== edges.length) {
        console.log(`error: undirected edges are not unique`)
    }
    // compute node neighbors
    network.neighbors = new Array(nodes.length).fill(null).map( e => []) 
    network.weights = new Array(nodes.length).fill(null).map( e => [])
    const {neighbors, weights} = network
    // at this point, edges are unique
    for (let e of edges) {
        const s = e.source
        const t = e.target
        neighbors[s].push(t) // { index: t, weight: e.weight })
        neighbors[t].push(s) // ({ index: s, weight: e.weight })
        if (e.hasOwnProperty('weight')) {
            weights[s].push(e.weight)
            weights[t].push(e.weight)
        } else {
            weights[s].push(1)
            weights[t].push(1)
        }
    }
    for (let i = 0; i < neighbors.length; i++) {
        neighbors[i] = Array.from(neighbors[i])
    }
    // compute degree centrality, add id 
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].index = i
        nodes[i].index = nodes[i].index
        nodes[i].c = neighbors[i].length
        if (typeof nodes[i].x === 'string') nodes[i].x = +nodes[i].x
        if (typeof nodes[i].y === 'string') nodes[i].y = +nodes[i].y
        if (!nodes[i].hasOwnProperty('group')) nodes[i].group = 1
        if (!nodes[i].hasOwnProperty('name')) nodes[i].name = 'node ' + nodes[i].index
    }

}
import { binaryHeapFactory } from "binaryHeap"
// compute and mark leaves
// there is a root node, and nodes have predecessors
export function leaves(nodes) {
    const allLeaves = []
    nodes.forEach(n => n.type = 'leaf')
    nodes.forEach((n, i) => {
        if (n.p === -1) {
            n.type = 'root'
            //console.log('root: ' + i)
        } else {
            nodes[n.p].type = 'inner'
            //console.log('inner: ' + i)
        }
    })
    nodes.forEach((n, i) => {
        if (n.type === 'leaf') {
            allLeaves.push(i)
        }
    })
    return allLeaves
}

// BFS: breadth-first search with backtracking 
export function bfs(nodes, neighbors, index) {
    nodes.forEach((n) => {
        n.v = false
        n.d = Number.MAX_VALUE
        n.p = -2
    })
    nodes[index].d = 0
    nodes[index].v = true
    nodes[index].p = -1
    const q = [index] // queue
    while (q.length > 0) {
        const s = q.shift()
        const d = nodes[s].d
        neighbors[s].forEach((n_index) => {
            const n = nodes[n_index]
            if (n.v === false) {
                n.v = true
                n.p = s
                n.d = d + 1
                q.push(n_index)
            }
        })
    } // step()
}

// Modified BFS: breadth-first search with backtracking to count the 
// number of shortest paths from the root node to all other nodes
export function bfsCount(nodes, neighbors, index) {
    nodes.forEach((n) => {
        n.v = false
        n.d = Number.MAX_VALUE
        n.p = -2
        n.n = 0
    })
    nodes[index].d = 0
    nodes[index].v = true
    nodes[index].p = -1
    nodes[index].n = 1
    const q = [index] // queue
    while (q.length > 0) {
        const s = q.shift()
        const d = nodes[s].d
        neighbors[s].forEach((n_index) => {
            const n = nodes[n_index]
            if (n.v === false) {
                n.v = true
                n.p = s
                n.d = d + 1
                n.n = nodes[s].n
                q.push(n_index)
            } else if (n.d === d + 1) {
                n.n += nodes[s].n
            }
        })
    } // step()
}
// DFS: depth-first search with backtracking
export function dfs(nodes, neighbors, index) {
    nodes.forEach(n => {
        n.v = false
        n.d = Infinity
        n.p = -2
        n.type = 'undefined'
    })
    nodes[index].d = 0
    nodes[index].p = -1
    const q = [index]// queue
    while (q.length > 0) {
        const s = q.pop()
        const d = nodes[s].d
        if (nodes[s].v === false) {
            nodes[s].v = true
            neighbors[s].forEach(n_index => {
                const n = nodes[n_index]
                if (!n.v) {
                    n.p = s
                    n.d = d + 1
                    q.push(n_index)
                }
            })
        }
    } // while
    nodes[index].p = -1 // this is the root node
}

export function dijkstra(nodes, neighbors, weights, index) {
    const pQ = binaryHeapFactory( n => n.d )
    nodes.forEach(n => {
      n.d = Infinity
      n.p = -2
    })
    nodes[index].d = 0
    nodes[index].p = -1
    nodes.forEach(n => pQ.push(n))
    while (!pQ.empty()) {
      const s = pQ.pop()
      const d = s.d
      const n_weights = weights[s.index]
      neighbors[s.index].forEach((n_index, i) => {
        const n = nodes[n_index]
        const weight = n_weights[i] 
        if (d + weight < n.d) {
            // update this element
            n.p = s.index
            n.d = d + weight //e.weight
            pQ.update(n)
        }
      })
    }
} // dijkstra()
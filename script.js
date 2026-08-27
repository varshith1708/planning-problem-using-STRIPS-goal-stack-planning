const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let nodes = [];
let edges = [];
let mstEdges = [];
let userSelectedEdges = [];
let totalCost = 0;
let isVisualizing = false;
let gameFinished = false;

const RADIUS = 15;
const PADDING = 50;

function initGame() {
    isVisualizing = false;
    gameFinished = false;
    userSelectedEdges = [];
    totalCost = 0;
    document.getElementById('message').innerText = "";
    
    generateGraph();
    calculateMST();
    updateUI();
}

function generateGraph() {
    nodes = [];
    edges = [];
    
    const numNodes = Math.floor(Math.random() * 3) + 6; // 6 to 8
    
    // Generate nodes
    while (nodes.length < numNodes) {
        let n = {
            x: Math.random() * (canvas.width - 2 * PADDING) + PADDING,
            y: Math.random() * (canvas.height - 2 * PADDING) + PADDING
        };
        // Ensure distance
        let ok = true;
        for (let m of nodes) {
            if (Math.hypot(n.x - m.x, n.y - m.y) < 80) {
                ok = false; break;
            }
        }
        if (ok) nodes.push(n);
    }
    
    // Generate tree to ensure connectedness
    let visited = [0];
    let unvisited = [];
    for (let i = 1; i < numNodes; i++) unvisited.push(i);
    
    let generatedEdges = [];
    while (unvisited.length > 0) {
        let uIdx = Math.floor(Math.random() * visited.length);
        let vIdx = Math.floor(Math.random() * unvisited.length);
        generatedEdges.push({ u: visited[uIdx], v: unvisited[vIdx] });
        visited.push(unvisited[vIdx]);
        unvisited.splice(vIdx, 1);
    }
    
    // Generate extra random edges
    const extraEdges = Math.floor(Math.random() * 4) + 2; // 2 to 5 extra
    for (let i = 0; i < extraEdges; i++) {
        let u = Math.floor(Math.random() * numNodes);
        let v = Math.floor(Math.random() * numNodes);
        if (u !== v) {
            let exists = generatedEdges.find(e => (e.u === u && e.v === v) || (e.u === v && e.v === u));
            if (!exists) {
                generatedEdges.push({u, v});
            }
        }
    }
    
    // Assign weights
    let availableWeights = [];
    for(let i=1; i<=30; i++) availableWeights.push(i);
    // Shuffle weights
    for(let i=availableWeights.length-1; i>0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableWeights[i], availableWeights[j]] = [availableWeights[j], availableWeights[i]];
    }
    
    for (let i = 0; i < generatedEdges.length; i++) {
        edges.push({
            u: generatedEdges[i].u,
            v: generatedEdges[i].v,
            weight: availableWeights[i]
        });
    }
}

// Union-Find for Kruskal's
class UnionFind {
    constructor(size) {
        this.parent = new Array(size).fill(0).map((_, i) => i);
    }
    find(i) {
        if (this.parent[i] == i) return i;
        return this.parent[i] = this.find(this.parent[i]);
    }
    union(i, j) {
        let irep = this.find(i);
        let jrep = this.find(j);
        this.parent[irep] = jrep;
    }
}

function calculateMST() {
    mstEdges = [];
    let sortedEdges = [...edges].sort((a, b) => Math.sign(a.weight - b.weight)); // actually simple numeric sort
    let uf = new UnionFind(nodes.length);
    
    for (let edge of sortedEdges) {
        if (uf.find(edge.u) !== uf.find(edge.v)) {
            uf.union(edge.u, edge.v);
            mstEdges.push(edge);
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw unselected edges
    for (let edge of edges) {
        if (!userSelectedEdges.includes(edge)) {
            ctx.beginPath();
            ctx.moveTo(nodes[edge.u].x, nodes[edge.u].y);
            ctx.lineTo(nodes[edge.v].x, nodes[edge.v].y);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    // Draw selected edges
    for (let edge of userSelectedEdges) {
        ctx.beginPath();
        ctx.moveTo(nodes[edge.u].x, nodes[edge.u].y);
        ctx.lineTo(nodes[edge.v].x, nodes[edge.v].y);
        ctx.strokeStyle = "#38bdf8"; // vibrant blue
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.stroke();
    }
    
    // Draw weights
    for (let edge of edges) {
        const mx = (nodes[edge.u].x + nodes[edge.v].x) / 2;
        const my = (nodes[edge.u].y + nodes[edge.v].y) / 2;
        
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.roundRect(mx - 10, my - 10, 20, 20, 4);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.stroke();
        
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 12px Inter, Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edge.weight, mx, my);
    }
    
    // Draw nodes
    for (let i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = "#0f172a";
        ctx.fill();
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function updateUI() {
    draw();
    document.getElementById('totalCost').innerText = totalCost;
    document.getElementById('edgeCount').innerText = `${userSelectedEdges.length}/${nodes.length - 1}`;
}

// Distance point to line segment
function dist2(v, w) { return (v.x - w.x)*(v.x - w.x) + (v.y - w.y)*(v.y - w.y); }
function pointToLineDist(px, py, node1, node2) {
    const l2 = dist2(node1, node2);
    if (l2 === 0) return Math.sqrt(dist2({x:px,y:py}, node1));
    let t = ((px - node1.x) * (node2.x - node1.x) + (py - node1.y) * (node2.y - node1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    const hitX = node1.x + t * (node2.x - node1.x);
    const hitY = node1.y + t * (node2.y - node1.y);
    return Math.sqrt(dist2({x:px,y:py}, {x:hitX, y:hitY}));
}

canvas.addEventListener('click', (e) => {
    if (isVisualizing || gameFinished) return;
    
    const rect = canvas.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;
    
    let clickedEdge = null;
    let minDist = 15; // Selection hit area
    
    for (let edge of edges) {
        let d = pointToLineDist(ex, ey, nodes[edge.u], nodes[edge.v]);
        if (d < minDist) {
            minDist = d;
            clickedEdge = edge;
        }
    }
    
    if (clickedEdge) {
        if (userSelectedEdges.includes(clickedEdge)) return;
        
        if (mstEdges.includes(clickedEdge)) {
            userSelectedEdges.push(clickedEdge);
            totalCost += clickedEdge.weight;
            updateUI();
            
            document.getElementById('message').innerText = "";
            
            if (userSelectedEdges.length === nodes.length - 1) {
                gameFinished = true;
                const msg = document.getElementById('message');
                msg.innerText = "Completed";
                msg.style.color = "#4ade80"; // Bright Green
            }
        } else {
            const msg = document.getElementById('message');
            msg.innerText = "Not the minimum edge";
            msg.style.color = "#fbbf24"; // Amber/yellow for warning
        }
    }
});

document.getElementById('btnStart').addEventListener('click', initGame);
document.getElementById('btnReset').addEventListener('click', () => {
    if (isVisualizing) return;
    gameFinished = false;
    userSelectedEdges = [];
    totalCost = 0;
    document.getElementById('message').innerText = "";
    updateUI();
});

document.getElementById('btnSolution').addEventListener('click', () => {
    if (isVisualizing) return;
    isVisualizing = true;
    gameFinished = true;
    userSelectedEdges = [];
    totalCost = 0;
    updateUI();
    document.getElementById('message').innerText = "";
    
    // Prim's algorithm for visualization
    let visited = new Set([0]);
    let unvisited = new Set();
    for(let i=1; i<nodes.length; i++) unvisited.add(i);
    
    let primEdgesToSelect = [];
    while(unvisited.size > 0) {
        let minEdge = null;
        let minWeight = Infinity;
        let vToAdd = -1;
        
        for (let edge of edges) {
            let uVs = visited.has(edge.u);
            let vVs = visited.has(edge.v);
            if ((uVs && !vVs) || (!uVs && vVs)) {
                if (edge.weight < minWeight) {
                    minWeight = edge.weight;
                    minEdge = edge;
                    vToAdd = uVs ? edge.v : edge.u;
                }
            }
        }
        
        if (minEdge) {
            primEdgesToSelect.push(minEdge);
            visited.add(vToAdd);
            unvisited.delete(vToAdd);
        } else {
            break; 
        }
    }
    
    let idx = 0;
    let interval = setInterval(() => {
        if (idx < primEdgesToSelect.length) {
            userSelectedEdges.push(primEdgesToSelect[idx]);
            totalCost += primEdgesToSelect[idx].weight;
            updateUI();
            idx++;
        } else {
            clearInterval(interval);
            const msg = document.getElementById('message');
            msg.innerText = "Completed";
            msg.style.color = "#4ade80"; // Bright Green
            isVisualizing = false;
        }
    }, 1000);
});

// Start initially
initGame();



function getTissuesList(v) {
    rc = [];
    _.each(alldata.bits, function(b, t) {
        if ((v & b) > 0)
            rc.push(t);
    });
    return rc
}
function initBaseEdge(e) {
    return netData.bits[e[0]] !== undefined && netData.bits[e[1]] !== undefined;
}
function filtred(id) {
    return netData.bits[id] !== undefined && (netData.bits[id] & 2) === 2;
}
function filtredEdge(e) {
    return filtred(e[0]) && filtred(e[1]);
}
function filtredIndEdge(i) {
    return filtred(alldata.edges[i][0]) && filtred(alldata.edges[i][1]);
}
function filtredNetEdge(edge) {
    return filtred(edge.from) && filtred(edge.to);
}
function adjInit() {
    var edges = alldata.edges;
    var tbits = alldata.bits;
    var adj = {};
    netData.filtred.bits = 0;
    _.each(checkedTissues(), function(t) {
        netData.filtred.bits += tbits[t];
    });
    _.each(edges, function(e) {
        if (filtredEdge(e)) {
            if (adj[e[0]] === undefined)
                adj[e[0]] = [];
            adj[e[0]].push(e[1]);
            if (adj[e[1]] === undefined)
                adj[e[1]] = [];
            adj[e[1]].push(e[0]);
        }
    });
    console.log("adjInit", adj);
    return adj;
}
function adjNet() {
    var edges = netData.data.edges.get();
    var tbits = alldata.bits;
    var adj = {};
    netData.filtred.bits = 0;
    _.each(checkedTissues(), function(t) {
        netData.filtred.bits += tbits[t];
    });
    _.each(edges, function(e) {
        if (filtredNetEdge(e)) {
            if (adj[e.from] === undefined)
                adj[e.from] = [];
            adj[e.from].push(e.to);
            if (adj[e.to] === undefined)
                adj[e.to] = [];
            adj[e.to].push(e.from);
        }
    });
    console.log("adjNet", adj);
    return adj;
}
function connComp(adj) {
    var nMap = {};
    _.each(adj, function(a, i) { 
        nMap[i] = {}; 
    });
    var c = 0;
    var comp = {};
    _.each(nMap, function(x, r) {
        if (nMap[r].component === undefined) {
            var stack = [r];
            // nMap[r].component = c;
            nMap[r].mark = -1;
            comp[c] = [];
            while (stack.length > 0) {
                v = stack.pop();
                comp[c].push(+v);
                if (nMap[v].component === undefined) {
                    nMap[v].component = c;
                    _.each(adj[v], function(w) {
                        if (nMap[w].mark === undefined) {
                            stack.push(w);
                            nMap[w].mark = +v;
                        }
                    });
                }
            }
            c++;
        }
    });
    netData.filtred.components = comp;
    console.log("connComp", comp);
    return comp;
}
function uploadGraph() {
    if (alldata !== undefined) {
        netData.filtred.initTb = 0;
        netData.bits = {};
        console.log("uploadGraph checkedTissues", checkedTissues())
        _.each(checkedTissues(), function(t) {
            netData.filtred.initTb += alldata.bits[t];
        });
        var tb = netData.filtred.initTb;
        _.each(alldata.edges, function(e) {
            if ((e[2] & tb) === tb) {
                netData.bits[e[0]] = 3;
                netData.bits[e[1]] = 3;
            }
        });
        var cc = connComp(adjInit());
        var cMap = {};
        var x = 0.0;
        var i = 0;
        _.each(cc, function(c) {
            if (c.length >= 1)
                x += Math.sqrt(c.length);
        });
        var m = 6 * Math.sqrt(x);
        z = 0;
        var p = 0;
        var r = m * 12;
        var s = 0;
        _.each(cc, function(c) {
            if (c.length >= 1) {
                var q = Math.sqrt(c.length);
                s += p + q;
                _.each(c, function(v) {
                    cMap[v] = findPointOnCircle(0, 0, r, 2 * Math.PI * s / x);
                });
                p = q;
                i++;
            }
        });
        var graph = createVizGraph(cMap);
        drawGraph(graph);
        netData.filtred.statistics = [_.size(netData.data.nodes.get()), 0, _.size(netData.data.edges.get()), 0];
    }
}
function updateEdges() {
    if (netData.network !== undefined) {
        var edges = netData.data.edges.get();
        netData.filtred.tb = 0;
        console.log("updateEdges checkedTissues", checkedTissues())
        _.each(checkedTissues(), function(t) {
            netData.filtred.tb += alldata.bits[t];
        });
        var tb = netData.filtred.tb;
        var testFilterd = [0, 0, 0, 0];
        _.each(netData.bits, function(b, v) {
            netData.bits[v] = 1;
        })
        _.each(edges, function(e) {
            if ((e.bits & tb) === tb) {
                netData.bits[e.from] = 3;
                netData.bits[e.to] = 3;
                testFilterd[3]++;
            }
        });
        var comp = connComp(adjNet());
        console.log("testFilterd", testFilterd);
        console.log("netData.bits", netData.bits);
        netData.filtred.statistics = [0, 0, 0, 0];
        var values = _.map(edges, function(e) {
            if (!filtredNetEdge(e)) {
                netData.filtred.statistics[3]++;
                return {id: e.id, color: {color: template.style.color[3], inherit: false, }};
            }
            else {
                netData.filtred.statistics[2]++;
                return {id: e.id, color: {color: template.style.color[2], inherit: false, }};
            }
        });
        netData.data.edges.update(values);
        values = _.map(netData.data.nodes.get(), function(v) {
            if (!filtred(v.id)) {
                netData.filtred.statistics[1]++;
                return {id: v.id,
                    color: {
                        border: template.style.color[4],
                        background: template.style.color[1],
                        highlight: {background: template.style.highlight[0], border: template.style.highlight[4]},
                    },
                    font: {color: template.style.color[1]},
                };

            }
            netData.filtred.statistics[0]++;
            return {id: v.id,
                color: {
                    border: template.style.color[4],
                    background: template.style.color[0],
                    highlight: {background: template.style.highlight[0], border: template.style.highlight[4]},
                },
            };
        });
        console.log("testFilterd", netData.filtred.statistics);
        netData.data.nodes.update(values);
        setTitle();
    }
}
function setTitle() {
    var comp = netData.filtred.components;
    var stat = netData.filtred.statistics;
    console.log("setTitle comp", comp);
    var n = 10;
    var countComp = [];
    for (count = 2; count <= n; count++)
        countComp.push(0);
    _.each(comp, function(c) {
        countComp[Math.min(_.size(c) - 2, n - 2)]++;
    });
    console.log("setTitle countComp", countComp);
    var title = "chr = " + checkedChr()
            + "; tissues = " + checkedTissues().toString()
            + "; graph with " + stat[0].toString() + "(" + (_.size(netData.data.nodes)).toString()
            + ") nodes and " + stat[2].toString() + "(" + (_.size(netData.data.edges)).toString() + " edges."
            + ") component size[2.." + n + "]:: [" + (countComp).toString() + "]";

    var elem = document.getElementById("title");
    console.log("title", title);
    elem.innerHTML = title;
    // $("#title").text(title);
}
function freezeNetwork(a) {
    if (netData.network !== undefined) {
        console.log("freezeNetwork", a);
        var values = _.map(netData.data.nodes.get(), function(node) {
            return {id: node.id, fixed: {x: a, y: a}};
        });
        netData.data.nodes.update(values);
    }
}
function createVizGraph(cMap) {
    console.log("cMap", cMap);
    graph = {nodes: [], edges: []};
    var nodeMap = {};
    _.each(alldata.edges, function(edge) {
        if (cMap[edge[0]] && cMap[edge[1]]) {
            nodeMap[edge[0]] = true;
            nodeMap[edge[1]] = true;
            var e = {};
            e.from = edge[0];
            e.to = edge[1];
            e.bits = edge[2];
            e.color = {color: template.style.color[2], inherit: false, };
            e.title = "valid tissues:";
            var del = " ";
            _.each(getTissuesList(e.bits), function(t) { e.title += del + t; del = ", "} );
            graph.edges.push(e);
        }
    });
    _.each(alldata.nodes, function(node, i) {
        if (cMap[node[0]]) {
            var v = {};
            v.id = node[0];
            v.label = node[0].toString();
            v.x = cMap[v.id][0];
            v.y = cMap[v.id][1];
            v.title = 
                "segment: \t" + node[1].toString() + 
                "<br>" + "genes \t: " + node[2].toString();
            graph.nodes.push(v);
        }
    });
    return graph;
}
function findPointOnCircle(originX, originY, radius, angleRadians) {
    var newX = radius * Math.cos(angleRadians) + originX;
    var newY = radius * Math.sin(angleRadians) + originY;
    return [newX, newY];
}
function readData() {
    var fileName = "segmTissueBitsGraph.json";
    d3.json(fileName, function(error, data) {
        chrsdata = data;
        console.log("chrsdata", chrsdata);
    });
}
function drawGraph(graph) {
    var nodes = new vis.DataSet({});
    _.each(graph.nodes, function(node) {
        var info = node;
        nodes.add(info);
    });
    var edges = new vis.DataSet({});
    _.each(graph.edges, function(link) {
        var info = link;
        edges.add(info);
    });
    /* create a network */
    var container = document.getElementById('mynetwork');
    var data = {
        nodes: nodes,
        edges: edges,
    };
    var options = {
        nodes: {
            shape: 'dot',
            borderWidth: 2,
            size: 16,
            color: {
                border: template.style.color[4],
                background: template.style.color[0],
                highlight: {background: template.style.highlight[0], border: template.style.highlight[4]},
            },
            font: {
                align: "middle",
                multi: 'html',
                size: 12,
            },
        },
        edges: {
            arrows: 'to',
            smooth: false,
            width: 3,
            font: {
                align: "middle",
                multi: 'html',
                size: 12,
            },
        },
        physics: {
            stabilization: false,
            barnesHut: {
                gravitationalConstant: -10000,
                springConstant: 0.05,
                springLength: 20,
                damping: 0.09,
            },
        },
        interaction: {
            tooltipDelay: 200,
        },
    };
    var network = new vis.Network(container, data, options);
    network.on("dragEnd", function(params) {
        for (var i = 0; i < params.nodes.length; i++) {
            var nodeId = params.nodes[i];
            nodes.update({id: nodeId, fixed: {x: true, y: true}});
        }
    });
    network.on('dragStart', function(params) {
        for (var i = 0; i < params.nodes.length; i++) {
            var nodeId = params.nodes[i];
            nodes.update({id: nodeId, fixed: {x: false, y: false}});
        }
    });
    netData.network = network;
    netData.data = data;
    console.log("netEdges", netData.data.edges.get())
}
#!/usr/bin/python
import sys, math
sys.path.insert(0,'./Utils')
import CReader
import networkx as nx

pathD = "./Data/"
pathR = "./Results/"

delim = "#"
minLim = 5.0
logLim = 2.5
plim = 17
dim = 6
clim = 3
tissues = ['Mon', 'Mac0', 'Mac1', 'Mac2', 'Neu', 'MK', 'EP', 'Ery', 'FoeT', 'nCD4', 'tCD4', 'aCD4', 'naCD4', 'nCD8', 'tCD8', 'nB', 'tB']
mode = "all"

def getP(v):
    steps = {3:0, 4:1, 5:2, 6:3, 7:4, 8:4}
    if v in steps: return steps[v]
    return 5
def getStats(sub_graphs):
    sgv = [0 for i in range(dim)]
    sge = [0 for i in range(dim)]
    vmax = 0
    emax = 0
    vsum = 0
    esum = 0
    vaver = 0
    eaver = 0
    cn = 0
    for i, sg in enumerate(sub_graphs):
        if len(sg.nodes()) >= clim and len(sg.edges()) >= clim:
            vn = len(sg.nodes())
            en = len(sg.edges())
            sgv[getP(vn)] += 1
            sge[getP(en)] += 1
            if vmax < vn: vmax = vn
            if emax < en: emax = en
            cn += 1
            vsum += vn
            esum += en
            if cn > 0: 
                vaver = round(vsum / float(cn), 2)
                eaver = round(esum / float(cn), 2)
    return sgv + [vmax] + [vaver] + sge + [emax] + [eaver]
def getCliqueStats(cliques, n, m):
    stats = [0 for i in range(m - n + 3)]
    s = 0
    mx = 0
    i = 0
    for c in cliques:
        k = len(c)
        if k >= n:
            i += 1
            if mx < k: mx = k
            s += k
            if k >= m: stats[m - n] += 1
            else: stats[k - n] += 1
    stats[m - n + 1] = mx
    stats[m - n + 2] = 0
    if i > 0: stats[m - n + 2] = round(s / float(i), 2)

    return (stats)
def countMetrics(links):
    g = nx.Graph(links)
    dg = nx.DiGraph(links)
    row = [g.number_of_nodes(), len(links)]

    sub_graphs = nx.connected_component_subgraphs(g)
    row += getStats(sub_graphs)

    sub_graphs = nx.biconnected_component_subgraphs(g)
    row += getStats(sub_graphs)

    sub_graphs = nx.strongly_connected_component_subgraphs(dg)
    row += getStats(sub_graphs)

    sub_graphs = nx.find_cliques(g)
    row += getCliqueStats(list(sub_graphs), 3, 8)
    return row

def readChr(ch):
    return CReader.readJson(pathD + "graphChr" + str(ch) + ".json")
def getMetricsRow(ch, chrData, t0, t1):
    global tissueDistance
    nodes = chrData["nodes"]
    links = chrData["links"]
    row = [ch, tissues[t0], tissues[t1]]
    row += tissueDistance[tissues[t0] + tissues[t1]]
    row += [len(links)]
    nodeInd = {}
    for i in range(len(chrData["nodes"])):
        if nodes[i][2][0] != ".":
            nodeInd[nodes[i][0]] = i
    tn = len(tissues)
    nodeSet = set()
    sv0 = 0
    sv1 = 0
    edges = []
    deg = [0 for i in range(18)]
    ee = 0
    for e in links:
        v0 = e[2 + t0]
        v1 = e[2 + t1]
        pn = 0
        if mode == "all" or (e[0] in nodeInd and e[1] in nodeInd):
            if v0 >= minLim: sv0 += 1
            if v1 >= minLim: sv1 += 1
            if v0 >= minLim and v1 >= minLim and math.log(abs(v0 - v1) + 1) <= logLim:
                ee += 1
                for t2 in range(tn):
                    v2 = e[2 + t2]
                    if v2 >= minLim and math.log(abs(v0 - v2) + 1) <= logLim and math.log(abs(v1 - v2) + 1) <= logLim: pn += 1
                deg[pn] += 1
                a = 1
                if pn <= plim: edges.append([e[0], e[1]])
                else: deg[pn] += 1
    s = 0
    for v in deg: s += v
    s = 0
    for v in deg: s += v
    dv = math.sqrt(sv0 * sv1) / 2
    ss = 0
    v = 0
    normList = []
    for i in range(plim + 1):
        ss += deg[i]
        normList.append(ss)
    row += countMetrics(edges)
    row += normList[2:]
    return [dv, row]

tissueDistance = CReader.readJson(pathD + "tissueDistance.json")
bheader = ["Chr", "tissue1", "tissue2", "clasif", "dist1", "dist2", "trans all", "nodes", "links"]
for i1 in ["CC", "BC", "SC"]:
    for i2 in ["V", "E"]:
        for i3 in ["3", "4", "5", "6", "8", "+", "max", "aver"]: bheader.append(i1 + "_" + i2 + "_" + i3)
for i3 in ["3", "4", "5", "6", "8", "+", "max", "aver"]: bheader.append("CL_" + i3)
bheader += ["antiparalllelEdges"]
for i3 in range(2, 17): bheader.append("edgeTissues" + str(i3))
rezNorm = [bheader] 
chrs = [str(i) for i in range(1, 23)]
chrs.append("X")

chrs = ["21", "22", "X"]

for ch in chrs:
    print ("process chr", ch)
    data = readChr(ch)
    for t0 in range(16):
        for t1 in range(t0 + 1, 17):
            metr = getMetricsRow(ch, data, t0, t1)
            row = metr[1]
            c = metr[0]
            rowNorm = row[:]
            for i in range(7, len(row)): rowNorm[i] = round(rowNorm[i] / c, 6) 
            rezNorm.append(rowNorm)

# fn = pathR + "stats-all-" + str(plim) + "-norm.csv"
fn = pathR + "stats-all-" + str(plim) + "-norm-21-22-X.csv"

print ("file saved", fn)
CReader.saveCsv(fn, rezNorm)
var link, node, force;
var linkScale, rScale;
var width, height;
var svg;

var isSkeleton = true;

// send data to create visuals instead of accessing globals
// send displayNodes and allNodes
function createForceVisual(nodes, links) {
    // orig - 900 x 500
    width = window.screen.availWidth,//window.innerWidth,
    height = window.screen.availHeight;//window.innerHeight;

    // linkScale from 1 to max val
    // default 60
    linkScale = d3.scale.linear()
                    .domain([
                        d3.min(links, function(d) { return d.weight; }),
                        d3.max(links, function(d) { return d.weight; })
                        ])
                    .range([20, 80]);

    // may not need
    rScale = d3.scale.linear()
                .domain([
                    d3.min(nodes, function(d) { return d.occur; }),
                    d3.max(nodes, function(d) { return d.occur; })
                    ])
                .range([4, 10])

    force = d3.layout.force()
            // if in map/obj
            //.nodes(d3.values(nodes))
            .nodes(nodes)
            .links(links)
            // can take out of global scope now
            .size([width, height])
            // set link distance to freq scaled?
            // 60
            // 0.9
            .friction(0.5)
            .linkDistance(function(d) {
                return linkScale(d.weight);
                /*if(d.source.stop || d.target.stop) {
                    return 1;
                } else {
                    return linkScale(d.weight);
                }*/
                //return 60;
            })
            //.charge(-300)
            .charge(-800)
            .on("tick", tick)
            .on("end", end);

    svg = d3.select("#d3-skeleton");

    d3.select("#force-direct").remove();

    svg = svg.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("id", "force-direct");

    link = svg.append("g")
        .attr("class", "all-links");

    node = svg.append("g")
        .attr("class", "all-nodes");

    /* COPIED */

    // build the arrow.
    svg.append("defs").selectAll("marker")
        .data(["end"])      // Different link/path types can be defined here
      .enter().append("marker")    // This section adds in the arrows
        .attr("id", function(d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        // 25 - 15
        .attr("refX", 15)
        // 0 - -1.5
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        //.style("stroke", "#4679BD");

    /* END COPIED */
    updateGraph(nodes, links);

}

// don't need to send values?
function updateGraph(nodes, links) {
    //d3.selectAll(".link").remove();
    //d3.selectAll(".node").remove();

    force.nodes(nodes);
    force.links(links);

    link = svg.selectAll(".link")
        .data(links);
    link.exit().remove();
    link.enter()
        .append("line")
        .attr("class", "link")
        .attr("marker-end", "url(#end)");

    node = svg.selectAll(".node")
        .data(nodes);
    node.exit().remove();
    node.enter()
        .append("g")
        .attr("class", "node")
        .on("click", nodeClick)
        .on("mouseover", nodeHover)
        .call(force.drag);

    node.selectAll("circle").remove();
    node.selectAll("text").remove();

    node.append("circle")
        // adjust radius for size -- 2
        //.attr("r", function(d) { return rScale(d.occur); });
        .attr("class", function(d) { return getCircleClass(d); })
        .attr("r", function(d) { return setRadius(d); });

    node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        // display stop word text?
        .text(function(d) { return d.value; return d.stop? "" : d.value; });

    force.start();
}

function tick() {
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

    node
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

}

function end() {
    for(var i in force.nodes()) {
        //force.nodes()[i].fixed = true;
    }
}

function getCircleClass(d) {
    var classname;
    if(d.stop) {
        classname = "stop-word";
    } else {
        classname = "reg-word"
    }

    if(d.children != null) {
        classname += " open-word"
    }

    return classname;
}

function setRadius(d) {
    if(d.stop) {
        return 4;
    } else {
        return 5;
    }
}

/*
    fade existing relationships to highlight current opening
*/
function nodeClick(d) {
    debugger;
    // main nodes should be a hash map
    if(firstWord || secondWord || !isSkeleton) {
        var nodes = force.nodes(),
        // if can be generated from main nodes, this is unnecessary
        links = force.links();
    } else {
        var nodes = [];
        var links = [];
        nodes.push(d);
    }

    if(d3.event.defaultPrevented) return; // ignore drag
    //generateFeedbackBox(d);

    // children method unused currently
    if(! d.children || ! d._children) {
        d._children = d.getTopNeighbors(10);
    }

    if(d.children) {
        d._children = d.children;
        d.children = null;
        // update with main nodes and links
    } else {
        d.children = d._children;
        d._children = null;

        // fade exisitng nodes here

        for(var word in d.children) {
            var curWord = wordMap[d.children[word].value];
            if(! nodesContain(nodes, d.children[word].value)) {
                // these need special styling || apply to top
                nodes.push(curWord);
            }
            // else check if the connection is represented!
            var curWeight = d.children[word].connectionFreq;
            // curWord target needs to be added with x, y, px, py
            var connection = {source: d, target: curWord, weight: curWeight};
            if(! linksContain(links, connection)) {
                links.push(connection);
            }
        }
    }

    isSkeleton = false;
    updateGraph(nodes, links);

}

function generateFeedbackBox(selectedWord) {
    // separate into separate event handler in doc file
    //var evt = new CustomEvent("nodeClicked", {"word": selectedWord});
    var info = document.querySelector("#info");
    var wordOutput = document.querySelector("#info-word");
    var wordFreq = document.querySelector("#info-freq");
    var otherWords = document.querySelector("#info-children");
    var instruct = document.querySelector("#instruct");
    var postWords = d3.values(selectedWord.post);

    postWords = postWords.sort(function(a,b) {
                        return b.connectionFreq - a.connectionFreq
                    });
    // remove magic number
    postWords = postWords.slice(0,3)

    wordOutput.textContent = selectedWord.value;
    wordFreq.textContent = selectedWord.occur;
    otherWords.innerHTML = "";

    // top x neighbors
    // only do for first case, otherwise update values
    for(var i in postWords) {
        var curWord = postWords[i];
        var child = document.createElement("p");
        child.className = "info-child";
        child.innerHTML = "&quot;" + curWord.value + "&quot; " + "(" +
            curWord.connectionFreq + " times)";
        otherWords.appendChild(child);
    }

    info.setAttribute("style", "display: block;");
    instruct.innerHTML = "Node size determined by word frequency. <br>" +
        "Line length determined by how often words occur next to eachother.";
}

function nodeHover(d) {
    generateFeedbackBox(d);
}

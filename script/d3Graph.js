var link, node, force;
var linkScale, rScale;
var width, height;
var svg;

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
            .linkDistance(function(d) {
                return linkScale(d.weight);
                //return 60;
            })
            //.charge(-300)
            .charge(-500)
            .on("tick", tick);

    svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

    link = svg.append("g");

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

    // return to norm


    updateGraph(nodes, links);

}

// don't need to send values?
function updateGraph(nodes, links) {
    force.start();

    link = svg.selectAll(".link")
        .data(force.links());
    link.exit().remove();
    link.enter()
        .append("line")
        .attr("class", "link")
        .attr("marker-end", "url(#end)");

    node = svg.selectAll(".node")
        .data(force.nodes());
    node.exit().remove();
    node.enter()
        .append("g")
        /*.append("title")
        .text(function(d) {
            return d.occur;
        })*/
        .attr("class", "node")
        .on("click", nodeClick)
        .on("hover", nodeHover)
        .call(force.drag);

    node.append("circle")
        // adjust radius for size -- 2
        .attr("r", function(d) { return rScale(d.occur); });
        //.attr("r", 7);

    node.append("text")
        .attr("x", 12)
        .attr("dy", ".35em")
        .text(function(d) { return d.value; });

    /*
    link = link.data(links);
    link.exit().remove();

    link.enter().insert("line", ".node")
        .attr("class", "link");

    node = node.data(nodes);

    node.exit().remove();

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .on("click", nodeClick)
        .class(force.drag);

    nodeEnter.append("cirlce")
        .attr("r", 3);

    nodeEnter.append("text")
        .text(function(d) { return d.value; }); */
}

function flatten(root) {
    var nodes = [];
    // index ?

    function recurse(node) {
        //if(node.)
    }

    return nodes;
}

function tick() {
    link
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
      /*
        directional paths not working
        http://bl.ocks.org/d3noob/5141278
      .attr("d", function(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" +
            d.source.x + "," +
            d.source.y + "A" +
            dr + "," + dr + " 0 0,1 " +
            d.target.x + "," +
            d.target.y;
        });*/

    node
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

}

function nodeClick(d) {
    // main nodes should be a hash map
    var nodes = topWords.slicedWords,
    // if can be generated from main nodes, this is unnecessary
        links = topWords.slicedConnections;
    if(d3.event.defaultPrevented) return; // ignore drag
    generateFeedbackBox(d);

    // children method unused currently
    if(! d.children || ! d._children) {
        d._children = d.post;
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
            if(! topWords.skeletonContains(word)) {
                // these need special styling || apply to top
                var curWord = wordMap[word];
                nodes.push(curWord);
            }
            // else check if the connection is represented!
            var curWeight = d.children[word].connectionFreq;
            // curWord target needs to be added with x, y, px, py
            links.push({source: d, target: curWord, weight: curWeight});
        }
    }

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
    debugger;
}

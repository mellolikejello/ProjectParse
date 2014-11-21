var link, node, force;
var svg;

// send data to create visuals instead of accessing globals
function createForceVisual(nodes, links) {
    // orig - 900 x 500
    var width = window.screen.availWidth,//window.innerWidth,
        height = window.screen.availHeight;//window.innerHeight;

    // linkScale from 1 to max val
    // default 60
    var linkScale = d3.scale.linear()
                    .domain([
                        d3.min(links, function(d) { return d.weight; }),
                        d3.max(links, function(d) { return d.weight; })
                        ])
                    .range([20, 80]);

    var rScale = d3.scale.linear()
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
    link = svg.append("g").selectAll(".link")
        .data(force.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("marker-end", "url(#end)");

    node = svg.selectAll(".node")
        .data(force.nodes())
        .enter()
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

    updateGraph();

}

function updateGraph() {
    force.start();
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

function nodeClick(selectedWord) {
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

    // move this sort so word has own implementation
    //debugger;
}

function nodeHover(d) {
    debugger;
}

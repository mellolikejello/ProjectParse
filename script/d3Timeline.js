function generateTimeline(word, totalNumWords) {
    var w = 600;
    var h = 100;
    var xScale = d3.scale.linear()
        .domain([0, totalNumWords])
        //.range([10, 510]);
        .range([10, 510]);
        //.tickFormat(10, "+%");
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
    var timeline = d3.select("#d3-timeline")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    timeline.selectAll("circle")
        .data(word.positions)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            return xScale(d);
        })
        .attr("cy", 10)
        .attr("r", 1);

    timeline.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + 40 + ")")
        .call(xAxis);
}

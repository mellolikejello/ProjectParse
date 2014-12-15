debug

var n = force.nodes(); for(var i in n) {console.log(n[i].value)}

var links = force.links(); for(var i in links) {console.log(links[i].source.value + "-->" + links[i].target.value)}

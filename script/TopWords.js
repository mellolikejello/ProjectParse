/*
spec
create topWords structure that will sort underlying array of topWords
- will return array of nodes to include (includes neighbors of topWords)
- keeps a sorted array of top X words
- has an object/map for all words -- this is what will be checked and sent to the
	visual
*/

function TopWords(wordMap, totalCount, N) {
	this.connections = [];
	this.totalCount = totalCount;
	var words = d3.values(wordMap);
    this.topList = words = words.sort(function(a,b) { return sortWords(a,b); });
    // should this be sliced right away or should we return a sliceable list?
    if(N) {
    	this.topList = this.topList.slice(0, N);
    }

	this.allWords = new Object();

	this.populateMap(wordMap);
}

// should the functions be added individually?
TopWords.prototype = {
	// and populate connections?
	populateMap: function(wordMap) {
		for(var word in this.topList) {
			var curWord = this.topList[word];
			this.addWord(curWord);
			for(var postWord in curWord.post) {
				// need to use original value or connection won't work
				this.addWord(wordMap[postWord]);

				var graphPoint = new Object();
	            var curPostWord = curWord.post[postWord];
	            graphPoint.source = curWord;
	            // curPostWord
	            graphPoint.target = wordMap[curPostWord.value];
	            // add strength of connection
	            graphPoint.weight = curPostWord.connectionFreq;
	            this.connections.push(graphPoint);
	            // sort by connection freq overall or per word
			}
		}

		this.connections = this.connections.sort(function(a,b) {
			return sortConnections(a,b);
		});
	},

	addWord: function(word) {
		if(this.allWords[word.value] == undefined) {
			this.allWords[word.value] = word;
		}
	},

	getWords: function() {
		return d3.values(this.allWords);
	},

	getConnections: function(N) {
		if(N) {
			return this.connections.slice(0, N);
		} else {
			return this.connections;
		}
	},

	getSlicedWords: function(links) {
		var words = {};
		for(var i = 0; i < links.length; i++) {
			var cur = links[i];
			if(! words[cur.source.value]) {
				words[cur.source.value] = cur.source;
			}
			if(! words[cur.target.value]) {
				words[cur.target.value] = cur.target;
			}
		}
		return d3.values(words);
	},

	// might not need numWords
	// fx is function to send data to
	// config.numWords not used right now
	sendData: function(config) {
		var numWords = config.numWords;
		// change to num connections?
		var numNeighbors = config.numNeighbors;
		var fx = config.fx;

		var slicedConnections = this.getConnections(numNeighbors);
		var slicedWords = this.getSlicedWords(slicedConnections);

		createForceVisual(slicedWords, slicedConnections);
		//fx.apply(slicedWords, slicedConnections);
	}
}

function sortWords(a, b) {
    return b.occur - a.occur;
}

function sortConnections(a, b) {
	return b.weight - a.weight;
}

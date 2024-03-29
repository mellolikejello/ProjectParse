// make this super class
// subclass for top level with occur
// subclass for neighbor with strength/frequency
// add sort value compare?
function Word(word, index) {
	this.connectionFreq;
	this.value = word;
	this.occur = 1;
	// following words
	this.post = {};
	this.positions = [];
	this.stop = false;
	//this.fixed = true;

	this.positions.push(index);
}

Word.prototype = {
	addOccursAt: function(index) {
		this.occur++;
		this.positions.push(index);
	},

	addPostWord: function(word) {
		this.addWord(this.post, word);
	},

	// can we track this connection strength?
	// only need to track top level relationship
	// look up top level relationship for 2nd, 3rd level relationships
	// need to deep copy the object -- it updates values, don't want to mess
	// with top level relationships
	addWord: function(dict, word) {
		var wordAdded = this.cloneWord(word);
		// remove post?
		// this might help with traversal
		//wordAdded.occur = 0;
		if(dict[word.value] == undefined) {
			// better to use occur or new val?
			wordAdded.connectionFreq = 1;
			dict[word.value] = wordAdded;
			// init strength?
		} else {
			// increment strength?
			// need to update values
			var curConnectionFreq = dict[word.value].connectionFreq + 1;
			wordAdded.connectionFreq = curConnectionFreq;
		}

		dict[word.value] = wordAdded;
	},

	// be sent word? or return copy of self??
	cloneWord: function(word) {
		var newWord = new Word(word.value);
		newWord.occur = word.occur;
		newWord.post = word.post;
		return newWord;
	},

	clone: function() {
		var newWord = new Word(this.value);
		newWord.occur = this.occur;
		newWord.post = this.post;
		return newWord;
	},

	getOverallFreqPercent: function(totalWordCount) {
		if(! this.totalFreqPercent) {
			this.totalFreqPercent = this.occur / totalWordCount * 100;
		}
		return this.totalFreqPercent;
	},

	getTopNeighbors: function(numNeighbors) {
		if(! this.sortedPost) {
			var neighbors = d3.values(this.post);
			this.sortedPost = neighbors.sort(function(a, b) { return sortPostWordConnection(a, b); });
		}
		return this.sortedPost.slice(0, numNeighbors);
	}
}

function getOriginalWords(wordList) {
	for(var i in wordList) {
		var curWord = wordMap[wordList[i].value];
		wordList[i] = curWord;
	}

	return wordList;
}

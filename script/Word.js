// make this super class
// subclass for top level with occur
// subclass for neighbor with strength/frequency
// add sort value compare?
function Word(word) {
	this.connectionFreq;
	this.value = word;
	this.occur = 1;
	// following words
	this.post = {};
	this.stop = false;
	//this.fixed = true;
}

Word.prototype = {
	increment: function() {
		this.occur++;
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
	}
}

window.onload = init;

var BOOK_FILE = "data/AliceFullCut.txt";
var STOP_WORD_FILE = "data/stopWords.txt"
var TOP_X_VAL = 3;
var TOP_X_NEIGHBORS = 50;
var SENTENCE_BREAK = "||SENTENCEBREAK||";
var wordMap;
var wordGraph;
var topWords;
var stopWords;

/* currently
        loads book and stop files
        hands processing off to topWords
            --> is sent the force visual function to call
*/
function init() {
    wordMap = {};
    topWords = new Array(TOP_X_VAL);
    loadFile(STOP_WORD_FILE, parseStopFile);
    loadFile(BOOK_FILE, parseBookFile);
}

function loadFile(filename, handler) {
    // separate xhrs?
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename);
    xhr.responseType = "text";
    // to do work on range req?
    //xhr.setRequestHeader("Range", "bytes=" + range);
    xhr.onreadystatechange = function(e) { handler(e, xhr) };
    xhr.send();
}

function parseStopFile(e, xhr) {
    if(xhr.readyState == 4) {
        var bodyTokens;
        var bodyText = xhr.responseText;

        bodyText = bodyText.toLowerCase();
        bodyText = bodyText.replace(/(\r\n|\n|\r|\-)/gm," ");
        bodyTokens = bodyText.split(" ");
        stopWords = {};

        for(var wordIndex in bodyTokens) {
            if(stopWords[bodyTokens[wordIndex]] == null) {
                stopWords[bodyTokens[wordIndex]] = true;
            }
        }
    }
}

function parseBookFile(e, xhr) {
    if(xhr.readyState == 4) {
        var bodyTokens;
        // store later for full text display?
        var bodyText = xhr.responseText;

        bodyText = bodyText.toLowerCase();
        // remove line breaks
        bodyText = bodyText.replace(/(\r\n|\n|\r|\-)/gm," ");
        // remove special characters
        // take out .!?;
        //bodyText = bodyText.replace(/[\[\]\.,\/#"!?$%\^&\*;:{}=_`~()]/g,"");
        bodyText = bodyText.replace(/[\[\],\/#"$%\^&\*:{}=_`~()]/g,"");
        bodyText = bodyText.replace(/[\.!?;]/g, " " + SENTENCE_BREAK + " ");

        // remove extra whitespace
        // double check this is valuable
        bodyText = bodyText.replace(/\s+/g, " ");

        bodyTokens = bodyText.split(" ");

        var wordCount = createWordMap(bodyTokens);
        // can be done as it is created?
        topWords = new TopWords(wordMap, wordCount);
        //topWords = new TopWords(wordMap, TOP_X_VAL);

        // create force directed
        // [{force: 'a', target: 'cat', value: '10'}]
        // create new data structure with these values
        // create force directed graph
        // is this needed?
        //wordGraph = createForceDirectedGraph(topWords);
        topWords.sendData({"numWords": TOP_X_VAL, "numNeighbors": TOP_X_NEIGHBORS,
            "fx": createForceVisual});
        //createForceVisual(topWords.getWords(), topWords.getConnections());

    }
}

// unused
// currently iterating through post words
// whole visual
// send graph?
function createForceDirectedGraph(wordData) {
    var graph = [];

    for(var word in wordData) {
        var curWord = wordData[word];
        for(var postWord in curWord.post) {
            // put into a different function?

            //if(topWords)

            var graphPoint = new Object();
            var curPostWord = curWord.post[postWord];
            graphPoint.source = curWord;
            graphPoint.target = wordData[postWord];//curPostWord;
            // add strength of connection
            graphPoint.weight = curPostWord.connectionFreq;
            graph.push(graphPoint);
        }
    }

    return graph;

}

function createWordMap(tokens) {
    var prevWord, curWord;
    var totalWordCount = 0;

    for(var i = 0; i < tokens.length; i++) {
        var curWordVal = tokens[i];
        if(curWordVal[0] == "'" || curWordVal[curWordVal.length-1] == "'") {
            var start = (curWordVal[0] == "'" ? 1 : 0);
            var end = (curWordVal[curWordVal.length-1] == "'" ?
                curWordVal.length-1 : curWordVal.length);

            curWordVal = curWordVal.substring(start, end);
        }
        if(curWordVal != "" && curWordVal != " ") {
            // strip individual tokens
            // if begins with ' or " [illustration]
            // if ends with '
            // create a strip word function
            // pair ownership words 's
            if(curWordVal != SENTENCE_BREAK) {
                if(wordMap[curWordVal] == undefined) {
                    curWord = new Word(curWordVal)
                    wordMap[curWordVal] = curWord;
                } else {
                    curWord = wordMap[curWordVal];
                    curWord.increment();
                    // update curWord
                    //wordMap[curWordVal] = curVal;
                }

                // algorithm needs to be worked on
                // TODO - figure out how to get top word
                // solving retroactively
                //isTopWord(curWord);

                if(stopWords[curWordVal]) {
                    curWord.stop = true;
                }

                if(prevWord != undefined) {
                    prevWord.addPostWord(curWord);
                }

                totalWordCount++;
                prevWord = curWord;
            }
            // sentence break case, do not connect words
            else {
                prevWord = undefined;
            }
        }
    }

    return totalWordCount;
}

/*
    find top N words

    applying sort - can make more efficient if only need top x values
    placed in sep obj
*/
function findTopWords(N) {

    /*for(var wordPos = 0; wordPos < words.length; wordPos++) {
        for(var topPos = 0; topPos < TOP_X_VAL; topPos++) {
            if(topWords[topPos] == undefined) {
                topWords[topPos] = words[wordPos];
                break;
            } else if(topWords[topPos].occur < words[wordPos].occur) {
                if(topPos == 0) {
                    topWords.unshift(words[wordPos]);
                } else {
                    var tempWords = topWords;
                    topWords = topWords.slice(0, topWords);
                    topWords = topWords.concat(words[wordPos], tempWords.slice(topPos,tempWords.length));
                }
                topWords = topWords.slice(0, N);
                break;

            }
        }
    }*/
}

// unused currently - algorithm needs update
function isTopWord(word) {
    for(var i = 0; i < topWords.length; i++) {
        if(topWords[i] == undefined) {
            topWords[i] = word;
            return true;
            break;
        } else if(topWords[i].occur <= word.occur) {
            if(topWords[i] === word) {
                return;
            }
            // slice to this position and move rest of list down
            // add this element at position
            var tempWords = topWords;
            //debugger;
            topWords = topWords.slice(0, i);
            topWords = topWords.concat(word, tempWords.slice(i,tempWords.length));
            return true;
        }
    }
}

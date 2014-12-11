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

        // autocomplete
        // find a way to do this without jquery
        $(function() {
            //var searchBar = document.querySelector("#search");
            var terms = d3.keys(topWords.allWords);
            $("#search").autocomplete({source: terms});
        });
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
                if(curWordVal.length > 2) {
                    if(curWordVal.indexOf("'s") == curWordVal.length-2) {
                        // add it, continue with is
                        if(curWordVal == "it's") {
                            if(wordMap["it"] == undefined) {
                                curWord = new Word("it", totalWordCount);
                                wordMap["it"] = curWord;
                            } else {
                                curWord = wordMap["it"];
                                curWord.addOccursAt(totalWordCount);
                            }
                            if(prevWord != undefined) {
                                prevWord.addPostWord(curWord);
                            }
                            curWord.stop = true;
                            prevWord = curWord;
                            totalWordCount++;
                            curWordVal = "is";
                        } else {
                            curWordVal = curWordVal.substring(0, curWordVal.length-2);
                        }
                    }
                }

                if(wordMap[curWordVal] == undefined) {
                    curWord = new Word(curWordVal, totalWordCount);
                    wordMap[curWordVal] = curWord;
                } else {
                    curWord = wordMap[curWordVal];
                    curWord.addOccursAt(totalWordCount);
                }

                // wait for stop words to load
                if(stopWords && stopWords[curWordVal]) {
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

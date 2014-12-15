window.onload = init;

var bookOptions;
var BOOK_CATALOG = "data/bookCatalog.json";
var STOP_WORD_FILE = "data/stopWords.txt";
var TOP_X_VAL = 3;
var TOP_X_NEIGHBORS = 50;
var SENTENCE_BREAK = "||SENTENCEBREAK||";
var wordMap;
var wordGraph;
var topWords;
var stopWords;
var firstWord, secondWord;

/* currently
        loads book and stop files
        hands processing off to topWords
            --> is sent the force visual function to call
*/
function init() {
    wordMap = {};
    topWords = new Array(TOP_X_VAL);
    loadFile(BOOK_CATALOG, parseBookCatalog);
    loadFile(STOP_WORD_FILE, parseStopFile);
}

function loadFile(filename, handler) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', filename);
    xhr.responseType = "text";
    xhr.onreadystatechange = function(e) { handler(e, xhr) };
    xhr.send();
}

function parseBookCatalog(e, xhr) {
    if(xhr.readyState == 4) {
        bookOptions = JSON.parse(xhr.responseText).books;
        var options = document.querySelector("#book-select");
        for(var i in bookOptions) {
            var element = document.createElement("option");
            element.textContent = bookOptions[i].title
            element.value = bookOptions[i].title;
            options.appendChild(element);
        }
        loadFile(bookOptions[0].file, parseBookFile);
        options.addEventListener("change", onBookSelected);
    }
}

function onBookSelected(e) {
    isSkeleton = true;
    var i = e.target.options.selectedIndex;
    var book = bookOptions[i];
    loadFile(book.file, parseBookFile);
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

        if(topWords) {
            // reset values
            topWords = null;
            wordMap = {};
            wordGraph = null;
        }

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



        // TODO -- return this
        topWords.sendData({"numWords": TOP_X_VAL, "numNeighbors": TOP_X_NEIGHBORS,
            "fx": createForceVisual});

        //generateTimeline(topWords.allWords["alice"], topWords.totalCount);

        //createForceVisual(topWords.getWords(), topWords.getConnections());
        // autocomplete
        // find a way to do this without jquery
        $(function() {
            //var searchBar = document.querySelector("#search");
            var terms = d3.keys(topWords.allWords);
            $("#search").autocomplete({source: terms});
            $("#first-word").autocomplete({source: terms});
            $("#second-word").autocomplete({source: terms});

            $("#first-word").on("autocompleteselect", onWordSelected);
            $("#second-word").on("autocompleteselect", onWordSelected);

        });
    }
}

function onWordSelected(e, selected) {
    isSkeleton = false;
    var curWord;
    var nodes = [];
    var links = [];
    if(e.currentTarget.id == "first-word") {
        firstWord = wordMap[selected.item.value];
        curWord = firstWord;
        if(secondWord) {
            nodes = force.nodes();
            links = force.links();
        }
    } else {
        secondWord = wordMap[selected.item.value];
        curWord = secondWord;
        if(firstWord) {
            nodes = force.nodes();
            links = force.links();
        }
    }

    //send number of neighbors to get
    var topNeighbors = curWord.getTopNeighbors(25);
    var origNeighbors = getOriginalWords(curWord.getTopNeighbors(25));
    origNeighbors.push(curWord);
    for(var curNeighbor in origNeighbors) {
        if(! nodesContain(nodes, origNeighbors[curNeighbor])) {
            nodes.push(origNeighbors[curNeighbor]);
        }
    }

    for(var i in topNeighbors) {
        var graphPoint = new Object();
        graphPoint.source = curWord;
        graphPoint.target = wordMap[topNeighbors[i].value];
        graphPoint.weight = topNeighbors[i].connectionFreq;
        if(! linksContain(links, graphPoint)) {
            links.push(graphPoint);
        }
    }

    updateGraph(nodes, links);
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

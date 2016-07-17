// ==UserScript==
// @name		Page text analyze 
// @author	    stanislav.turlo@altoros.com
// @include		http://*/*
// @include		https://*/*
// @require   d3.v3.min.js		
// @require   jquery-latest.js
// @require   jquery-ui.js
// @require   featherlight.min.js	
// @require   jquery.colorbox-min.js
// @require   jquery.flash.js
// @require   d3.layout.cloud.js
// ==/UserScript==

var styleAdded = false;

function getSelectionText() {
    var text = "";
    if (window.getSelection) {
        text = window.getSelection().toString();
    } else if (document.selection && document.selection.type != "Control") {
        text = document.selection.createRange().text;
    }
    return text;
}

kango.addMessageListener('AnalyzeB2C', function(event) {
  kango.console.log("AnalyzeB2C");
  var selected = getSelection();

  if (selected == "") {
    kango.dispatchMessage('AnalyzeC2B', {url: location.toString() } );
  } else {
    kango.dispatchMessage('AnalyzeC2B', {text: selected });
  }
});

function addToHead(element) {
    var head = document.getElementsByTagName('head')[0];
    if (head === undefined) {
        head = document.createElement('head');
        document.getElementsByTagName('html')[0].appendChild(head);
    }
    head.appendChild(element);
}

function addStyle(url) {
  var css_tag = document.createElement('link');

  css_tag.setAttribute('type', 'text/css');
  css_tag.setAttribute('rel', 'stylesheet');
  css_tag.setAttribute('href', url);
  addToHead(css_tag);
}

kango.addMessageListener('AnalyzeRes', function(evt) {
  if (!styleAdded) {
    addStyle(kango.io.getResourceUrl('res/style.css'));
    addStyle(kango.io.getResourceUrl('res/jquery-ui.css'));
    styleAdded = true;
  }

  $("#analyzeres").remove();
  var p = JSON.parse(evt.data);

  if (p.status === "ERROR") {
    $.flash("IBM Watson AlchemyLanguage error: " + p.statusInfo);
  } else {

    var html = '<div id="analyzeres" width="850px" height="450px"><ul> \
               <li><a href="#emotions">Document Emotions</a></li> \
               <li><a href="#keywords">Keywords</a></li> \
               <li><a href="#concepts">Concepts</a></li> \
               </ul> \
               <div id="emotions"></div> \
               <div id="keywords"></div> \
               <div id="concepts"></div> \
               </div>';

    $('body').append(html);

    emotionsHistogram(p);
    keywordsCloud(p);
    conceptsCloud(p);


    $("#analyzeres").tabs();
    $.colorbox({inline:true, href:$("#analyzeres")});
     //HACK: on first popup it messed up
    //$.colorbox.close();
    //setTimeout(function(){
      //$.colorbox({inline:true, href:$("#analyzeres")});
    //}, 1000);
  }
});

function conceptsCloud(p) {
  var frequency_list = [];

  for(var i = 0, n = p.concepts.length; i < n; i++) {
    frequency_list.push({"text": p.concepts[i].text, "size": Math.round(p.keywords[i].relevance * 50)})
  }

  var color = d3.scale.linear()
    .domain([0,1,2,3,4,5,6,10,15,20,100])
    .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]);

  d3.layout.cloud().size([850, 450])
    .words(frequency_list)
    .rotate(0)
    .fontSize(function(d) { return d.size; })
    .on("end", draw)
    .start();

  function draw(words) {
    d3.select("#analyzeres > #concepts").append("svg")
      .attr("width", 850)
      .attr("height", 450)
      .attr("class", "wordcloud")
      .append("g")
      // without the transform, words words would get cutoff to the left and top, they would
      // appear outside of the SVG area
      .attr("transform", "translate(320,200)")
      .selectAll("text")
      .data(words)
      .enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("fill", function(d, i) { return color(i); })
      .attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
    .text(function(d) { return d.text; })
    .on("click", function(d) {
      var url = null;

      for(var i = 0, n = p.concepts.length; i < n; i++) {
        if (p.concepts[i].text === d.text) {
          url = p.concepts[i].dbpedia;
          break;
        }
      }
      if (url) {
        var win = window.open(url, '_blank');
        win.focus();
      }
    });
  }
}

function keywordsCloud(p) {
  var frequency_list = [];

  for(var i = 0, n = p.keywords.length; i < n; i++) {
    frequency_list.push({"text": p.keywords[i].text, "size": Math.round(p.keywords[i].relevance * 50)})
  }

  var color = d3.scale.linear()
    .domain([0,1,2,3,4,5,6,10,15,20,100])
    .range(["#ddd", "#ccc", "#bbb", "#aaa", "#999", "#888", "#777", "#666", "#555", "#444", "#333", "#222"]);

  d3.layout.cloud().size([850, 450])
    .words(frequency_list)
    .rotate(0)
    .fontSize(function(d) { return d.size; })
    .on("end", draw)
    .start();

  function draw(words) {
    d3.select("#analyzeres > #keywords").append("svg")
      .attr("width", 850)
      .attr("height", 450)
      .attr("class", "wordcloud")
      .append("g")
      // without the transform, words words would get cutoff to the left and top, they would
      // appear outside of the SVG area
      .attr("transform", "translate(320,200)")
      .selectAll("text")
      .data(words)
      .enter().append("text")
      .style("font-size", function(d) { return d.size + "px"; })
      .style("fill", function(d, i) { return color(i); })
      .attr("transform", function(d) {
        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
      })
    .text(function(d) { return d.text; });
  }
}

function emotionsHistogram(p) {
  var margin = {top: 20, right: 20, bottom: 30, left: 40},
  width = 850 - margin.left - margin.right,
  height = 450 - margin.top - margin.bottom;

  var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1);

  var y = d3.scale.linear()
    .range([height, 0]);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left");

  var svg = d3.select("#analyzeres > #emotions").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var data = [];
  
  for (var key in p.docEmotions) {
   if (p.docEmotions.hasOwnProperty(key)) {
     data.push({emotion:key, val:+p.docEmotions[key]});
   }
  }
   x.domain(data.map(function(d) { return d.emotion; }));
   y.domain([0, d3.max(data, function(d) { return d.val; })]);

    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.emotion); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.val); })
      .attr("height", function(d) { return height - y(d.val); });
}

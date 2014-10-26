
//Width and height
var w = 1200;
var h = 1250;

var dataset = [ 5, 10, 13, 19, 21, 25, 22, 18, 15, 13,
						 11, 12, 15, 20, 18, 17, 16, 18, 23, 25 ];

var N = 40
var nodes = generateNodes(N)

var xScale = d3.scale.ordinal()
	.domain(d3.range(dataset.length))
	.rangeRoundBands([0, w], 0.05);

var yScale = d3.scale.linear()
	.domain([0, d3.max(dataset)])
	.range([0, h]);

//Create SVG element
var svg = d3.select("body")
	.append("svg")
	.attr("width", w)
	.attr("height", h);

//Create bars
svg.selectAll("rect")
	.data(dataset)
	.enter()
	.append("rect")
	.attr("x", function(d, i) {
		return xScale(i);
	})
	.attr("y", function(d) {
		return h - yScale(d);
	})
	.attr("width", xScale.rangeBand())
	.attr("height", function(d) {
		return yScale(d);
	})
	.attr("fill", function(d) {
		return "rgb(0, 0, " + (d * 10) + ")";
	});

//Create labels
svg.selectAll("text")
	.data(dataset)
	.enter()
	.append("text")
	.text(function(d) {
		return d;
	})
	.attr("text-anchor", "middle")
	.attr("x", function(d, i) {
		return xScale(i) + xScale.rangeBand() / 2;
	})
	.attr("y", function(d) {
		return h - yScale(d) + 14;
	})
	.attr("font-family", "sans-serif")
	.attr("font-size", "11px")
	.attr("fill", "white");




//On click, update with new data			
d3.select("p")
	.on("click", function() {

		//New values for dataset
		dataset = [ 11, 12, 15, 20, 18, 17, 16, 18, 23, 25,
								5, 10, 13, 19, 21, 25, 22, 18, 15, 13 ];

		//Update all rects
		svg.selectAll("rect")
			.data(dataset)
			.attr("y", function(d) {
				return h - yScale(d);
			})
			.attr("height", function(d) {
				return yScale(d);
			})
			.attr("fill", function(d) {
				return "rgb(0, 0, " + (d * 10) + ")";
			});

		//Update all labels
		svg.selectAll("text")
			.data(dataset)
			.text(function(d) {
				return d;
			})
			.attr("x", function(d, i) {
				return xScale(i) + xScale.rangeBand() / 2;
			})
			.attr("y", function(d) {
				return h - yScale(d) + 14;
			});
		
	});


function generateNodeId(){
  var ip = (Math.random())*0x100000000+0x80000000
  var port = Math.floor(((Math.random()+1)*0x10000))
  return ip.toString(16)+':'+port.toString(16)
}

function generateNode(){
  var wait = Math.random()
  wait = wait*wait*wait*500

  var cpu = Math.random()
  cpu = cpu*cpu*cpu
  
  var tot = Math.random()*1000+500
  var free = Math.random()/3*tot
  var frag = Math.random()/3*tot
  var used = tot - free - frag

  return {
    _id: generateNodeId(),
    await: {r:wait, w: wait},
    space: {free: free, used: used, frag: frag },
    cpu: cpu,
    ranges: []
  }
}


function generateNodes(N){

  var nodes = []
  for(var i=0;i<N;i++){
    nodes[i] = generateNode()
  }

  var rr = generateRanges(N)

  for(var i=1;i<rr.length;i++){
    var n = Math.floor(Math.random()*N)
    nodes[n].ranges.push([rr[i-1],rr[i]])
  }
  
  return nodes
}


function generateRanges(N){

  var keys = []
  for(var i=0;i<N*3;i++){
    keys[i] = (Math.random()+1)*0x100000000
  }

  keys.sort()

  return keys
}



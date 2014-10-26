
var FREE_RATIO_THRESHOLD = 0.3
var FREE_THRESHOLD = 300

//Width and height
var w = 1200;
var h = 1250;

var N = 20

var radius = 200
var R1 = 80
var nodes = generateNodes(N)

var _nodes = {}
nodes.some(function(n,i){
  _nodes[n._id] = n
  //n.ord = i
})

console.log(nodes)

console.log('================================================================')

var ranges = getRanges(nodes)
ranges.sort(function(a,b){
  if(a._nodeId < b._nodeId){
    return -1
  } else if(b._nodeId < a._nodeId){
    return 1
  }else{
    return 0
  }
})

var __ord = 0

ranges.some(function(r, i){
  var n = _nodes[r._nodeId]
  if(!('ord' in n)){
    n.ord = __ord++
  }
})

console.log(JSON.stringify(ranges, null, 2))

var pie = d3.layout.pie()
  .value(function(d){return d.end-d.start})
  .sort(function(a,b){
    if(a._nodeId < b._nodeId){
      return -1
    } else if(b._nodeId < a._nodeId){
      return 1
    }else{
      return 0
    }
  })
  //.sort()
  // .sort(function(a,b){
  //   return a.start-b.start
  // })

var arc = d3.svg.arc()
  .innerRadius(radius)
  .outerRadius(radius+15)

var color = d3.scale.category20();

var svg = d3.select("body")
	.append("svg")
	.attr("width", w)
	.attr("height", h)
  .append('g')
  .attr('transform', 'translate('+w/2+','+h/2+')')

var range_stats = svg.selectAll('g.range-stats')
  .data(pie(ranges))
  .enter()
  .append('g')
  .attr('class', function(d){
    var h = _nodes[d.data._nodeId].health
    if(h<0.5){
      return 'range-stats Reds'
    } else {
      return 'range-stats Greens'
    }
  })

range_stats
  .append('path')
  .attr('fill', function(d,i){
    var c = color((_nodes[d.data._nodeId].ord % 2)+1)
    return c
  })
  .attr('d', function(d){
    d.endAngle -= 0.005
    var node = _nodes[d.data._nodeId]
    arc
      .outerRadius(radius+R1-1)
      .innerRadius(radius+R1-15-node.cpu*20)
    var a = arc(d)
    return a
  })

range_stats
  .append('path')
  .attr('fill', function(d,i){
    return '#ddd'
    var c = color(_nodes[d.data._nodeId].ord)
    return c
  })
  .attr('d', function(d){
    var node = _nodes[d.data._nodeId]
    arc.innerRadius(radius+R1)
    arc.outerRadius(radius+R1+15+node.await.r/5)
    var a = arc(d)
    return a
  })

function quantize(v){
  var M = 0.6, m = 0.4, N = 9
  return Math.floor((v-m)/(M-m)*9)
}

var green = d3.rgb(65,171,93)

var red = d3.rgb(251,106,74)

range_stats
  .append('path')
  // .attr('class',function(d){
  //   var n = _nodes[d.data._nodeId]
  //   var q = quantize(n.health)
  //   console.log('quantize', n.health, q)
  //   return 'q'+q+'-9'
  // })
  .attr('fill', function(d,i){
    return '#bbb'
    var c = color(_nodes[d.data._nodeId].ord)
    return c
  })
  .attr('d', function(d){
    var node = _nodes[d.data._nodeId]
    arc
      .outerRadius(radius)
      .innerRadius(radius-node.space.used/10)
    var a = arc(d)
    return a
  })


range_stats
  .append('path')
  .attr('fill', function(d,i){
    return '#ccc'
    var c = color(_nodes[d.data._nodeId].ord)
    return c
  })
  .attr('d', function(d){
    var node = _nodes[d.data._nodeId]
    arc
      .outerRadius(radius-node.space.used/10-1)
      .innerRadius(radius-(node.space.used+node.space.frag)/10)
    var a = arc(d)
    return a
  })

range_stats
  .append('path')
  .attr('fill', function(d,i){
    return '#ddd'
    var c = color(_nodes[d.data._nodeId].ord)
    return c
  })
  .attr('d', function(d){
    var node = _nodes[d.data._nodeId]
    arc
      .outerRadius(radius-(node.space.used+node.space.frag)/10-1)
      .innerRadius(radius-(node.space.used+node.space.frag+node.space.free)/10)
    var a = arc(d)
    return a
  })


// var await = svg.datum(ranges).selectAll('.cpu')
//   .data(pie)
//   .enter()
//   .append('path')
//   .attr('fill', function(d,i){
//     return '#ddd'
//     var c = color(_nodes[d.data._nodeId].ord)
//     return c
//   })
//   .attr('d', function(d){
//     d.endAngle -=0.005
//     var node = _nodes[d.data._nodeId]
//     arc.outerRadius(radius+15+node.await.r/5)
//     var a = arc(d)
//     return a
//   })

// var cpu = svg.selectAll('.await')
//   .data(pie)
//   .enter()
//   .append('path')
//   .attr('fill', function(d,i){
//     var c = color(_nodes[d.data._nodeId].ord)
//     return c
//   })
//   .attr('d', function(d){
//     d.endAngle -=0.005
//     var node = _nodes[d.data._nodeId]
//     arc
//       .outerRadius(radius-1)
//       .innerRadius(radius-15-node.cpu*20)
//     var a = arc(d)
//     return a
//   })

// var free = svg.selectAll('.await')
//   .data(pie)
//   .enter()
//   .append('path')
//   .attr('fill', function(d,i){
//     var c = color(_nodes[d.data._nodeId].ord)
//     return c
//   })
//   .attr('d', function(d){
//     d.endAngle -=0.005
//     var node = _nodes[d.data._nodeId]
//     var free = (node.space.used + node.space.frag + node.space.free) / node.space.free
//     console.log(free)
//     arc
//       .outerRadius(radius-100)
//       .innerRadius(radius-115-free)
//     var a = arc(d)
//     return a
//   })


function getRanges(nodes){
  var ranges = []

  for(var i=0;i<nodes.length;i++){
    nodes[i].ranges.some(function(r){
      ranges.push({
        start: r[0],
        end: r[1],
        _nodeId: nodes[i]._id
      })
    })
  }

  return ranges
}

function spaceHealth(node){
  console.log('function spaceHealth(node){', node)
  var free = node.space.free
  var tot = node.space.frag+node.space.used+node.space.free

  var t = (free/tot - FREE_RATIO_THRESHOLD)

  var h = Math.atan(t)/Math.PI+1/2
  console.log('health', h)
  return h
}


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
  var free = Math.random()/2*tot
  var frag = Math.random()/2*tot
  var used = tot - free - frag

  var n = {
    _id: generateNodeId(),
    await: {r:wait, w: wait},
    space: {free: free, used: used, frag: frag },
    cpu: cpu,
    ranges: []
  }
  n.health = spaceHealth(n)
  return n
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



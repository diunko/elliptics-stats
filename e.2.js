
var gen = require('./generate.1')


var nodes = []

for(var i=0;i<15;i++){
  nodes.push(new gen.Backend())
}

var l0 = new gen.Load()

var trace = 0

console.log('load ', l0)

var FREE_RATIO_THRESHOLD = 0.3
var FREE_THRESHOLD = 300

//Width and height
var w = 1200;
var h = 1250;

var N = 20

var radius = 500
var R1 = 2
var Rkeys = 50
var Rutil = 80
var Rrbs = 30

var Rused = 200
var radius0 = 300

var pie = d3.layout.pie()
  .value(function(d){return d.percentage})
  .sort(function(a,b){
    if(a._id < b._id){
      return -1
    } else if(b._id < a._id){
      return 1
    }else{
      return 0
    }
  })
  //.sort()
  // .sort(function(a,b){
  //   return a.start-b.start
  // })

function interpolate(v1,v2,t){
  var v3 = []
  for(var i=0;i<v1.length;i++){
    v3[i] = v1[i]+(v2[i]-v1[i])*t
  }
  return v3
}

function healthColor(h,c0){
  c0 = c0||[255,255,255]
  if(h<0.5){
    // be it green
    var c = interpolate(c0,[49, 163, 84],h/0.5)
    trace && console.log('color', c)
    return d3.rgb.apply(d3, c)
  } else {
    // be it red
    trace && console.log('color', c)
    var c = interpolate(c0,[128, 0, 0],(h-0.5)/0.5)
    return d3.rgb.apply(d3, c)
  }
}

var arc = d3.svg.arc()
  .innerRadius(radius)
  .outerRadius(radius+Rkeys)

var color = d3.scale.category20();

var svg = d3.select("body")
	.append("svg")
	.attr("width", w)
	.attr("height", h)
  .append('g')
  .attr('transform', 'translate('+w/2+','+h/2+')')

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .direction('se')
  .offset([0, 0])
  .html(function(d) {
    return '<pre>' + JSON.stringify(d.data, null, 2)+'</pre>'
  })

svg.call(tip)

function init(){

  var range_stats =
    svg.selectAll('g')
    .data(pie(nodes), function(d,i){
      console.log('after pie', d.data._id,i)
      return d.data._id
    })
    .enter()
    .append('g')
    .attr('class', 'backend')
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
  
  range_stats
    .append('path')
    .attr('class', 'cpu')
    .attr('fill', function(d,i){
      return '#eee'
      return color(i)
    })
    .attr('d', function(d){
      d.endAngle -= 0.005
      arc
        .outerRadius(radius+R1-1)
        .innerRadius(radius+R1-Rkeys*d.data.cpu)
      var a = arc(d)
      return a
    })

  range_stats
    .append('path')
    .attr('class', 'rbs')
    .attr('fill', '#ccc')
    .attr('d', function(d){
      var rbs = Math.pow(d.data.rbs/gen.WRITE_THROUGHPUT,0.2)
      d.endAngle -= 0.005
      arc
        .innerRadius(radius+R1)
        .outerRadius(radius+R1+Rrbs*rbs)
      var a = arc(d)
      return a
    })


  range_stats
    .append('path')
    .attr('class', 'wbs')
    .attr('fill', '#c0c0c0')
    .attr('d', function(d){
      var rbs = Math.pow(d.data.rbs/gen.WRITE_THROUGHPUT,0.2)
      var wbs = Math.pow(d.data.wbs/gen.WRITE_THROUGHPUT,0.2)
      d.endAngle -= 0.005
      arc
        .innerRadius(radius+R1+Rrbs*rbs+1)
        .outerRadius(radius+R1+Rrbs*rbs+1+Rrbs*wbs)
      var a = arc(d)
      return a
    })


  range_stats
    .append('path')
    .attr('class', 'disk_util')
    .attr('fill', function(d,i){
      return '#ddd'
    })
    .attr('d', function(d){
      d.endAngle -= 0.005
      arc
        .innerRadius(radius0+R1)
        .outerRadius(radius0+R1+Rutil*(d.data.disk_util))
      var a = arc(d)
      return a
    })

  range_stats
    .append('path')
    .attr('class', 'disk_used')
    .attr('fill', '#999')
    .attr('d', function(d){
      d.endAngle -= 0.005

      var frac_used = d.data.disk_used/d.data.disk_tot
      
      arc
        .innerRadius(radius0-Rused*(frac_used))
        .outerRadius(radius0)
      var a = arc(d)
      return a
    })

  range_stats
    .append('path')
    .attr('class', 'disk_frag')
    .attr('fill', '#bbb')
    .attr('d', function(d){
      d.endAngle -= 0.005

      var frac_used = d.data.disk_used/d.data.disk_tot
      var frac_frag = d.data.disk_frag/d.data.disk_tot
      
      arc
        .innerRadius(radius0-Rused*(frac_used+frac_frag))
        .outerRadius(radius0-Rused*(frac_used))
      var a = arc(d)
      return a
    })

  range_stats
    .append('path')
    .attr('class', 'disk_free')
    .attr('fill', '#ddd')
    .attr('d', function(d){
      d.endAngle -= 0.005

      var frac_used = d.data.disk_used/d.data.disk_tot
      var frac_frag = d.data.disk_frag/d.data.disk_tot
      var frac_free = d.data.disk_free/d.data.disk_tot
      
      arc
        .innerRadius(radius0-Rused*(frac_used+frac_frag+frac_free))
        .outerRadius(radius0-Rused*(frac_used+frac_frag))
      var a = arc(d)
      return a
    })

  
}


function update(){
  
  l0 = gen.loadNext(l0)
  
  nodes.some(function(node){
    node.load(l0)
  })


  svg.selectAll('g.backend')
    .data(pie(nodes))
    .attr('fill','#abc')
  
  var range_stats =
    svg.selectAll('path.cpu')
    .data(pie(nodes))
    .attr('d', function(d){
      d.endAngle -= 0.005
      arc
        .outerRadius(radius+R1-1)
        .innerRadius(radius+R1-Rkeys*d.data.cpu)
      var a = arc(d)
      return a
    })


  var rbs =
    svg.selectAll('path.rbs')
    .data(pie(nodes))
    .attr('d', function(d){
      var rbs = Math.pow(d.data.rbs/gen.WRITE_THROUGHPUT,0.2)
      var wbs = Math.pow(d.data.wbs/gen.WRITE_THROUGHPUT,0.2)
      d.endAngle -= 0.005
      arc
        .innerRadius(radius+R1)
        .outerRadius(radius+R1+Rrbs*rbs)
      var a = arc(d)
      return a
    })

  var wbs =
    svg.selectAll('path.wbs')
    .data(pie(nodes))
    .attr('d', function(d){
      var rbs = Math.pow(d.data.rbs/gen.WRITE_THROUGHPUT,0.2)
      var wbs = Math.pow(d.data.wbs/gen.WRITE_THROUGHPUT,0.2)
      d.endAngle -= 0.005
      arc
        .innerRadius(radius+R1+Rrbs*rbs+1)
        .outerRadius(radius+R1+Rrbs*rbs+1+Rrbs*wbs)
      var a = arc(d)
      return a
    })

  var disk_stats =
    svg.selectAll('path.disk_util')
    .data(pie(nodes))
    .attr('fill', function(d,i){
      var c = healthColor(d.data.health, [0xee,0xee,0xee])
      trace && console.log('health',d.data.health)
      return c
    })
    .attr('d', function(d){
      d.endAngle -= 0.005
      arc
        .innerRadius(radius0+R1)
        .outerRadius(radius0+R1+Rutil*Math.pow(d.data.disk_util,0.1))
      var a = arc(d)
      return a
    })
    

  svg.selectAll('path.disk_used')
    .data(pie(nodes))
    .attr('d', function(d){
      d.endAngle -= 0.005

      var frac_used = d.data.disk_used/d.data.disk_tot
      
      arc
        .innerRadius(radius0-Rused*(frac_used))
        .outerRadius(radius0)
      var a = arc(d)
      return a
    })

  svg.selectAll('path.disk_frag')
    .data(pie(nodes))
    .attr('d', function(d){
      d.endAngle -= 0.005

      var frac_used = d.data.disk_used/d.data.disk_tot
      var frac_frag = d.data.disk_frag/d.data.disk_tot
      
      arc
        .innerRadius(radius0-Rused*(frac_used+frac_frag))
        .outerRadius(radius0-Rused*(frac_used))
      var a = arc(d)
      return a
    })



  svg.selectAll('path.disk_free')
    .data(pie(nodes))
    .attr('d', function(d){
      d.endAngle -= 0.005

      var frac_used = d.data.disk_used/d.data.disk_tot
      var frac_frag = d.data.disk_frag/d.data.disk_tot
      var frac_free = d.data.disk_free/d.data.disk_tot
      
      arc
        .innerRadius(radius0-Rused*(frac_used+frac_frag+frac_free))
        .outerRadius(radius0-Rused*(frac_used+frac_frag))
      var a = arc(d)
      return a
  
    })


}

init()

//update()

setInterval(update, 100)



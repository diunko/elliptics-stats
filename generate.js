
var util = require('util')

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

  var util = Math.random(); util = util*util*util
  var mem = Math.random(); mem = mem*mem*mem

  var rkbps = Math.random(); rkbps = rkbps*10000+2000
  var wkbps = Math.random(); wkbps = wkbps*4000+2000

  return {
    _id: generateNodeId(),
    //await: {r:wait, w: wait},
    rkbps: rkbps,
    wkbps: wkbps,
    disk_util: util,
    space: {free: free, used: used, frag: frag },
    cpu: cpu,
    mem: mem,
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


console.log(util.inspect(generateNodes(40), {depth:null}))

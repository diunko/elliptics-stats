
var trace = false

var format = require('util').format


// (load0) => (load1)
// (state0, load) => (state1, stats)

function frame(min, max, x){
  return (x<min? min:
      (max<x? max: x))
}

function framer(min, max){
  return function(x){
    return frame(min, max, x)    
  }
}

var frame01=framer(0,1)

var DR=0.01, DW=0.005, DF=0.01, DF_=0.1, DRM=0.003

function loadNext(load0){
  var l1 = new Load()

  l1.read = frame01(load0.read + (Math.random()-0.5)*DR)
  l1.write = frame01(load0.write + (Math.random()-0.5)*DW)
  l1.rm = frame01(load0.rm + (Math.random()-0.5)*DRM)

  trace && console.log('write', l1.write)

  return l1
}


function Load(){
  this.read = 0
  this.write = 0
  this.rm = 0
}

Load.prototype.toString = function(){
  return format('%s  %s', this.read, this.write)
}

var WRITE_THROUGHPUT = 10000
var DEFRAG_THROUGHPUT = 100
var RANGE_QUANT = 200
var DISK_SIZE = 15000

var FREE_RATIO_OK = 0.3

var tot_range = 0

function Backend(){

  this._id = (Math.random()*0x100000000).toString(36)

  this.cpu = 0
  this.defrag = false

  this.disk_tot = DISK_SIZE
  this.disk_used = 0
  this.disk_frag = 0
  this.disk_free = this.disk_tot
  this.disk_util = 0

  this.health = 0
  this.rbs = 0
  this.wbs = 0

  this.range = RANGE_QUANT
  tot_range += this.range

  trace && console.log('backend', this)
}

Backend.prototype = {
  get percentage(){
    return this.range/tot_range
  },
  load: function(l){
    var p = this.percentage
    var read = l.read*p*(Math.random()+0.5)
    var write = l.write*p*(Math.random()+0.5)
    var rm = l.rm*p*(Math.random()+0.5)

    var frag_frac = this.disk_frag/this.disk_free

    if(!this.defrag && 1 < frag_frac){
      this.defrag = true
    } else {
      this.defrag = (this.defrag?
                  (DF_<Math.random()? true : false)
                  : (Math.random()<DF? true : false))
    }

    var f0 = Math.pow(Math.random(),0.2)
    var f1 = Math.pow(Math.random(),0.2)
    var f2 = f0-f1

    var cpu = frame01((this.defrag? 0.4 : 0) + read*0.2 + write*0.4)
    cpu = Math.pow(cpu, 0.1)*f0
    
    

    //this.cpu = frame01(f2*((this.defrag? 0.4 : 0) + read*0.2 + write*0.4))
    this.cpu = cpu
    this.disk_util = frame01((this.defrag? 0.4: 0) + read + write)


    this.disk_used = frame(0, this.disk_tot,
                        this.disk_used + write*WRITE_THROUGHPUT - rm*WRITE_THROUGHPUT)
    this.disk_frag = frame(0, this.disk_tot-this.disk_used,
                        this.disk_frag + rm*WRITE_THROUGHPUT - (this.defrag?DEFRAG_THROUGHPUT:0))
    this.disk_free = this.disk_tot - (this.disk_used + this.disk_frag)

    this.wbs = write*WRITE_THROUGHPUT
    this.rbs = read*WRITE_THROUGHPUT

    var fr = FREE_RATIO_OK
    if(fr < this.disk_free/this.disk_tot){
      // all is ok, so 0 <= health < 0.5
      this.health = (1-(this.disk_free/this.disk_tot-fr)/(1-fr))*0.5
    }else{
      // all is bad, so 0.5 <= health < 1
      this.health = (1-this.disk_free/this.disk_tot/fr)*0.5+0.5
    }

    trace && console.log('range factor', this.percentage*l.write*Math.random())
    if(0.0001<write*Math.random()){
      tot_range += RANGE_QUANT
      this.range += RANGE_QUANT
    }
  }
}





function test(){

  var bb = []
  for(var i=0;i<3;i++){
    bb.push(new Backend())
  }

  var l0 = new Load()

  for(var i=0;i<10000;i++){
    var l0 = loadNext(l0)
    bb.some(function(b){
      b.load(l0)
    })
    console.log('================================================================')
    console.log(bb)
    //console.log(bb.map(function(b){return b.range}))
  }
  
}

module.exports = {
  Backend: Backend,
  Load: Load,
  loadNext: loadNext,
  test: test,
  WRITE_THROUGHPUT:WRITE_THROUGHPUT
}


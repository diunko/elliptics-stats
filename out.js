(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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



},{"./generate.1":2}],2:[function(require,module,exports){

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


},{"util":6}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":5,"_process":4,"inherits":3}]},{},[1]);


var util = require('util')
var http = require('http')


var rq = http.get('http://m2.storage.coub.com:9091/stat/', function(rs){
  var chunks = []
  rs.on('data', function(data){
    chunks.push(data)
  })
  rs.on('end', function(){
    var body = Buffer.concat(chunks).toString('utf8')
    var stats = JSON.parse(body)
    console.log(util.inspect(stats, {depth: null}))
  })
})



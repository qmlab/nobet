// Setup basic express server
var express = require('express')
, app = express()
, path = require('path')
, fs = require('fs')
, nconf = require('nconf')
, compress = require('compression')
, http = require('http')
, https = require('https')
, util = require('./lib/util.js')

// First consider commandline arguments and environment variables, respectively.
nconf.argv().env();

// Whether this is debug or release
var isDebug = false

if (nconf.get('debug')) {
  console.log('debug mode')
  isDebug = true
}

if (!isDebug) {
  // Provide configs for release
  nconf.file({ file: 'config.release.json' });
}
else {
  // Provide configs for release
  nconf.file({ file: 'config.debug.json' });
}

var port = nconf.get('port')

// For rendering views
app.set('views', __dirname + '/public')
app.engine('html', require('jade').__express);
app.set('view engine', 'jade');

// For static html
app.use(express.static(path.join(__dirname, 'public')));

// Routing
app.get('/', function(req, res) {
  res.render('index.jade')
})


// Proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
app.route('/records')
.get(function(req, res) {
  var username = nconf.get('apikey')
  var password = nconf.get('password')
  var hash = util.makeBaseAuth(username, password)
  var options = {
    hostname: 'backpack.ddns.net',
    port: 443,
    path: '/store/set/goodbet/items',
    method: 'GET',
    auth: username + ':' + password,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  var _req = https.request(options, function(_res) {
    _res.setEncoding('utf8')
    _res.on('data', function(data) {
      res.write(data)
    })
    _res.on('close', function() {
      res.status(_res.statusCode).end()
    })
    _res.on('end', function() {
      res.status(_res.statusCode).end()
    })
  }).on('error', function(e) {
    res.writeHead(500)
    res.end()
  })

  _req.end()
})

server = http.createServer(app)
server.listen(port, function() {
  console.log('Debug: server listening at port %d', port)
})

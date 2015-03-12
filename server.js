// Setup basic express server
var express = require('express')
, app = express()
, path = require('path')
, fs = require('fs')
, nconf = require('nconf')
, compress = require('compression')
, http = require('http')
, https = require('https')
, bodyParser = require('body-parser')
, util = require('./lib/util.js')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

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
.post(function(req, res, next) {
  var username = nconf.get('apikey')
  var password = nconf.get('password')
  var options = {
    hostname: 'backpack.ddns.net',
    port: 443,
    path: '/store/set/goodbet/items',
    method: 'POST',
    auth: username + ':' + password,
    headers: {
      'Content-Type': 'application/json'
    }
  }

  var _req = https.request(options, function(_res) {
    _res.setEncoding('utf8')
    _res.on('data', function(data) {
      res.write(data)
      next()
    })
    _res.on('close', function() {
      res.status(_res.statusCode).end()
    })
    _res.on('end', function() {
      res.status(_res.statusCode).end()
    })
  }).on('error', function(e) {
    res.writeHead(500)
    console.error(e.message)
    res.end()
  })

  var query = Object.keys(req.body)[0]
  if (typeof query !== 'undefined') {
    _req.write(query)
  }
  _req.end()
})

server = http.createServer(app)
server.listen(port, function() {
  console.log('Debug: server listening at port %d', port)
})

// Setup basic express server
var express = require('express')
, nobet = express()
, path = require('path')
, fs = require('fs')
, nconf = require('nconf')
, compress = require('compression')
, http = require('http')
, https = require('https')
, bodyParser = require('body-parser')
, timespan = require('timespan')

// parse application/x-www-form-urlencoded
nobet.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
nobet.use(bodyParser.json())

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
nobet.set('views', __dirname + '/public')
nobet.engine('html', require('jade').__express);
nobet.set('view engine', 'jade');

// For static html
nobet.use(express.static(path.join(__dirname, 'public')));

// Routing
nobet.get('/', function(req, res) {
  res.render('index.jade')
})

var recordCache = {}
var totalCache = {}

// Proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
nobet.route('/records')
.post(function(req, res, next) {
  var username = nconf.get('apikey')
  var password = nconf.get('password')
  var queryPath = '/store/set/goodbet/items?1=1'
  if (!!req.query.orderby) {
    queryPath += '&orderby=' + req.query.orderby
  }
  if (!!req.query.desc) {
    queryPath += '&desc=' + req.query.desc
  }
  if (!!req.query.asc) {
    queryPath += '&asc=' + req.query.asc
  }
  var options = {
    hostname: 'backpack.ddns.net',
    port: 443,
    path: queryPath,
    method: 'POST',
    auth: username + ':' + password,
    headers: {
      'Content-Type': 'application/json',
      'Keep-Alive': false
    }
  }

  var query = Object.keys(req.body)[0]
  var now = new Date()
  if (!!recordCache[query] && timespan.fromDates(recordCache[query].time, now).minutes < 10) {
    res.write(recordCache[query].data)
    res.status(200).end()
  }
  else {
    recordCache[query] = {
      data: '',
      time: now
    }
    var _req = https.request(options, function(_res) {
      _res.setEncoding('utf8')
      _res.on('data', function(data) {
        recordCache[query] = {
          data: recordCache[query].data + data,
          time: now
        }
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
      delete recordCache[query]
      res.writeHead(500)
      console.error(e.message)
      res.end()
    })

    if (typeof query !== 'undefined') {
      _req.write(query)
    }
    _req.end()
  }
})

nobet.route('/total')
.post(function(req, res, next) {
  var username = nconf.get('apikey')
  var password = nconf.get('password')
  var queryPath = '/store/set/goodbet/count'
  var options = {
    hostname: 'backpack.ddns.net',
    port: 443,
    path: queryPath,
    method: 'POST',
    auth: username + ':' + password,
    headers: {
      'Content-Type': 'application/json',
      'Keep-Alive': false
    }
  }

  var query = Object.keys(req.body)[0]
  var now = new Date()
  if (!!totalCache[query] && timespan.fromDates(totalCache[query].time, now).minutes < 10) {
    res.write(totalCache[query].data)
    res.status(200).end()
  }
  else {
    totalCache[query] = {
      data: '',
      time: now
    }

    var _req = https.request(options, function(_res) {
      _res.setEncoding('utf8')
      _res.on('data', function(data) {
        totalCache[query] = {
          data: totalCache[query].data + data,
          time: now
        }
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
      delete totalCache[query]
      res.writeHead(500)
      console.error(e.message)
      res.end()
    })

    var query = Object.keys(req.body)[0]
    if (typeof query !== 'undefined') {
      _req.write(query)
    }
    _req.end()
}
})

server = http.createServer(nobet)
server.listen(port, function() {
  console.log('Debug: server listening at port %d', port)
})

var fs = require('fs')
  , url = require('url')
  , http = require('http')
  , io = require('socket.io')
  , exec = require('child_process').exec;

var updateCallback, connectCallback;

var msgCount = 0;

var clients = [];
var server = http.createServer(function (req, res) {
  var path = (url.parse(req.url).pathname == '/') 
    ? '/view/client.html' 
    : url.parse(req.url).pathname;
  var mime = path.split('.').pop();
  if (mime == 'js') {
    mime = 'text/javascript';
  } else if (mime == 'jpg' || mime == 'png') {
    mime = 'image/' + mime;
  } else {
    mime = 'text/' + mime;
  }
  fs.readFile('.' + path, function (err, data) {
    if (err) {
      res.writeHead(404);
      res.end();
    } else {
      res.writeHead(200, {"Content-Type": mime});
      res.end(data);
    }
  });
});

exports.start = function (connectcb, updatecb) {
  server.listen(3000);
  io.listen(server).sockets.on('connection', function (socket) {
    clients.push(socket);
    connectcb(clients);
    exports.emit('count', clients.length);

    socket.on('update', function (data) {
      exports.emit('update', data, function () {
        msgCount++;
        updatecb(data, msgCount);
      });
    });
    
    socket.on('disconnect', function() {
      for (var i = 0; i < clients.length; i++) {
        if (clients[i] == this) {
          clients.splice(i, 1);
          exports.emit('count', clients.length);
          connectcb(clients);
        }
      }
    });

    socket.on('whisper', function (data) {
      var msg = JSON.parse(data);
      for (var i = 0; i < clients.length; i++) {
        if (msg.targetId == clients[i].id) {
          clients[i].emit('whisper', data);
          break;
        }
      }
    });

  });
}

exports.end = function () {
  
}

exports.emit = function (name, data, callback) {
  if (clients.length > 0) {
    for (var i = 0; i < clients.length; i++) {
      clients[i].emit(name, data);
    }
    if (typeof callback === 'function') {
      callback();
    }
  }
}
'use strict';

/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var bodyParser = require('body-parser'); // body-parser는 JSON 요청의 본문을 구문 분석하여 req.body로 사용할 수 있게 합니다.

var socket = require('./routes/socket.js');
var { registerUser } = require('./routes/socket.js'); // registerUser 함수만 가져오기

var app = express();
var server = http.createServer(app);

/* Configuration */
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.set('port', 3000);

if (process.env.NODE_ENV === 'development') {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
}

/* Socket.io Communication */
var io = require('socket.io')(server);
io.sockets.on('connection', socket);

// post 요청으로 username, password를 받음
app.post('/register', function(req, res) {
  console.log('Register endpoint hit'); // 추가된 디버깅 로그
  const { name, password } = req.body;
  console.log('Request body:', req.body); // 추가된 디버깅 로그
  if (registerUser(name, password)) {
    console.log(`User registered: ${name}`);
    res.status(200).json({ success: true });
  } else {
    console.log(`User registration failed: ${name}`);
    res.status(400).json({ success: false, message: 'Name already exists' });
  }
});

/* Start server */
server.listen(app.get('port'), function (){
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

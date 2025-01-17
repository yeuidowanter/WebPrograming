'use strict';

// Keep track of which names are used so that there are no duplicates
var userNames = (function () {
  var names = {};
 

  var claim = function (name) {
    if (!name || names[name]) {
      return false;
    } else {
      names[name] = true;
      return true;
    }
  };

  // find the lowest unused "guest" name and claim it
  var getGuestName = function () {
    var name,
      nextUserId = 1;

    do {
      name = 'Guest ' + nextUserId;
      nextUserId += 1;
    } while (!claim(name));

    return name;
  };

  // serialize claimed names as an array
  var get = function () {
    var res = [];
    for (var user in names) {
      
        res.push(user);
      
    }
    return res;
  };

  var free = function (name) {
    if (names[name]) {
      delete names[name];
    }
  };

  // 사용자 정보를 저장하는 객체 및 회원가입 함수 추가
  var registerUser = function(name, password) {
    if (users[name]) {
      return false;
    }
    users[name] = { name, password };
    return true;
  };

  return {
    claim: claim,
    free: free,
    get: get,
    getGuestName: getGuestName,
    registerUser: registerUser
  };
}());

// export function for listening to the socket
module.exports = function (socket) {
  var name = userNames.getGuestName();

  // send the new user their name and a list of users
  socket.emit('init', {
    name: name,
    users: userNames.get()
  });

  // notify other clients that a new user has joined
  socket.broadcast.emit('user:join', {
    name: name
  });

  // broadcast a user's message to other users
  socket.on('send:message', function (data) {
    socket.broadcast.emit('send:message', {
      user: name,
      text: data.text
    });
  });

  // validate a user's name change, and broadcast it on success
  socket.on('change:name', function (data, fn) {
    if (userNames.claim(data.name)) {
      var oldName = name;
      userNames.free(oldName);

      name = data.name;
      
      socket.broadcast.emit('change:name', {
        oldName: oldName,
        newName: name
      });

      fn(true);
    } else {
      fn(false);
    }
  });

  // clean up when a user leaves, and broadcast it to other users
  socket.on('disconnect', function () {
    socket.broadcast.emit('user:left', {
      name: name
    });
    userNames.free(name);
  });

  // 회원 가입 이벤트 핸들러 추가
  socket.on('disconnect', function () {
    socket.broadcast.emit('user:left', {
      name: name
    });
    userNames.free(name);
  });
};

// registerUser 함수 모듈 내보내기 추가
module.exports.registerUser = userNames.registerUser;

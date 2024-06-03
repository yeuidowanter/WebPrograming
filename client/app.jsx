'use strict';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import io from 'socket.io-client';
import { openDatabase, addUser, getUser, openChatDatabase, addChatroom, getChatroom, addMessage, getMessages } from './indexedDBHelper';

const socket = io.connect();

const RegisterForm = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    openDatabase().then(db => {
      return addUser(db, { name, password });
    }).then(() => {
      console.log('Registration successful');
      onRegister();
    }).catch(error => {
      console.error('Error during registration:', error);
      setMessage('Error during registration');
    });
  };

  return (
    <div className="page-container">
      <img src="/images/INU.png" alt="INU Logo" className="page-logo" />
      <div className="center">
        <div className="box-container">
          <h3>회원가입</h3>
          <form className="register_form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="아이디"
              value={name}
              onChange={handleNameChange}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={handlePasswordChange}
            />
            <button className="button" type="submit">회원가입</button>
          </form>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

const LoginForm = ({ onLogin, onShowRegister }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    openDatabase().then(db => {
      return getUser(db, name);
    }).then(user => {
      if (user && user.password === password) {
        console.log('Login successful');
        onLogin(name);
      } else {
        console.error('Login failed');
        alert('Login failed');
      }
    }).catch(error => {
      console.error('Error during login:', error);
    });
  };

  return (
    <div className="page-container">
      <img src="/images/INU.png" alt="INU Logo" className="page-logo" />
      <div className="center">
        <div className="box-container">
          <h3>로그인</h3>
          <form className="login_form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="아이디"
              value={name}
              onChange={handleNameChange}
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={handlePasswordChange}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="button" type="submit">로그인</button>
              <button className="button" type="button" onClick={onShowRegister}>회원가입</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ChatApp = () => {
  const [state, setState] = useState({
    users: [],
    messages: [],
    text: '',
    isRegistered: false,
    isLoggedIn: false,
    currentUser: '',
    searchChatName: '',
    chatroom: null,
    chatroomNotFound: false
  });

  useEffect(() => {
    socket.on('init', _initialize);
    socket.on('send:message', _messageRecieve);
    socket.on('user:join', _userJoined);
    socket.on('user:left', _userLeft);
    socket.on('change:name', _userChangedName);

    return () => {
      socket.off('init', _initialize);
      socket.off('send:message', _messageRecieve);
      socket.off('user:join', _userJoined);
      socket.off('user:left', _userLeft);
      socket.off('change:name', _userChangedName);
    };
  }, []);

  useEffect(() => {
    if (state.chatroom) {
      loadMessages(state.chatroom.chatname);
    }
  }, [state.chatroom]);

  const _initialize = (data) => {
    const { users, name } = data;
    setState((prevState) => ({ ...prevState, users, currentUser: name }));
  };

  const _messageRecieve = (message) => {
    const { messages } = state;
    messages.push(message);
    setState({ ...state, messages });
  };

  const _userJoined = (data) => {
    const { users } = state;
    users.push(data.name);
    setState({ ...state, users });
  };

  const _userLeft = (data) => {
    const { users } = state;
    const index = users.indexOf(data.name);
    if (index !== -1) {
      users.splice(index, 1);
      setState({ ...state, users });
    }
  };

  const _userChangedName = (data) => {
    const { users } = state;
    const index = users.indexOf(data.oldName);
    if (index !== -1) {
      users.splice(index, 1, data.newName);
      setState({ ...state, users });
    }
  };

  const handleRegistration = () => {
    setState({ ...state, isRegistered: true });
  };

  const handleLogin = (name) => {
    setState({ ...state, isLoggedIn: true, currentUser: name });
  };

  const handleSearchChange = (e) => {
    setState({ ...state, searchChatName: e.target.value });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const { searchChatName } = state;
    openChatDatabase().then(db => {
      return getChatroom(db, searchChatName);
    }).then(chatroom => {
      if (chatroom) {
        console.log('Chatroom found:', chatroom);
        setState({ ...state, chatroom, chatroomNotFound: false });
      } else {
        console.log('Chatroom not found');
        setState({ ...state, chatroom: null, chatroomNotFound: true });
      }
    }).catch(error => {
      console.error('Error searching chatroom:', error);
    });
  };

  const handleCreateChatroom = () => {
    const { searchChatName } = state;
    const newChatroom = { chatname: searchChatName, description: '새로 생성된 채팅방입니다.' };
    openChatDatabase().then(db => {
      return addChatroom(db, newChatroom);
    }).then(() => {
      console.log('Chatroom created:', newChatroom);
      setState({ ...state, chatroom: newChatroom, chatroomNotFound: false });
    }).catch(error => {
      console.error('Error creating chatroom:', error);
    });
  };

  const loadMessages = (chatname) => {
    openChatDatabase().then(db => {
      return getMessages(db, chatname);
    }).then(messages => {
      console.log('Loaded messages:', messages);
      setState({ ...state, messages });
    }).catch(error => {
      console.error('Error loading messages:', error);
    });
  };

  const handleMessageSubmit = (message) => {
    const { chatroom } = state;
    if (!chatroom) {
      console.error('No chatroom selected');
      return;
    }
    const newMessage = {
      chatname: chatroom.chatname,
      user: state.currentUser,
      text: message.text,
      timestamp: new Date()
    };
    openChatDatabase().then(db => {
      return addMessage(db, newMessage);
    }).then(() => {
      loadMessages(chatroom.chatname);
    }).catch(error => {
      console.error('Error adding message:', error);
    });
  };

  if (!state.isRegistered) {
    return <RegisterForm onRegister={handleRegistration} />;
  }

  if (!state.isLoggedIn) {
    return <LoginForm onLogin={handleLogin} onShowRegister={() => setState({ ...state, isRegistered: false })} />;
  }

  return (
    <div className="chat-app">
      <div className="sidebar">
        <img src="/images/INU.png" alt="INU Logo" className="sidebar-logo" />
        <div className="search-box">
          <input
            type="text"
            placeholder="채팅방 이름 검색"
            value={state.searchChatName}
            onChange={handleSearchChange}
          />
          <button onClick={handleSearchSubmit} className="search-button">
            <img src="/images/search.png" alt="Search" className="search-icon" />
          </button>
        </div>
        {state.chatroomNotFound && (
          <div className="chatroom-not-found">
            <p>채팅방이 없습니다. "{state.searchChatName}" 이름으로 채팅방을 만드시겠습니까?</p>
            <button onClick={handleCreateChatroom}>채팅방 생성</button>
          </div>
        )}
      </div>
      <div className="message-container">
        {state.chatroom && (
          <div className="messages-header">
            <h3>채팅방: {state.chatroom.chatname}</h3>
          </div>
        )}
        <div className="message-list">
          {state.chatroom && <MessageList messages={state.messages} currentUser={state.currentUser} />}
        </div>
        <div className="message-form-container">
          {state.chatroom && <MessageForm onMessageSubmit={handleMessageSubmit} user={state.currentUser} />}
        </div>
      </div>
    </div>
  );
};

const Message = ({ user, text, timestamp, isCurrentUser }) => (
  <div className={`message ${isCurrentUser ? 'right' : 'left'}`}>
    <strong>{user} :</strong>
    <span>{text}</span>
    <div className='timestamp'>{new Date(timestamp).toLocaleString()}</div>
  </div>
);

const MessageList = ({ messages, currentUser }) => (
  <div>
    {messages.map((message, i) => (
      <div
        key={i}
        className={`message ${message.user === currentUser ? 'right' : 'left'}`}
      >
        <Message
          user={message.user}
          text={message.text}
          timestamp={message.timestamp}
          isCurrentUser={message.user === currentUser}
        />
      </div>
    ))}
  </div>
);

const MessageForm = ({ onMessageSubmit, user }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = { user, text };
    onMessageSubmit(message);
    setText('');
  };

  return (
    <div className='message_form'>
      <form onSubmit={handleSubmit}>
        <div className='input-group'>
          <input
            placeholder='메시지 입력'
            className='textinput'
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <button type="submit">전송</button>
        </div>
      </form>
    </div>
  );
};

const ChangeNameForm = ({ onChangeName }) => {
  const [newName, setNewName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onChangeName(newName);
    setNewName('');
  };

  return (
    <div className='change_name_form'>
      <h3>아이디 변경</h3>
      <form onSubmit={handleSubmit}>
        <div className='input-group'>
          <input
            placeholder='변경할 아이디 입력'
            onChange={(e) => setNewName(e.target.value)}
            value={newName}
          />
          <button type="submit">변경</button>
        </div>
      </form>
    </div>
  );
};

ReactDOM.render(<ChatApp />, document.getElementById('app'));

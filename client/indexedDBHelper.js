// client/indexedDBHelper.js

export function openChatDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('chatDB', 1); // chatDB라는 이름의 데이터베이스를 엽니다. 버전은 1입니다.
  
      request.onupgradeneeded = (event) => { // 데이터베이스가 새로 생성되거나 버전이 업그레이드될 때 호출됩니다.
        const db = event.target.result; // 업그레이드된 데이터베이스 객체를 가져옵니다.
        if (!db.objectStoreNames.contains('chatrooms')) { // chatrooms라는 오브젝트 스토어가 없으면 생성합니다.
          db.createObjectStore('chatrooms', { keyPath: 'chatname' }); // chatname을 키로 하는 오브젝트 스토어를 생성합니다.
        }
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          messageStore.createIndex('chatname', 'chatname', { unique: false });
        }
      };
  
      request.onsuccess = (event) => { // 데이터베이스를 여는 데 성공하면 호출됩니다.
        resolve(event.target.result); // 열린 데이터베이스 객체를 반환합니다.
      };
  
      request.onerror = (event) => { // 데이터베이스를 여는 데 실패하면 호출됩니다.
        reject(event.target.error); // 오류를 반환합니다.
      };
    });
  }
  
  export function addChatroom(db, chatroom) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chatrooms'], 'readwrite');
      const objectStore = transaction.objectStore('chatrooms');
      const request = objectStore.add(chatroom);
  
      request.onsuccess = () => {
        resolve();
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  export function getChatroom(db, chatname) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['chatrooms'], 'readonly');
      const objectStore = transaction.objectStore('chatrooms');
      const request = objectStore.get(chatname);
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  // 사용자 데이터베이스 열기
  export function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('UserDatabase', 1);
  
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'name' });
        }
      };
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  // 사용자 정보 가져오기
  export function getUser(db, name) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const objectStore = transaction.objectStore('users');
      const request = objectStore.get(name);
  
      request.onsuccess = (event) => {
        if (event.target.result) {
          resolve(event.target.result);
        } else {
          resolve(null);
        }
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  // 사용자 추가
  export function addUser(db, user) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const objectStore = transaction.objectStore('users');
      const request = objectStore.add(user);
  
      request.onsuccess = () => {
        resolve();
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  // 메시지 추가
  export function addMessage(db, message) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readwrite');
      const objectStore = transaction.objectStore('messages');
      const request = objectStore.add(message);
  
      request.onsuccess = () => {
        resolve();
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  // 메시지 가져오기
  export function getMessages(db, chatname) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['messages'], 'readonly');
      const objectStore = transaction.objectStore('messages');
      const index = objectStore.index('chatname');
      const request = index.getAll(chatname);
  
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
  
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
  
  
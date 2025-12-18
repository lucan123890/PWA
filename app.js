// ----------- Firebase Setup -------------
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ----------- Elements -------------
const usernamePage = document.getElementById('username-page');
const chatPage = document.getElementById('chat-page');
const joinBtn = document.getElementById('join-btn');
const usernameInput = document.getElementById('username-input');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let username = '';

// ----------- Username Handling -------------
joinBtn.addEventListener('click', () => {
  const value = usernameInput.value.trim();
  if (!value) return alert("Please enter a username!");
  username = value;
  usernamePage.style.display = 'none';
  chatPage.style.display = 'block';
  listenForMessages();
});

// ----------- Sending Messages -------------
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  const msg = {
    user: username,
    text,
    timestamp: Date.now()
  };
  db.ref('messages').push(msg);
  messageInput.value = '';
}

// ----------- Listening for Messages -------------
function listenForMessages() {
  db.ref('messages').on('child_added', (snapshot) => {
    const msg = snapshot.val();
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<span class="user">${msg.user}:</span> ${msg.text}`;
    messagesDiv.appendChild(div);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

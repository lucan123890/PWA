// -------- Firebase Setup -------------
const firebaseConfig = {
  apiKey: "AIzaSyC-fWhhmVQ8ycZ7-JKe3JMkEaDpaHOohXY",
  authDomain: "pwa-site-6a264.firebaseapp.com",
  projectId: "pwa-site-6a264",
  storageBucket: "pwa-site-6a264.firebasestorage.app",
  messagingSenderId: "866725666680",
  appId: "1:866725666680:web:f359bb94f75903eb6df28d",
  measurementId: "G-EVWCLQM7L8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// -------- Elements -------------
const loginPage = document.getElementById('login-page');
const chatPage = document.getElementById('chat-page');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

let username = '';

// -------- Authentication -------------
loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      username = userCredential.user.email;
      loginPage.style.display = 'none';
      chatPage.style.display = 'block';
      listenForMessages();
    })
    .catch(error => {
      loginError.textContent = 'Invalid Credentials';
    });
});

logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    chatPage.style.display = 'none';
    loginPage.style.display = 'block';
    messagesDiv.innerHTML = '';
  });
});

// -------- Sending Messages -------------
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

// -------- Listening for Messages -------------
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

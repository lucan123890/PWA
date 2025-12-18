// -------- Firebase Setup -------------
const firebaseConfig = {
  apiKey: "AIzaSyC-fWhhmVQ8ycZ7-JKe3JMkEaDpaHOohXY",
  authDomain: "pwa-site-6a264.firebaseapp.com",
  databaseURL: "https://pwa-site-6a264-default-rtdb.firebaseio.com/",
  projectId: "pwa-site-6a264",
  storageBucket: "pwa-site-6a264.firebasestorage.app",
  messagingSenderId: "866725666680",
  appId: "1:866725666680:web:f359bb94f75903eb6df28d",
  measurementId: "G-EVWCLQM7L8"
};


firebase.initializeApp(firebaseConfig);

const db = firebase.database();

console.log('Firebase initialized');

document.getElementById('test-db').addEventListener('click', () => {
  db.ref('HTML_FIX_TEST').set({
    success: true,
    time: Date.now()
  }).then(() => {
    console.log('WRITE SUCCESS');
  }).catch(err => {
    console.error('WRITE FAILED', err);
  });
});


// Elements
const loginPage = document.getElementById('login-page');
const landingPage = document.getElementById('landing-page');
const chatPage = document.getElementById('chat-page');
const gymPage = document.getElementById('gym-page');

const loginBtn = document.getElementById('login-btn');
const chatBtn = document.getElementById('chat-btn');
const gymBtn = document.getElementById('gym-btn');
const logoutBtn = document.getElementById('logout-btn');
const backBtn = document.getElementById('back-btn');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

const prListDiv = document.getElementById('pr-list');
const liftName = document.getElementById('lift-name');
const liftWeight = document.getElementById('lift-weight');
const liftReps = document.getElementById('lift-reps');
const liftSets = document.getElementById('lift-sets');
const addLiftBtn = document.getElementById('add-lift-btn');

const prName = document.getElementById('pr-name');
const prWeight = document.getElementById('pr-weight');
const prReps = document.getElementById('pr-reps');
const uploadPrBtn = document.getElementById('upload-pr-btn');

let username = '';
let userId = '';


function safeUserId(email) {
  return email.replace(/[.#$[\]]/g, '_');
}


// -------- Authentication -------------
loginBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      username = userCredential.user.email;
      userId = safeUserId(username);
      loginPage.style.display = 'none';
      landingPage.style.display = 'block';
    })
    .catch(error => {
      loginError.textContent = error.message;
    });
});

logoutBtn.addEventListener('click', () => {
  auth.signOut().then(() => {
    chatPage.style.display = 'none';
    gymPage.style.display = 'none';
    landingPage.style.display = 'none';
    loginPage.style.display = 'block';
    messagesDiv.innerHTML = '';
  });
});

// -------- Navigation ---------
chatBtn.addEventListener('click', () => {
  landingPage.style.display = 'none';
  chatPage.style.display = 'block';
  listenForMessages();
});

gymBtn.addEventListener('click', () => {
  landingPage.style.display = 'none';
  gymPage.style.display = 'block';
  loadRecentPRs();
});

backBtn.addEventListener('click', () => {
  gymPage.style.display = 'none';
  chatPage.style.display = 'none';
  landingPage.style.display = 'block';
});

// -------- Chat Logic ---------
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  const msg = { user: username, text, timestamp: Date.now() };
  db.ref('messages').push(msg);
  messageInput.value = '';
}

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



// Normalize movement names for consistent matching
function normalizeMovement(name) {
  return name.replace(/\s+/g, '').toLowerCase();
}

// Load PRs for all users
function loadRecentPRs() {
  prListDiv.innerHTML = '';

  db.ref('users').on('value', snapshot => {
    prListDiv.innerHTML = '';

    snapshot.forEach(userSnap => {
      const data = userSnap.val();
      const userEmail = data.user || 'Unknown';
      const pr = data.pr;

      const section = document.createElement('div');
      section.classList.add('user-pr-section');

      const header = document.createElement('div');
      header.classList.add('user-header');
      header.textContent =
        userEmail === username ? `${userEmail} (You)` : userEmail;

      section.appendChild(header);

      const prDiv = document.createElement('div');
      prDiv.classList.add('pr-item');

      if (pr) {
        prDiv.textContent = `${pr.movement} — ${pr.weight} kg x ${pr.reps} reps`;
      } else {
        prDiv.textContent = 'No PR yet';
      }

      section.appendChild(prDiv);
      prListDiv.appendChild(section);
    });
  });
}


// Add lift with case-insensitive matching and automatic new ID
addLiftBtn.addEventListener('click', () => {
  const movementRaw = liftName.value.trim();
  if (!movementRaw || !liftWeight.value || !liftReps.value || !liftSets.value) return alert('Fill all lift fields!');
  const movementNorm = normalizeMovement(movementRaw);

  const liftsRef = db.ref(`users/${userId}/lifts`);
  liftsRef.once('value').then(snapshot => {
    let existingKey = null;
    snapshot.forEach(child => {
      if (normalizeMovement(child.val().movement) === movementNorm) {
        existingKey = child.key;
      }
    });

    const liftData = {
      movement: movementRaw,
      weight: Number(liftWeight.value),
      reps: Number(liftReps.value),
      sets: Number(liftSets.value)
    };

    if (existingKey) {
      liftsRef.child(existingKey).set(liftData);
    } else {
      liftsRef.push(liftData);
    }

    liftName.value = liftWeight.value = liftReps.value = liftSets.value = '';
  });
});

// Upload PR and refresh display
uploadPrBtn.addEventListener('click', () => {
  const movementRaw = prName.value.trim();
  if (!movementRaw || !prWeight.value || !prReps.value) return alert('Fill all PR fields!');

  const prData = {
    movement: movementRaw,
    weight: Number(prWeight.value),
    reps: Number(prReps.value),
    timestamp: Date.now()
  };

  db.ref(`users/${userId}/pr`).set({
  user: username,
  ...prData
  });

  prName.value = prWeight.value = prReps.value = '';
  loadRecentPRs();
});
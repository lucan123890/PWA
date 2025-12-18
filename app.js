// ---------------- Firebase Config ----------------
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

const auth = firebase.auth();
const db = firebase.database();

// ---------------- Global Variables ----------------
let username = '';
let userId = '';

// ---------------- Helper Functions ----------------
function safeUserId(email) {
  return email.replace(/[.#$[\]]/g, '_');
}

function normalizeMovement(name) {
  return name.replace(/\s+/g, '').toLowerCase();
}

// ---------------- DOM Elements ----------------
const loginPage = document.getElementById('login-page');
const landingPage = document.getElementById('landing-page');
const gymPage = document.getElementById('gym-page');
const chatPage = document.getElementById('chat-page');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');

const gymBtn = document.getElementById('gym-btn');
const chatBtn = document.getElementById('chat-btn');

const gymBackBtn = document.getElementById('gym-back-btn');
const chatBackBtn = document.getElementById('chat-back-btn');

// Gym Stats
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

// Chat
const chatBox = document.getElementById('chat-box');
const chatMessage = document.getElementById('chat-message');
const sendMsgBtn = document.getElementById('send-msg-btn');

// ---------------- Auth ----------------
signupBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  auth.createUserWithEmailAndPassword(email, pass)
    .then(cred => {
      alert('User created');
    })
    .catch(err => alert(err.message));
});

loginBtn.addEventListener('click', () => {
  const email = emailInput.value;
  const pass = passwordInput.value;
  auth.signInWithEmailAndPassword(email, pass)
    .then(cred => {
      username = cred.user.email;
      userId = safeUserId(username);
      loginPage.style.display = 'none';
      landingPage.style.display = 'block';
      loadRecentPRs();
      loadChatMessages();
    })
    .catch(err => alert(err.message));
});

// ---------------- Navigation ----------------
gymBtn.addEventListener('click', () => {
  landingPage.style.display = 'none';
  gymPage.style.display = 'block';
});

chatBtn.addEventListener('click', () => {
  landingPage.style.display = 'none';
  chatPage.style.display = 'block';
});

gymBackBtn.addEventListener('click', () => {
  gymPage.style.display = 'none';
  landingPage.style.display = 'block';
});

chatBackBtn.addEventListener('click', () => {
  chatPage.style.display = 'none';
  landingPage.style.display = 'block';
});

// ---------------- Gym Stats ----------------
function loadRecentPRs() {
  prListDiv.innerHTML = '';
  db.ref('users').on('value', snapshot => {
    prListDiv.innerHTML = '';
    snapshot.forEach(userSnap => {
      const userData = userSnap.val();
      const pr = userData.pr;
      const email = userData.user || userSnap.key;

      const section = document.createElement('div');
      section.classList.add('user-pr-section');

      const header = document.createElement('div');
      header.classList.add('user-header');
      header.textContent = email === username ? `${email} (You)` : email;
      section.appendChild(header);

      const prDiv = document.createElement('div');
      prDiv.classList.add('pr-item');
      prDiv.textContent = pr ? `${pr.movement} — ${pr.weight} kg x ${pr.reps} reps` : "No PR yet";
      section.appendChild(prDiv);

      prListDiv.appendChild(section);
    });
  });
}

addLiftBtn.addEventListener('click', () => {
  const movementRaw = liftName.value.trim();
  if (!movementRaw || !liftWeight.value || !liftReps.value || !liftSets.value) return alert('Fill all lift fields!');
  const movementNorm = normalizeMovement(movementRaw);

  const liftsRef = db.ref(`users/${userId}/lifts`);
  liftsRef.once('value').then(snapshot => {
    let existingKey = null;
    snapshot.forEach(child => {
      if (normalizeMovement(child.val().movement) === movementNorm) existingKey = child.key;
    });

    const liftData = {
      movement: movementRaw,
      weight: Number(liftWeight.value),
      reps: Number(liftReps.value),
      sets: Number(liftSets.value)
    };

    if (existingKey) liftsRef.child(existingKey).set(liftData);
    else liftsRef.push(liftData);

    liftName.value = liftWeight.value = liftReps.value = liftSets.value = '';
  });
});

uploadPrBtn.addEventListener('click', () => {
  const movementRaw = prName.value.trim();
  if (!movementRaw || !prWeight.value || !prReps.value) return alert('Fill all PR fields!');

  const prData = {
    movement: movementRaw,
    weight: Number(prWeight.value),
    reps: Number(prReps.value),
    timestamp: Date.now(),
    user: username
  };

  db.ref(`users/${userId}/pr`).set(prData)
    .then(() => {
      prName.value = prWeight.value = prReps.value = '';
      loadRecentPRs();
    })
    .catch(err => console.error("PR upload failed", err));
});

// ---------------- Chat ----------------
function loadChatMessages() {
  chatBox.innerHTML = '';
  db.ref('messages').on('value', snapshot => {
    chatBox.innerHTML = '';
    snapshot.forEach(msgSnap => {
      const msg = msgSnap.val();
      const div = document.createElement('div');
      div.textContent = `${msg.user}: ${msg.text}`;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

sendMsgBtn.addEventListener('click', () => {
  const text = chatMessage.value.trim();
  if (!text) return;
  db.ref('messages').push({
    user: username,
    text,
    timestamp: Date.now()
  });
  chatMessage.value = '';
});

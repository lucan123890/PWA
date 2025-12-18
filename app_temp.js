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

// User Details
const userPage = document.getElementById('user-page');
const userNameHeader = document.getElementById('user-name-header');
const topMovementsList = document.getElementById('top-movements-list');
const allLiftsList = document.getElementById('all-lifts-list');
const userBackBtn = document.getElementById('user-back-btn');

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
      db.ref('users').on('value', snapshot => {
        loadRecentPRs();
      });
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
      const liftsObj = userData.lifts || {};
      const lifts = Object.values(liftsObj);
      const email = userData.user || userSnap.key;

      let mostRecentPR = null;
      const maxPerMovement = {}; // Tracks current PR per movement

      // Sort lifts chronologically by timestamp
      lifts.sort((a, b) => a.timestamp - b.timestamp);

      for (const lift of lifts) {
        const norm = normalizeMovement(lift.movement);

        // If this lift beats previous PR for the movement
        if (!maxPerMovement[norm] || lift.weight > maxPerMovement[norm].weight) {
          maxPerMovement[norm] = lift;
          // Update mostRecentPR to this lift
          mostRecentPR = lift;
        }
      }

      const section = document.createElement('div');
      section.classList.add('user-pr-section');

      const header = document.createElement('div');
      header.classList.add('user-header');
      header.textContent = email === username ? `${email} (You)` : email;
      header.addEventListener('click', () => openUserPage(userSnap.key, email));
      section.appendChild(header);

      const prDiv = document.createElement('div');
      prDiv.classList.add('pr-item');
      prDiv.textContent = mostRecentPR
        ? `${mostRecentPR.movement} — ${mostRecentPR.weight} kg x ${mostRecentPR.reps} reps`
        : "No lifts yet";
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

// Upload new lift
uploadPrBtn.addEventListener('click', () => {
  const movementRaw = prName.value.trim();
  const weight = Number(prWeight.value);
  const reps = Number(prReps.value);

  if (!movementRaw || !weight || !reps) return alert('Fill all fields!');

  const liftEntry = {
    movement: movementRaw,
    weight,
    reps,
    sets: 1, // default for PR entry
    timestamp: Date.now(),
    user: username
  };

  // Push new lift to lifts log
  db.ref(`users/${userId}/lifts`).push(liftEntry)
    .then(() => {
      console.log('Lift uploaded');
      prName.value = prWeight.value = prReps.value = '';
      // No need to call loadRecentPRs manually if using real-time listener
    })
    .catch(err => console.error('Lift upload failed', err));
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

function openUserPage(safeId, displayName) {
  console.log('Opening user page for:', safeId, displayName);
  console.log('DOM elements:', userPage, topMovementsList, allLiftsList);
  // Hide other pages
  gymPage.style.display = 'none';
  landingPage.style.display = 'none';
  chatPage.style.display = 'none';
  userPage.style.display = 'block';

  userNameHeader.textContent = displayName;

  // Clear previous data
  topMovementsList.innerHTML = '';
  allLiftsList.innerHTML = '';

  const liftsRef = db.ref(`users/${safeId}/lifts`);

  liftsRef.once('value').then(snapshot => {
    const lifts = [];

    snapshot.forEach(child => {
      lifts.push(child.val());
    });

    if (lifts.length === 0) return;

    // --- Top 5 most popular movements by occurrence
    const movementMap = {};

    lifts.forEach(lift => {
      const norm = normalizeMovement(lift.movement);
      if (!movementMap[norm]) movementMap[norm] = [];
      movementMap[norm].push(lift);
    });

    // Sort movements by number of times logged
    const sortedMovements = Object.entries(movementMap)
    
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5); // top 5

    sortedMovements.forEach(([_, liftArray]) => {
      // Find the max weight lifted for this movement
      const best = liftArray.reduce((max, curr) => curr.weight > max.weight ? curr : max, liftArray[0]);
      const li = document.createElement('li');
      li.textContent = `${best.movement}: ${best.weight} kg x ${best.reps} reps`;
      topMovementsList.appendChild(li);
    });

    // --- Full lift log in reverse chronological order
    lifts.sort((a, b) => b.timestamp - a.timestamp);

    lifts.forEach(lift => {
      const li = document.createElement('li');
      li.textContent = `${lift.movement} — ${lift.weight} kg x ${lift.reps} reps`;
      allLiftsList.appendChild(li);
    });
  });
}

userBackBtn.addEventListener('click', () => {
  userPage.style.display = 'none';
  gymPage.style.display = 'block';
});

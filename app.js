function startFocus() {
  alert("Focus session started! 🚀");
}

function openJournal() {
  alert("Opening your personal journal...");
}

function viewStats() {
  alert("Here are your stats!");
}

// Optional: register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('Service Worker Registered'))
    .catch(err => console.error(err));
}


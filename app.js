// ---------- FIREBASE ----------
firebase.initializeApp({
  apiKey: "AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain: "snapangle.firebaseapp.com",
  projectId: "snapangle"
});

firebase.auth().signInAnonymously().then(res => {
  document.getElementById("player").innerText = "Player: " + res.user.uid;
});

// ---------- AUDIO ----------
const sounds = {
  swipeX: new Audio("swipex.mp3"),
  swipeY: new Audio("swipey.mp3"),
  click: new Audio("click.mp3"),
  win: new Audio("win.mp3")
};

let audioReady = false;

function unlockAudio() {
  Object.values(sounds).forEach(s => {
    s.muted = true;
    s.play().then(() => {
      s.pause();
      s.currentTime = 0;
      s.muted = false;
    });
  });
  audioReady = true;
}

function play(s) {
  if (!audioReady) return;
  s.currentTime = 0;
  s.play().catch(()=>{});
}

// ---------- DATA ----------
const images = [
  "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=800",
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
  "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=800",
  "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800"
];

let index = 0;

const photo = document.getElementById("photo");
const dots = document.getElementById("dots");

function render() {
  photo.src = images[index];
  dots.innerHTML = "";
  images.forEach((_, i) => {
    const d = document.createElement("span");
    d.className = "dot" + (i === index ? " active" : "");
    dots.appendChild(d);
  });
}

// ---------- NAV (NO SOUND HERE) ----------
function next() {
  index = (index + 1) % images.length;
  render();
}

function prev() {
  index = (index - 1 + images.length) % images.length;
  render();
}

function best() {
  play(sounds.click);
  play(sounds.win);
  next();
}

// ---------- SWIPE (SOUND MOVED HERE) ----------
let sx = 0, sy = 0;
document.addEventListener("touchstart", e => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;

  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
    play(sounds.swipeX);
    dx < 0 ? next() : prev();
  }

  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 40) {
    play(sounds.swipeY);
  }
});

// ---------- START ----------
document.getElementById("startBtn").onclick = () => {
  unlockAudio();
  document.getElementById("overlay").style.display = "none";
  render();
};

document.getElementById("nextBtn").onclick = () => {
  play(sounds.swipeX);
  next();
};
document.getElementById("prevBtn").onclick = () => {
  play(sounds.swipeX);
  prev();
};
document.getElementById("bestBtn").onclick = best;
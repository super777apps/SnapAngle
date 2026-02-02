// 🔊 Sounds
const swipeX = new Audio("sounds/swipex.mp3");
const swipeY = new Audio("sounds/swipey.mp3");
const voteSound = new Audio("sounds/vote.mp3");
const winSound = new Audio("sounds/win.mp3");
const trySound = new Audio("sounds/try.mp3");

// 🧠 Competitions (still local URLs)
const competitions = [
  {
    title: "Best Laptop Angle",
    images: [
      { url: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68", v: 0 },
      { url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8", v: 0 },
      { url: "https://images.unsplash.com/photo-1509395176047-4a66953fd231", v: 0 },
      { url: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2", v: 0 },
      { url: "https://images.unsplash.com/photo-1518770660439-4636190af475", v: 0 }
    ]
  },
  {
    title: "Best Sunset Shot",
    images: [
      { url: "https://images.unsplash.com/photo-1501973801540-537f08ccae7b", v: 0 },
      { url: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63", v: 0 },
      { url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee", v: 0 },
      { url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e", v: 0 },
      { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470", v: 0 }
    ]
  }
];

let c = 0, i = 0;

const photo = document.getElementById("photo");
const title = document.getElementById("title");
const dots = document.getElementById("dots");
const msg = document.getElementById("message");
const usernameDiv = document.getElementById("username");

// 👤 Load user name from Firestore
function loadUser() {
  if (!window.currentUserId) return;

  db.collection("users").doc(window.currentUserId)
    .onSnapshot(doc => {
      if (doc.exists) {
        const u = doc.data();
        usernameDiv.innerText = `${u.username} • Wins ${u.totalWins}`;
      }
    });
}
loadUser();

// 📸 Render
function render() {
  title.innerText = competitions[c].title;
  photo.style.opacity = 0;
  setTimeout(() => {
    photo.src = competitions[c].images[i].url;
    photo.style.opacity = 1;
  }, 80);

  dots.innerHTML = "";
  competitions[c].images.forEach((_, idx) => {
    const d = document.createElement("div");
    d.className = "dot" + (idx === i ? " active" : "");
    dots.appendChild(d);
  });
}
render();

// 👉 Vote
document.getElementById("voteBtn").onclick = () => {
  voteSound.play();
  competitions[c].images[i].v++;
  nextImage();
};

// ❌ Skip
document.getElementById("skipBtn").onclick = () => {
  swipeX.play();
  nextImage();
};

function nextImage() {
  i++;
  if (i >= competitions[c].images.length) finish();
  else render();
}

// 🏆 Finish
function finish() {
  const imgs = competitions[c].images;
  const max = Math.max(...imgs.map(x => x.v));
  const won = imgs[i - 1].v === max;

  if (won) {
    winSound.play();
    msg.innerText = "🏆 You WIN!";
    updateWins();
  } else {
    trySound.play();
    msg.innerText = "😬 Very close!";
  }

  setTimeout(() => {
    c = (c + 1) % competitions.length;
    i = 0;
    msg.innerText = "";
    render();
  }, 1200);
}

// 🔥 Update wins in Firestore
function updateWins() {
  const ref = db.collection("users").doc(window.currentUserId);
  const today = new Date().toDateString();

  ref.get().then(doc => {
    const d = doc.data();
    const reset = d.lastWinDate !== today;

    ref.update({
      totalWins: firebase.firestore.FieldValue.increment(1),
      dailyWins: reset ? 1 : firebase.firestore.FieldValue.increment(1),
      weeklyWins: firebase.firestore.FieldValue.increment(1),
      monthlyWins: firebase.firestore.FieldValue.increment(1),
      lastWinDate: today
    });
  });
}

// 👆 Swipe
let sx, sy;

document.addEventListener("touchstart", e => {
  sx = e.touches[0].clientX;
  sy = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - sx;
  const dy = e.changedTouches[0].clientY - sy;

  if (Math.abs(dx) > Math.abs(dy)) {
    swipeX.play();
    photo.style.transform = `translateX(${dx}px)`;
    setTimeout(() => {
      photo.style.transform = "translateX(0)";
      nextImage();
    }, 60);
  } else {
    swipeY.play();
    c = dy < 0 ? (c + 1) % competitions.length :
                (c - 1 + competitions.length) % competitions.length;
    i = 0;
    render();
  }
});
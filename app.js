// 🔊 Sounds
const swipeSound = new Audio("sounds/swipe.mp3");
const voteSound = new Audio("sounds/vote.mp3");
const winSound = new Audio("sounds/win.mp3");
const trySound = new Audio("sounds/try.mp3");

// 🧠 Competitions
const competitions = [
  {
    title: "Best Laptop Angle",
    images: [
      { url: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68", votes: 0 },
      { url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8", votes: 0 },
      { url: "https://images.unsplash.com/photo-1509395176047-4a66953fd231", votes: 0 }
    ]
  },
  {
    title: "Best Sunset Shot",
    images: [
      { url: "https://images.unsplash.com/photo-1501973801540-537f08ccae7b", votes: 0 },
      { url: "https://images.unsplash.com/photo-1499346030926-9a72daac6c63", votes: 0 },
      { url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee", votes: 0 }
    ]
  },
  {
    title: "Best Car View",
    images: [
      { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70", votes: 0 },
      { url: "https://images.unsplash.com/photo-1511910849309-0c7fbb7b3e88", votes: 0 },
      { url: "https://images.unsplash.com/photo-1502877338535-766e1452684a", votes: 0 }
    ]
  }
];

let compIndex = 0;
let imgIndex = 0;

const photo = document.getElementById("photo");
const title = document.getElementById("title");
const message = document.getElementById("message");

// 📸 Show image
function showImage() {
  const comp = competitions[compIndex];
  title.innerText = comp.title;
  photo.style.opacity = 0;
  setTimeout(() => {
    photo.src = comp.images[imgIndex].url;
    photo.style.opacity = 1;
  }, 80);
}

showImage();

// 👉 Best Angle
document.getElementById("voteBtn").onclick = () => {
  voteSound.play();
  competitions[compIndex].images[imgIndex].votes++;
  nextImage();
};

// ❌ Skip
document.getElementById("skipBtn").onclick = () => {
  swipeSound.play();
  nextImage();
};

function nextImage() {
  imgIndex++;
  if (imgIndex >= competitions[compIndex].images.length) {
    showResult();
  } else {
    showImage();
  }
}

// 🏆 Result
function showResult() {
  const imgs = competitions[compIndex].images;
  const maxVotes = Math.max(...imgs.map(i => i.votes));
  const userVote = imgs[imgIndex - 1].votes === maxVotes;

  if (userVote) {
    winSound.play();
    message.innerText = "🏆 You WIN!";
  } else {
    trySound.play();
    message.innerText = "😬 Very close! Try again";
  }

  setTimeout(() => {
    nextCompetition();
  }, 1200);
}

// ⬆⬇ Competition navigation
function nextCompetition() {
  compIndex = (compIndex + 1) % competitions.length;
  reset();
}

function prevCompetition() {
  compIndex = (compIndex - 1 + competitions.length) % competitions.length;
  reset();
}

function reset() {
  imgIndex = 0;
  message.innerText = "";
  showImage();
}

// 👆 Swipe detection
let startX, startY;

document.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 40) voteSound.play(), nextImage();
    if (dx < -40) swipeSound.play(), nextImage();
  } else {
    if (dy < -40) swipeSound.play(), nextCompetition();
    if (dy > 40) swipeSound.play(), prevCompetition();
  }
});
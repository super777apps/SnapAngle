// 🔊 Sounds
const voteSound = new Audio("sounds/vote.mp3");
const swipeSound = new Audio("sounds/swipe.mp3");
const winSound = new Audio("sounds/win.mp3");

// 🖼️ Image competition (URL only)
const images = [
  { url: "https://picsum.photos/id/1015/600/400", votes: 0 },
  { url: "https://picsum.photos/id/1025/600/400", votes: 0 },
  { url: "https://picsum.photos/id/1035/600/400", votes: 0 }
];

let currentIndex = 0;

const photo = document.getElementById("photo");
const buttons = document.querySelector(".buttons");

// 📸 Show image
function showImage() {
  if (currentIndex >= images.length) {
    showWinner();
    return;
  }

  photo.style.transform = "translateX(0)";
  photo.src = images[currentIndex].url + "?t=" + Date.now();
}

// 🏆 Winner
function showWinner() {
  winSound.play();

  let winner = images[0];
  images.forEach(img => {
    if (img.votes > winner.votes) winner = img;
  });

  photo.src = winner.url + "?t=" + Date.now();

  buttons.innerHTML = `
    <div style="text-align:center">
      <h2>🏆 Best Angle Wins</h2>
      <p>This angle received the most votes</p>
    </div>
  `;
}

// 👍 Vote
function vote() {
  voteSound.play();
  images[currentIndex].votes++;
  currentIndex++;
  showImage();
}

// ➡ Skip
function skip() {
  swipeSound.play();
  currentIndex++;
  showImage();
}

// Buttons
document.getElementById("voteBtn").onclick = vote;
document.getElementById("skipBtn").onclick = skip;

// 👉 Swipe logic
let startX = 0;

photo.addEventListener("touchstart", e => {
  startX = e.touches[0].clientX;
});

photo.addEventListener("touchmove", e => {
  const moveX = e.touches[0].clientX - startX;
  photo.style.transform = `translateX(${moveX}px)`;
});

photo.addEventListener("touchend", e => {
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;

  if (diff > 80) {
    vote(); // swipe right
  } else if (diff < -80) {
    skip(); // swipe left
  } else {
    photo.style.transform = "translateX(0)";
  }
});

// 🚀 Start
showImage();
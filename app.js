// 🔊 Sounds
const voteSound = new Audio("sounds/vote.mp3");
const swipeSound = new Audio("sounds/swipe.mp3");
const winSound = new Audio("sounds/win.mp3");

// ✅ SAFE image URLs (no Unsplash restrictions)
const images = [
  { url: "https://picsum.photos/id/1015/600/400", votes: 0 },
  { url: "https://picsum.photos/id/1025/600/400", votes: 0 },
  { url: "https://picsum.photos/id/1035/600/400", votes: 0 }
];

let currentIndex = 0;

const photo = document.getElementById("photo");
const buttons = document.querySelector(".buttons");

function showImage() {
  if (currentIndex >= images.length) {
    showWinner();
    return;
  }

  // Force reload + debug visibility
  photo.src = images[currentIndex].url + "?t=" + Date.now();
  photo.style.display = "block";
}

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

document.getElementById("voteBtn").onclick = () => {
  voteSound.play();
  images[currentIndex].votes++;
  currentIndex++;
  showImage();
};

document.getElementById("skipBtn").onclick = () => {
  swipeSound.play();
  currentIndex++;
  showImage();
};

// Start
showImage();
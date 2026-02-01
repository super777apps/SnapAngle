// 🔊 Sounds
const voteSound = new Audio("sounds/vote.mp3");
const swipeSound = new Audio("sounds/swipe.mp3");
const winSound = new Audio("sounds/win.mp3");
const tryAgainSound = new Audio("sounds/tryagain.mp3");

// Unlock sound on mobile
document.addEventListener("touchstart", () => {
  voteSound.play().then(() => { voteSound.pause(); voteSound.currentTime = 0; }).catch(()=>{});
}, { once: true });

// 🏆 Competitions
const competitions = [
  { title: "🌄 Sunset Angles", images: ["https://picsum.photos/id/1015/600/400","https://picsum.photos/id/1016/600/400","https://picsum.photos/id/1018/600/400"] },
  { title: "🏙️ City Perspectives", images: ["https://picsum.photos/id/1020/600/400","https://picsum.photos/id/1024/600/400","https://picsum.photos/id/1031/600/400"] },
  { title: "🌿 Nature Close-ups", images: ["https://picsum.photos/id/1036/600/400","https://picsum.photos/id/1037/600/400","https://picsum.photos/id/1039/600/400"] },
  { title: "🚗 Motion Shots", images: ["https://picsum.photos/id/1040/600/400","https://picsum.photos/id/1041/600/400","https://picsum.photos/id/1043/600/400"] }
];

let compIndex = 0;
let images = [];
let currentIndex = 0;
let userVotes = [];

// Scoreboard: daily, weekly, monthly, yearly
let dailyWins = Number(localStorage.getItem("dailyWins")||0);
let weeklyWins = Number(localStorage.getItem("weeklyWins")||0);
let monthlyWins = Number(localStorage.getItem("monthlyWins")||0);
let yearlyWins = Number(localStorage.getItem("yearlyWins")||0);

const photo = document.getElementById("photo");
const titleEl = document.getElementById("competitionTitle");
const voteBtn = document.getElementById("voteBtn");
const skipBtn = document.getElementById("skipBtn");
const scoreboard = document.getElementById("scoreboard");
const feedback = document.getElementById("feedback");

// Update scoreboard UI
function updateScoreboard() {
  scoreboard.innerText = `Daily: ${dailyWins} | Weekly: ${weeklyWins} | Monthly: ${monthlyWins} | Yearly: ${yearlyWins}`;
}
updateScoreboard();

// Load a competition
function loadCompetition(index) {
  const comp = competitions[index];
  titleEl.innerText = comp.title;
  images = comp.images.map(url=>({url,votes:0}));
  currentIndex=0;
  userVotes=[];
  feedback.innerText="";
  showImage();
}

// Show image
function showImage() {
  photo.classList.remove("winner");
  if(currentIndex>=images.length){
    endCompetition();
    return;
  }
  photo.style.transform="translate(0,0)";
  photo.src=images[currentIndex].url+"?t="+Date.now();
}

// Vote logic
function vote(){
  voteSound.currentTime=0; voteSound.play();
  images[currentIndex].votes++;
  userVotes.push(currentIndex);

  const currentVotes = images.map(img=>img.votes);
  const maxVotes = Math.max(...currentVotes);

  if(images[currentIndex].votes===maxVotes){
    feedback.innerText="🎯 Great pick!";
  } else {
    feedback.innerText="🔥 Very close — try again!";
    tryAgainSound.play();
  }

  currentIndex++;
  setTimeout(showImage,150);
}

// Skip logic
function skip(){
  swipeSound.currentTime=0; swipeSound.play();
  currentIndex++;
  setTimeout(showImage,100);
}

// End of competition — Type2 confirmed win
function endCompetition(){
  let winnerIndex = images.reduce((a,b,i)=>b.votes>images[a].votes?i:a,0);
  photo.src=images[winnerIndex].url+"?t="+Date.now();
  photo.classList.add("winner");

  if(userVotes.includes(winnerIndex)){
    winSound.play();
    dailyWins++; weeklyWins++; monthlyWins++; yearlyWins++;
    localStorage.setItem("dailyWins",dailyWins);
    localStorage.setItem("weeklyWins",weeklyWins);
    localStorage.setItem("monthlyWins",monthlyWins);
    localStorage.setItem("yearlyWins",yearlyWins);
    feedback.innerText="🏆 You won this challenge!";
  } else {
    tryAgainSound.play();
    feedback.innerText="😅 Almost! Next competition awaits.";
  }
  updateScoreboard();
  setTimeout(()=>{ nextCompetition(); },2000);
}

// Swipe handling
let startX=0, startY=0;
photo.addEventListener("touchstart", e=>{ startX=e.touches[0].clientX; startY=e.touches[0].clientY; });
photo.addEventListener("touchend", e=>{
  let dx=e.changedTouches[0].clientX-startX;
  let dy=e.changedTouches[0].clientY-startY;

  if(Math.abs(dx)>Math.abs(dy)){
    if(dx>60) vote();
    else if(dx<-60) skip();
  } else {
    if(dy<-60) nextCompetition();
    else if(dy>60) prevCompetition();
  }
});

// Next / Previous competition
function nextCompetition(){
  swipeSound.play();
  compIndex=(compIndex+1)%competitions.length;
  loadCompetition(compIndex);
}
function prevCompetition(){
  swipeSound.play();
  compIndex=(compIndex-1+competitions.length)%competitions.length;
  loadCompetition(compIndex);
}

// Buttons
voteBtn.onclick=vote;
skipBtn.onclick=skip;

// Start first competition
loadCompetition(compIndex);
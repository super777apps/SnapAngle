import { db, auth } from "./firebase.js";
import { collection, getDocs, doc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 🔊 Sounds
const voteSound = new Audio("sounds/vote.mp3");
const swipeSound = new Audio("sounds/swipe.mp3");
const winSound = new Audio("sounds/win.mp3");
const tryAgainSound = new Audio("sounds/tryagain.mp3");

// DOM Elements
const photo = document.getElementById("photo");
const titleEl = document.getElementById("competitionTitle");
const voteBtn = document.getElementById("voteBtn");
const skipBtn = document.getElementById("skipBtn");
const scoreboard = document.getElementById("scoreboard");
const feedback = document.getElementById("feedback");

// User stats
let userId;
let dailyWins = 0, weeklyWins = 0, monthlyWins = 0, yearlyWins = 0;

// Current competition state
let competitions = [];
let compIndex = 0;
let images = [];
let currentIndex = 0;
let userVotes = [];

// --- AUTH ---
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
onAuthStateChanged(auth, user => {
  if(user){
    userId = user.uid;
    loadCompetitions();
    loadUserStats();
  } else {
    console.log("Anonymous auth failed");
  }
});

// --- LOAD USER STATS ---
async function loadUserStats(){
  try{
    const userDoc = doc(db,"users",userId);
    await updateDoc(userDoc,{
      dailyWins, weeklyWins, monthlyWins, yearlyWins
    }).catch(()=>{});
    updateScoreboard();
  } catch(e){ console.log("User stats init:", e); }
}

// --- SCOREBOARD UI ---
function updateScoreboard(){
  scoreboard.innerText = `Daily: ${dailyWins} | Weekly: ${weeklyWins} | Monthly: ${monthlyWins} | Yearly: ${yearlyWins}`;
}

// --- LOAD COMPETITIONS ---
async function loadCompetitions(){
  try{
    const q = query(collection(db,"competitions"), where("status","==","active"));
    const snapshot = await getDocs(q);
    competitions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if(competitions.length === 0){
      console.log("No Firebase competitions found, loading local test competitions");
      loadLocalCompetitions();
    } else {
      loadCompetition(0);
    }
  } catch(e){
    console.log("Firebase load failed, using local competitions:", e);
    loadLocalCompetitions();
  }
}

// --- LOCAL TEST COMPETITIONS (Offline Mode) ---
function loadLocalCompetitions(){
  competitions = [
    { title: "🌄 Sunset Angles", images: [
        "https://picsum.photos/id/1015/600/400",
        "https://picsum.photos/id/1016/600/400",
        "https://picsum.photos/id/1018/600/400"
      ]},
    { title: "🏙️ City Perspectives", images: [
        "https://picsum.photos/id/1020/600/400",
        "https://picsum.photos/id/1024/600/400",
        "https://picsum.photos/id/1031/600/400"
      ]},
    { title: "🌿 Nature Close-ups", images: [
        "https://picsum.photos/id/1036/600/400",
        "https://picsum.photos/id/1037/600/400",
        "https://picsum.photos/id/1039/600/400"
      ]}
  ];
  loadCompetition(0);
}

// --- LOAD COMPETITION ---
function loadCompetition(index){
  if(competitions.length===0) return;
  const comp = competitions[index];
  titleEl.innerText = comp.title;
  images = comp.images.map(url => ({ url, votes: 0 }));
  currentIndex = 0;
  userVotes = [];
  feedback.innerText="";
  showImage();
}

// --- SHOW IMAGE ---
function showImage(){
  photo.classList.remove("winner");
  if(currentIndex >= images.length){
    endCompetition();
    return;
  }
  photo.src = images[currentIndex].url+"?t="+Date.now();
}

// --- VOTE LOGIC ---
function vote(){
  voteSound.currentTime = 0; voteSound.play();
  images[currentIndex].votes++;
  userVotes.push(currentIndex);

  const maxVotes = Math.max(...images.map(img=>img.votes));
  if(images[currentIndex].votes === maxVotes){
    feedback.innerText = "🎯 Great pick!";
  } else {
    feedback.innerText = "🔥 Very close — try again!";
    tryAgainSound.play();
  }

  currentIndex++;
  setTimeout(showImage, 150);
}

// --- SKIP ---
function skip(){
  swipeSound.currentTime = 0; swipeSound.play();
  currentIndex++;
  setTimeout(showImage, 100);
}

// --- END COMPETITION ---
async function endCompetition(){
  const winnerIndex = images.reduce((a,b,i)=>b.votes>images[a].votes?i:a,0);
  photo.src = images[winnerIndex].url+"?t="+Date.now();
  photo.classList.add("winner");

  if(userVotes.includes(winnerIndex)){
    winSound.play();
    dailyWins++; weeklyWins++; monthlyWins++; yearlyWins++;

    // Update Firebase if online
    try{
      const userDoc = doc(db,"users",userId);
      await updateDoc(userDoc,{ dailyWins, weeklyWins, monthlyWins, yearlyWins });
    } catch(e){ console.log("Firebase update failed:", e); }

    feedback.innerText = "🏆 You won this challenge!";
  } else {
    tryAgainSound.play();
    feedback.innerText = "😅 Almost! Next competition awaits.";
  }

  updateScoreboard();
  setTimeout(()=>{ nextCompetition(); }, 2000);
}

// --- NEXT / PREV COMPETITION ---
function nextCompetition(){
  swipeSound.play();
  compIndex = (compIndex+1) % competitions.length;
  loadCompetition(compIndex);
}
function prevCompetition(){
  swipeSound.play();
  compIndex = (compIndex-1+competitions.length) % competitions.length;
  loadCompetition(compIndex);
}

// --- BUTTONS ---
voteBtn.onclick = vote;
skipBtn.onclick = skip;

// --- TOUCH SWIPES ---
let startX=0, startY=0;
photo.addEventListener("touchstart", e => { startX=e.touches[0].clientX; startY=e.touches[0].clientY; });
photo.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - startX;
  const dy = e.changedTouches[0].clientY - startY;

  if(Math.abs(dx) > Math.abs(dy)){
    dx>60 ? vote() : dx<-60 ? skip() : null;
  } else {
    dy<-60 ? nextCompetition() : dy>60 ? prevCompetition() : null;
  }
});
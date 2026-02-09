firebase.initializeApp({
  apiKey: "AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain: "snapangle.firebaseapp.com",
  projectId: "snapangle"
});

const auth = firebase.auth();
const db = firebase.firestore();

const photo = document.getElementById("photo");
const dots = document.getElementById("dots");
const wallet = document.getElementById("wallet");
const player = document.getElementById("player");

const loginOverlay = document.getElementById("loginOverlay");
const guestLogin = document.getElementById("guestLogin");
const googleLogin = document.getElementById("googleLogin");

const bestBtn = document.getElementById("bestBtn");
const uploadBtn = document.getElementById("uploadBtn");
const uploadInput = document.getElementById("uploadInput");
const uploadScreen = document.getElementById("uploadScreen");
const selectImages = document.getElementById("selectImages");
const closeUpload = document.getElementById("closeUpload");
const myUploads = document.getElementById("myUploads");

const streakBtn = document.getElementById("streakBtn");
const streakScreen = document.getElementById("streakScreen");
const sendStreak = document.getElementById("sendStreak");
const closeStreak = document.getElementById("closeStreak");

const soundBtn = document.getElementById("soundBtn");

let competitions=[], myComps=[], compIndex=0, angleIndex=0;
let coins=0, diamonds=0;
let userId=null;

const clickSound=new Audio("click.mp3");
const winSound=new Audio("win.mp3");  // for diamond +1
const trySound=new Audio("try.mp3");
const swipeX=new Audio("swipex.mp3");
const swipeY=new Audio("swipey.mp3");
const swipesSound=new Audio("swipes.mp3"); // new swipe left/right sound

let audioReady=false;

/* -------- VOTE LIMIT TRACKER -------- */
let voteTracker = {}; // voteTracker[compIndex] = { count: 0, lastTime: 0 }

soundBtn.onclick=()=>{
  audioReady=true;
  clickSound.play().then(()=>clickSound.pause());
  soundBtn.style.display="none";
};

guestLogin.onclick = async ()=>{
  const r = await auth.signInAnonymously();
  afterLogin(r.user);
};

googleLogin.onclick = async ()=>{
  const provider = new firebase.auth.GoogleAuthProvider();
  const r = await auth.signInWithPopup(provider);
  afterLogin(r.user);
};

async function afterLogin(user){
  userId=user.uid;
  loginOverlay.style.display="none";
  soundBtn.style.display="block";
  player.textContent = user.displayName || "Guest";
  await loadWallet();
  loadCompetitions();
}

async function loadWallet(){
  const ref=db.collection("users").doc(userId);
  const snap=await ref.get();
  if(snap.exists){
    coins=snap.data().coins||0;
    diamonds=snap.data().diamonds||0;
  }
  updateWallet();
}

function updateWallet(){
  wallet.innerHTML=`🟡 ${coins} | 💎 ${diamonds}`;
  db.collection("users").doc(userId).set({coins,diamonds},{merge:true});
}

/* ---------- IMAGE INFO OVERLAY ---------- */
const imageInfo = document.createElement("div");
imageInfo.style.position = "absolute";
imageInfo.style.top = "10px";
imageInfo.style.right = "10px";
imageInfo.style.padding = "6px 10px";
imageInfo.style.borderRadius = "12px";
imageInfo.style.background = "rgba(0,0,0,0.6)";
imageInfo.style.color = "#f5d37a";
imageInfo.style.fontSize = "12px";
imageInfo.style.fontWeight = "700";
imageInfo.style.zIndex = "5";
document.getElementById("imageBox").appendChild(imageInfo);

/* ---------- LOAD COMPETITIONS ---------- */
function loadCompetitions(){
  competitions=[];
  for(let i=0;i<10;i++){
    competitions.push({
      uploader: `User${i+1}`,
      views: 0,
      angleCounts: [0,0,0,0,0],
      images:[
        `https://picsum.photos/seed/${i}1/800/600`,
        `https://picsum.photos/seed/${i}2/800/600`,
        `https://picsum.photos/seed/${i}3/800/600`,
        `https://picsum.photos/seed/${i}4/800/600`,
        `https://picsum.photos/seed/${i}5/800/600`
      ],
      best:Math.floor(Math.random()*5)
    });
  }
  render();
}

/* ---------- RENDER FUNCTION ---------- */
function render(){
  const comp = competitions[compIndex];
  const imgs = comp.images;

  photo.src = imgs[angleIndex];

  dots.innerHTML="";
  imgs.forEach((_,i)=>{
    const d=document.createElement("span");
    d.className="dot"+(i===angleIndex?" active":"");
    dots.appendChild(d);
  });

  comp.views++;
  imageInfo.innerHTML = `
    <div>Uploader: ${comp.uploader}</div>
    <div>Views: ${comp.views}</div>
    <div>Angle selected: ${comp.angleCounts[angleIndex]}</div>
  `;
}

/* ---------- BEST ANGLE (ANTI-SPAM ADDED) ---------- */
bestBtn.onclick=()=>{
  const comp = competitions[compIndex];
  const maxVotes = comp.images.length;

  if(!voteTracker[compIndex]){
    voteTracker[compIndex] = { count: 0, lastTime: 0 };
  }

  const now = Date.now();
  const tracker = voteTracker[compIndex];

  if(tracker.count >= maxVotes){
    if(now - tracker.lastTime < 3600000){
      showMessage("Please vote this competition after 1 hour or vote next competition");
      return;
    } else {
      tracker.count = 0;
    }
  }

  tracker.count++;
  tracker.lastTime = now;

  comp.angleCounts[angleIndex]++;

  if(angleIndex===comp.best){
    coins++;
    audioReady && clickSound.play();
    showMessage("+1 Coin");
    if(coins%10===0){
      diamonds++;
      audioReady && winSound.play(); // NEW: play win sound when diamond +1
      showMessage("💎 Diamond Earned!");
    }
  } else {
    audioReady && trySound.play();
    showMessage("Very close! Try again");
  }

  updateWallet();
  render();
};

/* ---------- UPLOAD ---------- */
uploadBtn.onclick=()=>{
  if(diamonds<1) return alert("Need 1 💎 to upload");
  uploadScreen.style.display="flex";
  renderMyUploads();
};

selectImages.onclick=()=> uploadInput.click();
closeUpload.onclick=()=> uploadScreen.style.display="none";

uploadInput.onchange=(e)=>{
  const files=[...e.target.files];
  if(files.length<5) return alert("Minimum 5 images required");

  diamonds--;

  const comp={
    uploader: player.textContent,
    views:0,
    angleCounts: Array(files.length).fill(0),
    images:files.map(f=>URL.createObjectURL(f)),
    best:Math.floor(Math.random()*files.length)
  };

  competitions.unshift(comp);
  myComps.unshift(comp);

  compIndex=0;
  angleIndex=0;

  updateWallet();
  render();
  renderMyUploads();
};

function renderMyUploads(){
  myUploads.innerHTML="";
  myComps.forEach(c=>{
    const div=document.createElement("div");
    div.className="myItem";
    div.innerHTML=`<img src="${c.images[0]}">`;
    myUploads.appendChild(div);
  });
}

/* ---------- STREAK ---------- */
streakBtn.onclick = () => {
  streakScreen.style.display="flex";
  streakScreen.style.backgroundImage = `url(${photo.src})`;
};

closeStreak.onclick=()=> streakScreen.style.display="none";

sendStreak.onclick=()=>{
  db.collection("users").doc(userId).set({lastStreak:Date.now()},{merge:true});
  showMessage("🔥 Streak Sent!");
  streakScreen.style.display="none";
};

/* ---------- SWIPE ---------- */
let sx=0,sy=0;

document.addEventListener("touchstart",e=>{
  sx=e.touches[0].clientX;
  sy=e.touches[0].clientY;
});

document.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-sx;
  const dy=e.changedTouches[0].clientY-sy;

  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>60){
    const imgs=competitions[compIndex].images;
    angleIndex=(angleIndex+(dx<0?1:-1)+imgs.length)%imgs.length;
    audioReady && swipesSound.play(); // NEW: play swipes.mp3 for left/right
    render();
  }
  else if(Math.abs(dy)>60){
    compIndex=(compIndex+(dy<0?1:-1)+competitions.length)%competitions.length;
    angleIndex=0;
    audioReady && swipeY.play();
    render();
  }
});

/* ---------- MESSAGE ---------- */
function showMessage(txt){
  const box=document.getElementById("msgBox");
  box.textContent=txt;
  box.style.display="block";
  setTimeout(()=>box.style.display="none",1200);
}
/* ---------- FIREBASE ---------- */
firebase.initializeApp({
  apiKey:"AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain:"snapangle.firebaseapp.com",
  projectId:"snapangle"
});

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

/* ---------- AUDIO ---------- */
let audioReady = false;
const swipeX = new Audio("swipex.mp3");
const swipeY = new Audio("swipey.mp3");
const click = new Audio("click.mp3");
const win = new Audio("win.mp3");
const trySound = new Audio("try.mp3");

const soundBtn = document.getElementById("soundBtn");
soundBtn.onclick = ()=>{
  audioReady = true;
  [swipeX,swipeY,click,win,trySound].forEach(a=>a.play().then(()=>a.pause()));
  soundBtn.style.display="none";
};

/* ---------- LOGIN ---------- */
const loginOverlay = document.getElementById("loginOverlay");
const guestLogin = document.getElementById("guestLogin");
const googleLogin = document.getElementById("googleLogin");

let userId = null;

guestLogin.onclick = ()=>{
  auth.signInAnonymously().then(()=>loginOverlay.style.display="none");
};

googleLogin.onclick = ()=>{
  auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
  .then(()=>loginOverlay.style.display="none");
};

auth.onAuthStateChanged(u=>{
  if(!u) return;
  userId = u.uid;
  document.getElementById("player").innerText = u.displayName || "Guest";
});

/* ---------- DEMO COMPETITIONS ---------- */
let coins = 0;
let diamonds = 0;
const photo = document.getElementById("photo");
const dots = document.getElementById("dots");
const wallet = document.getElementById("wallet");

const competitions = [
  { images:[
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
    "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=800",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800"
  ]},
  { images:[
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
    "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800"
  ]}
];

while(competitions.length<10){
  competitions.push(JSON.parse(JSON.stringify(competitions[competitions.length % 2])));
}

competitions.forEach(c=>c.images.forEach(u=>{const i=new Image(); i.src=u;}));

let compIndex=0;
let angleIndex=0;

/* ---------- RENDER ---------- */
function render(){
  const comp = competitions[compIndex];
  if(angleIndex<0) angleIndex = comp.images.length-1;
  if(angleIndex>=comp.images.length) angleIndex =0;

  photo.style.transition="none";
  photo.style.transform="translate(0,0) scale(1)";
  photo.src = comp.images[angleIndex];

  requestAnimationFrame(()=>photo.style.transition="transform .28s cubic-bezier(.25,.8,.25,1)");

  dots.innerHTML="";
  comp.images.forEach((_,i)=>{
    const d = document.createElement("span");
    d.className = "dot"+(i===angleIndex?" active":"");
    dots.appendChild(d);
  });

  wallet.innerText = `🟡 ${coins} | 💎 ${diamonds}`;
}

render();

/* ---------- SWIPE ---------- */
let sx=0, sy=0, dragging=false;

document.addEventListener("touchstart",e=>{
  sx=e.touches[0].clientX;
  sy=e.touches[0].clientY;
  dragging=true;
  photo.style.transition="none";
});

document.addEventListener("touchmove",e=>{
  if(!dragging) return;
  const dx=e.touches[0].clientX-sx;
  const dy=e.touches[0].clientY-sy;

  if(Math.abs(dx)>Math.abs(dy)){
    photo.style.transform=`translateX(${Math.max(-120,Math.min(120,dx))}px)`;
  }else{
    photo.style.transform=`translateY(${Math.max(-120,Math.min(120,dy))}px)`;
  }
});

document.addEventListener("touchend",e=>{
  if(!dragging) return;
  dragging=false;

  const dx=e.changedTouches[0].clientX-sx;
  const dy=e.changedTouches[0].clientY-sy;

  photo.style.transition="transform .25s ease";
  photo.style.transform="translate(0,0)";

  if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>60){
    angleIndex += dx<0?1:-1;
    audioReady && swipeX.play();
    render();
    return;
  }

  if(Math.abs(dy)>60){
    compIndex += dy<0?1:-1;
    if(compIndex<0) compIndex=competitions.length-1;
    if(compIndex>=competitions.length) compIndex=0;
    angleIndex=0;
    audioReady && swipeY.play();
    render();
  }
});

/* ---------- BEST ANGLE ---------- */
document.getElementById("bestBtn").onclick=()=>{
  if(Math.random()>0.6){
    diamonds++;
    audioReady && win.play();
  }else{
    coins++;
    audioReady && (Math.random()>0.5?click.play():trySound.play());
  }
  render();
};

/* ---------- STREAK MODAL ---------- */
const streakBtn = document.getElementById("streakBtn");
const streakModal = document.getElementById("streakModal");
const sendStreak = document.getElementById("sendStreak");
const cancelStreak = document.getElementById("cancelStreak");
const streakMsg = document.getElementById("streakMsg");

streakBtn.onclick = ()=>streakModal.style.display="flex";
cancelStreak.onclick = ()=>streakModal.style.display="none";
sendStreak.onclick = ()=>{
  alert("Streak sent!\nMessage: "+streakMsg.value);
  streakMsg.value="";
  streakModal.style.display="none";
};

/* ---------- UPLOAD MODAL ---------- */
const uploadBtn = document.getElementById("uploadBtn");
const uploadModal = document.getElementById("uploadModal");
const cancelUpload = document.getElementById("cancelUpload");
const confirmUpload = document.getElementById("confirmUpload");
const uploadImages = document.getElementById("uploadImages");
const uploadTitle = document.getElementById("uploadTitle");

uploadBtn.onclick = ()=>{
  if(diamonds<1){ alert("Need at least 1 diamond to upload"); return; }
  uploadModal.style.display="flex";
};

cancelUpload.onclick = ()=>uploadModal.style.display="none";

confirmUpload.onclick = ()=>{
  const files = uploadImages.files;
  if(files.length<5){ alert("Select at least 5 images"); return; }
  diamonds--; // cost
  coins+=0; 
  alert(`Competition uploaded with ${files.length} images\nTitle: ${uploadTitle.value}`);
  uploadTitle.value="";
  uploadImages.value="";
  uploadModal.style.display="none";
  render();
};
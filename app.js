firebase.initializeApp({
  apiKey: "AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain: "snapangle.firebaseapp.com",
  projectId: "snapangle"
});

const auth=firebase.auth();

// ---------- LOGIN ----------
const overlay=document.getElementById("loginOverlay");
const playerEl=document.getElementById("player");

guestLogin.onclick=()=>auth.signInAnonymously();
googleLogin.onclick=()=>auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());

auth.onAuthStateChanged(u=>{
  if(!u) return;
  overlay.style.display="none";
  playerEl.textContent=u.displayName||"Guest";
  initFeed();
});

// ---------- USER ----------
let coins=0, diamonds=0;
const wallet=document.getElementById("wallet");
const updateWallet=()=>wallet.textContent=`🟡 ${coins} | 💎 ${diamonds}`;
updateWallet();

// ---------- SOUND ----------
let audioReady=false;
const swipeX=new Audio("swipex.mp3");
const swipeY=new Audio("swipey.mp3");
const clickS=new Audio("click.mp3");
const winS=new Audio("win.mp3");
const tryS=new Audio("try.mp3");

soundBtn.onclick=()=>{
  audioReady=true;
  swipeX.play().then(()=>swipeX.pause());
  soundBtn.style.display="none";
};

// ---------- FEED ----------
let competitions=[], compIndex=0, angleIndex=0;
const photo=document.getElementById("photo");
const dots=document.getElementById("dots");

function initFeed(){
  for(let i=0;i<10;i++){
    competitions.push({
      best:Math.floor(Math.random()*5),
      images:[
        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
        "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=800",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800"
      ]
    });
  }
  render();
}

function render(){
  const c=competitions[compIndex];
  photo.src=c.images[angleIndex];
  dots.innerHTML="";
  c.images.forEach((_,i)=>{
    const d=document.createElement("span");
    d.className="dot"+(i===angleIndex?" active":"");
    dots.appendChild(d);
  });
}

// ---------- BUTTONS ----------
bestBtn.onclick=()=>{
  const c=competitions[compIndex];
  if(angleIndex===c.best){
    coins++;
    if(coins%10===0){diamonds++; audioReady&&winS.play();}
    else audioReady&&clickS.play();
  }else audioReady&&tryS.play();
  updateWallet();
};

uploadBtn.onclick=()=>{
  if(diamonds<1) return alert("Need 1 💎 to upload");
  uploadModal.classList.remove("hidden");
};

streakBtn.onclick=()=>{
  streakModal.classList.remove("hidden");
};

closeUpload.onclick=()=>uploadModal.classList.add("hidden");
closeStreak.onclick=()=>streakModal.classList.add("hidden");

// ---------- SWIPE ----------
let sx=0, sy=0;
document.addEventListener("touchstart",e=>{
  sx=e.touches[0].clientX;
  sy=e.touches[0].clientY;
});
document.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-sx;
  const dy=e.changedTouches[0].clientY-sy;

  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>60){
    angleIndex=(angleIndex+(dx<0?1:-1)+competitions[compIndex].images.length)%competitions[compIndex].images.length;
    audioReady&&swipeX.play();
    render();
  }else if(Math.abs(dy)>60){
    compIndex=(compIndex+(dy<0?1:-1)+competitions.length)%competitions.length;
    angleIndex=0;
    audioReady&&swipeY.play();
    render();
  }
});
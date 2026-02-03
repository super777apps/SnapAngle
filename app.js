// ---------- FIREBASE ----------
firebase.initializeApp({
  apiKey: "AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain: "snapangle.firebaseapp.com",
  projectId: "snapangle"
});

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const provider = new firebase.auth.GoogleAuthProvider();

let uid, coins=0, diamonds=0;
let feed=[], index=0, autoGuestTimer;

// ---------- AUDIO ----------
let audioReady=false;
const sounds={
  swipeX:new Audio("swipex.mp3"),
  swipeY:new Audio("swipey.mp3"),
  click:new Audio("click.mp3"),
  win:new Audio("win.mp3")
};

function unlockAudio(){
  if(audioReady) return;
  Object.values(sounds).forEach(s=>{
    s.muted=true;
    s.play().then(()=>{s.pause(); s.currentTime=0; s.muted=false;});
  });
  audioReady=true;
}
function play(s){if(!audioReady) return; s.currentTime=0; s.play().catch(()=>{});}
document.addEventListener("touchstart",unlockAudio,{once:true});
document.addEventListener("click",unlockAudio,{once:true});

// ---------- AUTH ----------
auth.onAuthStateChanged(user=>{
  if(!user) return;
  uid=user.uid;
  document.getElementById("player").innerText=user.displayName||"Guest";
  initUser();
  preloadCompetitions();
  loadFeed();
  document.getElementById("overlay").style.display="none";
});

window.onload=()=>{ autoGuestTimer=setTimeout(()=>{ if(!auth.currentUser) auth.signInAnonymously(); },3000); };

document.getElementById("guestBtn").onclick=()=>{ clearTimeout(autoGuestTimer); auth.signInAnonymously(); };
document.getElementById("googleBtn").onclick=()=>{
  clearTimeout(autoGuestTimer);
  const u=auth.currentUser;
  if(u && u.isAnonymous){ u.linkWithPopup(provider).catch(()=>auth.signInWithPopup(provider)); }
  else auth.signInWithPopup(provider);
};

// ---------- USER ----------
function initUser(){
  const ref=db.collection("users").doc(uid);
  ref.get().then(d=>{
    if(!d.exists){ ref.set({coins:0}); coins=0; }
    else coins=d.data().coins||0;
    diamonds=Math.floor(coins/10);
    updateWallet();
  });
}
function updateWallet(){ document.getElementById("wallet").innerText=`🟡 ${coins} | 💎 ${diamonds}`; }

// ---------- PRELOAD DEMO ----------
function preloadCompetitions(){
  db.collection("competitions").get().then(snap=>{
    if(snap.size>=5) return;
    const demoImages=[
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800",
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800",
      "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=800",
      "https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=800",
      "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?w=800"
    ];
    demoImages.forEach(url=>{ db.collection("competitions").add({uid:"demo",imageUrl:url,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); });
  });
}

// ---------- FEED ----------
function loadFeed(){
  db.collection("competitions").orderBy("createdAt","desc").onSnapshot(snap=>{
    feed=[];
    snap.forEach(doc=>{ const d=doc.data(); if(d.imageUrl) feed.push({id:doc.id,...d}); });
    if(feed.length===0) return;
    index=0; render();
  });
}

// ---------- RENDER ----------
function render(){
  if(feed.length===0) return;
  document.getElementById("photo").src=feed[index].imageUrl;

  const dots=document.getElementById("dots");
  dots.innerHTML="";
  feed.forEach((_,i)=>{ const d=document.createElement("span"); d.className="dot"+(i===index?" active":""); dots.appendChild(d); });
}

// ---------- VOTE ----------
document.getElementById("bestBtn").onclick=()=>{
  if(feed.length===0) return;
  play(sounds.click);
  const comp=feed[index];
  coins+=1;
  diamonds=Math.floor(coins/10);
  db.collection("users").doc(uid).set({coins},{merge:true});
  if(comp.uid!=="demo"){ db.collection("users").doc(comp.uid).set({coins:firebase.firestore.FieldValue.increment(1)},{merge:true}); }
  updateWallet();
  next();
};

// ---------- UPLOAD COMPETITION ----------
const fileInput=document.getElementById("fileInput");
document.getElementById("uploadBtn").onclick=()=>{
  if(diamonds<1){ alert("Need at least 1 diamond to upload!"); return; }
  fileInput.click();
};
fileInput.onchange=e=>{
  const file=e.target.files[0];
  if(!file) return;
  play(sounds.click);

  diamonds-=1; coins-=10; updateWallet();
  db.collection("users").doc(uid).set({coins},{merge:true});

  const ref=storage.ref(`competitions/${uid}_${Date.now()}_${file.name}`);
  ref.put(file).then(()=>ref.getDownloadURL()).then(url=>{
    db.collection("competitions").add({
      uid, imageUrl:url, createdAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Competition uploaded!");
  });
};

// ---------- NAV ----------
function next(){ index=(index+1)%feed.length; render(); play(sounds.swipeY); }
function prev(){ index=(index-1+feed.length)%feed.length; render(); play(sounds.swipeY); }

// ---------- SWIPE ----------
let sx=0,sy=0;
document.addEventListener("touchstart",e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; });
document.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-sx;
  const dy=e.changedTouches[0].clientY-sy;
  if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>30){ dx<0?(next(),play(sounds.swipeX)):(prev(),play(sounds.swipeX)); }
  else if(Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>30){ dy<0?(next(),play(sounds.swipeY)):(prev(),play(sounds.swipeY)); }
});
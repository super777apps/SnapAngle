// ---------- FIREBASE ----------
firebase.initializeApp({
  apiKey: "AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain: "snapangle.firebaseapp.com",
  projectId: "snapangle"
});

const auth=firebase.auth(), db=firebase.firestore(), storage=firebase.storage();
const provider=new firebase.auth.GoogleAuthProvider();

let uid, coins=0, diamonds=0;
let feed=[], index=0, autoGuestTimer;
let audioReady=false;

const sounds={
  swipeX:new Audio("swipex.mp3"),
  swipeY:new Audio("swipey.mp3"),
  click:new Audio("click.mp3"),
  win:new Audio("win.mp3")
};

// ---------- SOUND TOGGLE ----------
const soundBtn=document.getElementById("soundBtn");
soundBtn.onclick=()=>{
  audioReady=true; soundBtn.style.display="none";
  Object.values(sounds).forEach(s=>s.play().then(()=>{s.pause(); s.currentTime=0;}));
};
function play(s){if(audioReady) s.currentTime=0; s.play().catch(()=>{});}

// ---------- AUTH ----------
auth.onAuthStateChanged(user=>{
  if(!user) return;
  uid=user.uid;
  document.getElementById("player").innerText=user.displayName||"Guest";
  initUser(); preloadCompetitions(); loadFeed();
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
function updateWallet(){
  document.getElementById("wallet").innerText=`🟡 ${coins} | 💎 ${diamonds}`;
}

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
    feed=[]; snap.forEach(doc=>{ const d=doc.data(); if(d.imageUrl) feed.push({id:doc.id,...d}); });
    if(feed.length===0) return;
    index=0; render();
  });
}

// ---------- RENDER ----------
function render(direction="right"){
  if(feed.length===0) return;
  const photo=document.getElementById("photo");
  photo.style.transition="none";
  photo.style.transform=direction==="left"?"translateX(-100%)":direction==="right"?"translateX(100%)":"translateY(100%)";
  photo.style.opacity=0;
  setTimeout(()=>{
    photo.src=feed[index].imageUrl;
    photo.style.transition="transform 0.4s ease, opacity 0.4s ease";
    photo.style.transform="translateX(0)";
    photo.style.opacity=1;
  },10);

  const dots=document.getElementById("dots"); dots.innerHTML="";
  feed.forEach((_,i)=>{ const d=document.createElement("span"); d.className="dot"+(i===index?" active":""); dots.appendChild(d); });
}

// ---------- MESSAGE ----------
function showMessage(text,color="#f5d37a",duration=1200){ 
  const msg=document.getElementById("message");
  msg.innerText=text; msg.style.background=color; msg.style.display="block";
  setTimeout(()=>{msg.style.display="none";},duration);
}

// ---------- PARTICLES ----------
function spawnParticle(type="coin",count=10){
  const wallet=document.getElementById("wallet");
  const rect=wallet.getBoundingClientRect();
  for(let i=0;i<count;i++){
    const p=document.createElement("div");
    p.className="particle";
    p.style.background=type==="coin"?"#FFD700":"#00FFFF";
    p.style.left=(rect.left+rect.width/2+Math.random()*20-10)+"px";
    p.style.top=(rect.top+5)+"px";
    document.body.appendChild(p);
    setTimeout(()=>{p.remove();},1000);
  }
}

// ---------- VOTE ----------
document.getElementById("bestBtn").onclick=()=>{
  if(feed.length===0) return;
  if(audioReady) sounds.click.play();
  const comp=feed[index];
  const won=Math.random()<0.6;
  if(won){
    coins+=1; let newDiamonds=Math.floor(coins/10);
    if(newDiamonds>diamonds){ spawnParticle("diamond",5); diamonds=newDiamonds; }
    db.collection("users").doc(uid).set({coins},{merge:true});
    updateWallet(); flashBorder("#FFD700"); showMessage("You Win!", "#FFD700");
    if(audioReady) sounds.win.play(); spawnParticle("coin",5);
  } else flashBorder("#FF5555"), showMessage("Very close! Try again", "#FF5555");
  next();
};

// ---------- UPLOAD ----------
const fileInput=document.getElementById("fileInput");
document.getElementById("uploadBtn").onclick=()=>{
  if(diamonds<1){ alert("Need 1 diamond to upload"); return; }
  fileInput.click();
};
fileInput.onchange=e=>{
  const file=e.target.files[0]; if(!file) return;
  if(audioReady) sounds.click.play();
  diamonds-=1; coins-=10; updateWallet(); flashBorder("#00FFFF"); showMessage("Diamond used for upload!", "#00FFFF"); spawnParticle("diamond",5);

  const ref=storage.ref(`competitions/${uid}_${Date.now()}_${file.name}`);
  ref.put(file).then(()=>ref.getDownloadURL()).then(url=>{
    db.collection("competitions").add({uid,imageUrl:url,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
  });
};

// ---------- NAV ----------
function next(dir="right"){ index=(index+1)%feed.length; render(dir); if(audioReady) sounds.swipeY.play(); }
function prev(dir="left"){ index=(index-1+feed.length)%feed.length; render(dir); if(audioReady) sounds.swipeY.play(); }

// ---------- SWIPE ----------
let sx=0,sy=0;
document.addEventListener("touchstart",e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; });
document.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-sx;
  const dy=e.changedTouches[0].clientY-sy;
  if(Math.abs(dx)>Math.abs(dy) && Math.abs(dx)>30){
    dx<0 ? next("left") : prev("right"); if(audioReady) sounds.swipeX.play();
  } else if(Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>30){
    dy<0 ? next("up") : prev("down"); if(audioReady) sounds.swipeY.play();
  }
});

// ---------- VISUAL FEEDBACK ----------
function flashBorder(color="#FFD700"){
  const photo=document.getElementById("photo");
  photo.style.border=`4px solid ${color}`;
  setTimeout(()=>{photo.style.border="none";},400);
}
firebase.initializeApp({
  apiKey: "AIzaSyC94z-nORMy9glnVPE_HXft65q4Et3gyCg",
  authDomain: "snapangle.firebaseapp.com",
  projectId: "snapangle"
});

const auth=firebase.auth();
const db=firebase.firestore();

/* UI */
const photo=document.getElementById("photo");
const dots=document.getElementById("dots");
const wallet=document.getElementById("wallet");
const player=document.getElementById("player");
const loginOverlay=document.getElementById("loginOverlay");
const guestLogin=document.getElementById("guestLogin");
const googleLogin=document.getElementById("googleLogin");
const bestBtn=document.getElementById("bestBtn");
const uploadBtn=document.getElementById("uploadBtn");
const uploadInput=document.getElementById("uploadInput");
const streakBtn=document.getElementById("streakBtn");
const capsuleBtn=document.getElementById("capsuleBtn");
const streakScreen=document.getElementById("streakScreen");
const capsuleScreen=document.getElementById("capsuleScreen");
const sendStreak=document.getElementById("sendStreak");
const closeStreak=document.getElementById("closeStreak");
const closeCapsule=document.getElementById("closeCapsule");
const saveCapsule=document.getElementById("saveCapsule");
const friendSelect=document.getElementById("friendSelect");
const streakMsg=document.getElementById("streakMsg");
const lockPreset=document.getElementById("lockPreset");
const customTime=document.getElementById("customTime");
const myStreaks=document.getElementById("myStreaks");
const capsuleMsg=document.getElementById("capsuleMsg");
const capsuleTime=document.getElementById("capsuleTime");
const capsuleList=document.getElementById("capsuleList");
const soundBtn=document.getElementById("soundBtn");
const imageInfo=document.getElementById("imageInfo");

/* AUDIO */
const clickSound=new Audio("click.mp3");
const winSound=new Audio("win.mp3");
const trySound=new Audio("try.mp3");
const swipeX=new Audio("swipeX.mp3");
const swipeY=new Audio("swipeY.mp3");

let audioReady=false;

/* STATE */
let competitions=[],compIndex=0,angleIndex=0;
let coins=0,diamonds=0;
let userId=null;
let voteTracker={};

/* SOUND ENABLE */
soundBtn.onclick=()=>{
  audioReady=true;
  [clickSound,winSound,trySound,swipeX,swipeY].forEach(a=>{
    a.play().then(()=>a.pause()).catch(()=>{});
    a.currentTime=0;
  });
  soundBtn.style.display="none";
  showMessage("🔊 Sound Enabled");
};

/* LOGIN */
guestLogin.onclick=async()=>{
  const r=await auth.signInAnonymously();
  afterLogin(r.user);
};

googleLogin.onclick=async()=>{
  const provider=new firebase.auth.GoogleAuthProvider();
  const r=await auth.signInWithPopup(provider);
  afterLogin(r.user);
};

async function afterLogin(user){

  userId = user.uid;

  const username = user.displayName || "Guest-" + user.uid.slice(0,5);

  console.log("LOGIN:", userId, username);

  // FORCE USER CREATE
  await db.collection("users").doc(userId).set({
    name: username,
    createdAt: Date.now(),
    coins: 0,
    diamonds: 0
  }, { merge:true });

  loginOverlay.style.display="none";
  soundBtn.style.display="block";
  player.textContent = username;

  await loadWallet();
  await loadCompetitions();

  // FORCE refresh friends
  setTimeout(loadFriends, 1000);

  await loadMyStreaks();
  await loadCapsules();
}

/* WALLET */
async function loadWallet(){
  const snap=await db.collection("users").doc(userId).get();
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

/* LOAD COMPETITIONS */
async function loadCompetitions(){
  const snap=await db.collection("competitions").orderBy("createdAt","desc").get();
  competitions=snap.docs.map(d=>{
    const data=d.data(); data.id=d.id;
    data.angleCounts=data.angleCounts||Array(data.images.length).fill(0);
    data.views=data.views||Array(data.images.length).fill(0);
    return data;
  });
  if(competitions.length) render();
}

/* RENDER */
function render(){
  const comp=competitions[compIndex];
  if(!comp) return;
  photo.src=comp.images[angleIndex];

  dots.innerHTML="";
  comp.images.forEach((_,i)=>{
    const d=document.createElement("span");
    d.className="dot"+(i===angleIndex?" active":"");
    dots.appendChild(d);
  });

  comp.views[angleIndex]++;
  db.collection("competitions").doc(comp.id).set({views:comp.views},{merge:true});

  imageInfo.innerHTML=`Uploader: ${comp.uploader} | Views: ${comp.views[angleIndex]} | Votes: ${comp.angleCounts[angleIndex]}`;
}

/* BEST ANGLE */
bestBtn.onclick=async()=>{
  const comp=competitions[compIndex];
  voteTracker[comp.id]=voteTracker[comp.id]||{};
  voteTracker[comp.id][angleIndex]=voteTracker[comp.id][angleIndex]||0;

  if(voteTracker[comp.id][angleIndex]>=3){
    showMessage("Max votes for this angle!");
    return;
  }

  voteTracker[comp.id][angleIndex]++;
  comp.angleCounts[angleIndex]++;

  await db.collection("competitions").doc(comp.id).set({angleCounts:comp.angleCounts},{merge:true});

  if(angleIndex===comp.best){
    coins++;
    audioReady && clickSound.play();
    showMessage("+1 Coin");

    if(coins%10===0){
      diamonds++;
      audioReady && winSound.play();
      showMessage("💎 Diamond +1!");
    }

    photo.classList.add("blink-border");
    setTimeout(()=>photo.classList.remove("blink-border"),1000);
  }else{
    audioReady && trySound.play();
    showMessage("Try again!");
  }

  updateWallet();
  render();
};

/* UPLOAD */
uploadBtn.onclick = () => {
  if (diamonds < 1) {
    showMessage("💎 You need at least 1 diamond to upload!");
    return;
  }
  // Deduct 1 diamond
  diamonds--;
  updateWallet();

  uploadInput.click();
};

uploadInput.onchange=async(e)=>{
  const files=[...e.target.files];
  if(files.length<5) return alert("Minimum 5 images");

  diamonds--;
  updateWallet();

  const urls=[];
  for(const f of files){
    const form=new FormData();
    form.append("image",f);

    const r=await fetch("https://api.imgbb.com/1/upload?key=b4819632e11830bbb489b928a4745d75",{method:"POST",body:form});
    const j=await r.json();
    urls.push(j.data.url);
  }

  const comp={
    uploader:player.textContent,
    images:urls,
    angleCounts:Array(urls.length).fill(0),
    views:Array(urls.length).fill(0),
    best:Math.floor(Math.random()*urls.length),
    createdAt:Date.now()
  };

  const docRef=await db.collection("competitions").add(comp);
  comp.id=docRef.id;

  competitions.unshift(comp);
  compIndex=0;
  angleIndex=0;
  render();
};

/* SWIPES */
let sx=0,sy=0;

document.addEventListener("touchstart",e=>{
  sx=e.touches[0].clientX;
  sy=e.touches[0].clientY;
});

document.addEventListener("touchend",e=>{
  const dx=e.changedTouches[0].clientX-sx;
  const dy=e.changedTouches[0].clientY-sy;

  const comp=competitions[compIndex];
  if(!comp) return;

  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>60){
    angleIndex=(angleIndex+(dx<0?1:-1)+comp.images.length)%comp.images.length;
    audioReady && swipeX.play();
    render();
  } else if(Math.abs(dy)>60){
    compIndex=(compIndex+(dy<0?1:-1)+competitions.length)%competitions.length;
    angleIndex=0;
    audioReady && swipeY.play();
    render();
  }
});

/* STREAKS */
streakBtn.onclick=()=>streakScreen.style.display="flex";
closeStreak.onclick=()=>streakScreen.style.display="none";

lockPreset.onchange=()=>{
  customTime.style.display = lockPreset.value==="custom"?"block":"none";
};

sendStreak.onclick=async()=>{
  const to=friendSelect.value;
  const msg=streakMsg.value.trim();
  if(!to||!msg) return alert("Select user & write message");

  let unlockAt = lockPreset.value==="custom"
    ? new Date(customTime.value).getTime()
    : Date.now()+Number(lockPreset.value);

  await db.collection("streaks").add({
    from:userId,
    to,
    message:msg,
    unlockAt,
    createdAt:Date.now()
  });

  streakMsg.value="";
  showMessage("🔒 Message Sent!");
  loadMyStreaks();
};

async function loadFriends(){

  console.log("Loading users...");

  const snap = await db.collection("users").get();

  friendSelect.innerHTML = "";

  if(snap.empty){
    console.log("NO USERS FOUND");
    const o = document.createElement("option");
    o.textContent = "No users found";
    friendSelect.appendChild(o);
    return;
  }

  snap.forEach(d=>{
    if(d.id !== userId){
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = d.data().name || ("Guest-"+d.id.slice(0,5));
      friendSelect.appendChild(o);
    }
  });

  console.log("Users loaded:", friendSelect.children.length);
}

async function loadMyStreaks(){
  const snap=await db.collection("streaks").where("to","==",userId).get();
  myStreaks.innerHTML="";
  snap.forEach(d=>{
    const s=d.data();
    const div=document.createElement("div");
    div.style.marginTop="8px";
    div.textContent = Date.now()<s.unlockAt
      ? `🔒 Unlocks in ${Math.ceil((s.unlockAt-Date.now())/60000)} min`
      : `📩 ${s.message}`;
    myStreaks.appendChild(div);
  });
}

/* CAPSULE */
capsuleBtn.onclick=()=>capsuleScreen.style.display="flex";
closeCapsule.onclick=()=>capsuleScreen.style.display="none";

saveCapsule.onclick=async()=>{
  if(!capsuleMsg.value||!capsuleTime.value) return alert("Fill all");

  const unlock=new Date(capsuleTime.value).getTime();

  await db.collection("capsules").add({
    uid:userId,
    message:capsuleMsg.value,
    unlockAt:unlock,
    createdAt:Date.now()
  });

  capsuleMsg.value="";
  showMessage("📦 Capsule Saved!");
  loadCapsules();
};

async function loadCapsules(){
  const snap=await db.collection("capsules").where("uid","==",userId).get();
  capsuleList.innerHTML="";
  snap.forEach(d=>{
    const c=d.data();
    const div=document.createElement("div");
    div.style.marginTop="8px";
    div.textContent = Date.now()<c.unlockAt
      ? `🔒 Unlocks ${new Date(c.unlockAt).toLocaleString()}`
      : `📦 ${c.message}`;
    capsuleList.appendChild(div);
  });
}

/* POP MESSAGE */
function showMessage(txt){
  const box=document.getElementById("msgBox");
  box.textContent=txt;
  box.style.display="block";
  setTimeout(()=>box.style.display="none",1400);
}
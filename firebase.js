// 🔥 Firebase configuration
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID"
});

// 🔐 Auth & DB
const auth = firebase.auth();
const db = firebase.firestore();

// 👤 Anonymous login
auth.signInAnonymously()
  .then(cred => {
    window.currentUserId = cred.user.uid;
    initUser(cred.user.uid);
  })
  .catch(err => {
    console.error("Auth error", err);
  });

// 🧠 Create user if not exists
function initUser(uid) {
  const ref = db.collection("users").doc(uid);

  ref.get().then(doc => {
    if (!doc.exists) {
      ref.set({
        username: "Player" + Math.floor(1000 + Math.random() * 9000),
        totalWins: 0,
        dailyWins: 0,
        weeklyWins: 0,
        monthlyWins: 0,
        lastWinDate: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  });
}
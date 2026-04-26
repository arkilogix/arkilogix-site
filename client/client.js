import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user)=>{
  console.log("🔥 AUTH STATE CHANGE");
  console.log("EMAIL:", user?.email);
  console.log("UID:", user?.uid);
});

const firebaseConfig = {
  apiKey: "AIzaSyCUw-qxeRg8YaihNcJPmJDHL2z6zBE6PK4",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentData = {};
let currentDocId = "";
let isLocked = true;
let currentUserEmail = "";
let unsubscribe = null;

/* AUTH */
onAuthStateChanged(auth, async (user)=>{
  if(!user){
    window.location.href="/auth/login.html";
    return;
  }

  currentUserEmail = user.email;

  try{
    const q = query(
      collection(db, "clients"),
      where("authUid", "==", user.uid)
    );

    const snap = await getDocs(q);

    console.log("EMAIL:", user.email);
    console.log("UID:", user.uid);

    if(!snap.empty){
      currentData = snap.docs[0].data();
      currentDocId = snap.docs[0].id;

      const locked = checkAccess();
      if(!locked){
        render();
      }
    } else {
      console.error("❌ No client linked to UID:", user.uid);
    }

  } catch(err){
    console.error("🔥 FIRESTORE ERROR:", err);
  }
});

/* ACCESS CONTROL */
function checkAccess(){

  const status = (currentData.status || "").toLowerCase();
  const adminLock = currentData.isLocked === true;

  if(adminLock){
    showLocked("🔒 Account Locked", "Please contact support.");
    return true;
  }

  const lockStates = [
    "pending",
    "pending_verification",
    "processing",
    "unpaid"
  ];

 if(lockStates.includes(status)){
  showLocked(
    "Verifying Your Payment",
    "Please wait while we activate your NFC card."
  );
  return true; 
}
  hideLock(); 
  return false; 
}

function showLocked(title, message){

  let overlay = document.getElementById("lockOverlay");

  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "lockOverlay";
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="lock-screen">
      
      <div class="lock-card">

        <div class="lock-logo">ARKILOGIX</div>

        <div class="lock-title">${title}</div>
        <div class="lock-message">${message}</div>

        <div class="lock-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>

    </div>
  `;

  overlay.style.display = "block"; // ✅ ensure visible
  overlay.classList.remove("unlocking");
}

function hideLock(){

  const overlay = document.getElementById("lockOverlay");
  if(!overlay) return;

  // add fade-out class
  overlay.classList.add("unlocking");

  setTimeout(()=>{
    overlay.remove();
  }, 400); // matches CSS animation
}

/* RENDER */
function render(){
  if(!document.getElementById("heroProfile")) return;

  const img = currentData.profile || "/logo.png";

  const hero = document.getElementById("heroProfile");
  if(hero) hero.src = img;

  const headerImg = document.getElementById("headerProfile");
  if(headerImg) headerImg.src = img;

  const nameEl = document.getElementById("cardName");
  if(nameEl) nameEl.innerText = currentData.name || "Your Name";

  const posEl = document.getElementById("cardPosition");
  if(posEl) posEl.innerText = currentData.position || "Your Position";

  // STATS SAFE
  const viewsEl = document.getElementById("views");
  const tapsEl = document.getElementById("taps");
  const clicksEl = document.getElementById("clicks");

  animateNumberSafe(viewsEl, currentData?.stats?.views || 0);
  animateNumberSafe(tapsEl, currentData?.stats?.taps || 0);
  animateNumberSafe(clicksEl, currentData?.stats?.clicks || 0);

  // STATUS
  const status = (currentData.status || "").toLowerCase();
  const chip = document.getElementById("statusChip");

  if(chip){
    chip.className = "status";
    chip.innerText = "";

    if(status === "paid"){
      chip.innerText = "Verified";
      chip.classList.add("verified");
    }

    if(status === "processing" || status === "pending"){
      chip.innerText = "Processing";
      chip.classList.add("processing");
    }
  }

  // PLAN
  const planEl = document.getElementById("planBadge");

  if(planEl){
    const plan = (currentData.plan || "basic").toLowerCase();

    let label = "Basic Plan";
    let planClass = "plan-basic";

    if(plan === "pro"){
      label = "Pro Plan";
      planClass = "plan-pro";
    }

    if(plan === "elite"){
      label = "Elite Plan";
      planClass = "plan-elite";
    }

    let statusText = "";
    if(currentData.status === "paid"){
      statusText = "Verified · ";
    }

    planEl.innerText = statusText + label;
    planEl.className = "plan-badge " + planClass;
  }

  // SERVICES
  const container = document.getElementById("cardServices");
  if(container){
    container.innerHTML = "";

    if(currentData.services){
      currentData.services.slice(0,3).forEach(s=>{
        const span = document.createElement("span");
        span.innerText = s;
        container.appendChild(span);
      });
    }
  }
}

function animateNumberSafe(el, value){
  if(!el) return;

  let start = 0;
  const duration = 400;
  const step = value / (duration / 16);

  const interval = setInterval(()=>{
    start += step;

    if(start >= value){
      el.innerText = value;
      clearInterval(interval);
    } else {
      el.innerText = Math.floor(start);
    }
  },16);
}
/* VIEW CARD */
window.viewCard = function(){
  let page = "basic.html";
  if(currentData.plan==="pro") page="pro.html";
  if(currentData.plan==="elite") page="elite.html";

  window.open(`/view/${page}?id=${auth.currentUser.uid}`);
}

/* SHARE */
window.shareCard = function(){
  let page = "basic.html";
  if(currentData.plan==="pro") page="pro.html";
  if(currentData.plan==="elite") page="elite.html";

  const url = `${window.location.origin}/view/${page}?id=${currentDocId}`;

  if(navigator.share){
    navigator.share({title:"My Card",url});
  }else{
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  }
}

/* PASSWORD RESET */
window.resetPassword = function(){
  if(!currentUserEmail){
    alert("No email found.");
    return;
  }

  sendPasswordResetEmail(auth, currentUserEmail)
    .then(()=>{
      alert("Password reset email sent.");
    })
    .catch(()=>{
      alert("Error sending email.");
    });
}


/* UPGRADE */
window.upgradeToPro = function(){
  const subject = "Upgrade to Pro Request";
  const body = `Name: ${currentData.name}\nPlan: ${currentData.plan}`;

  window.location.href = `mailto:info@arkilogix.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* LOGOUT */
window.logout = function(){
  signOut(auth).then(()=>{
    window.location.href="/auth/login.html";
  });
}

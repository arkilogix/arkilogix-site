import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ELEMENTS */
const userName = document.getElementById("userName");
const planBadge = document.getElementById("planBadge");

const cardName = document.getElementById("cardName");
const cardPosition = document.getElementById("cardPosition");
const cardServices = document.getElementById("cardServices");

const viewsEl = document.getElementById("views");
const tapsEl = document.getElementById("taps");
const clicksEl = document.getElementById("clicks");

const upgradeBtn = document.getElementById("upgradeBtn");

/* AUTH */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }

  const docSnap = await getDoc(doc(db, "clients", user.uid));

  if (!docSnap.exists()) return;

  const data = docSnap.data();

  /* DISPLAY */
  userName.textContent = data.name || "User";
  planBadge.textContent = (data.plan || "basic").toUpperCase();

  cardName.textContent = data.name;
  cardPosition.textContent = data.position;

  cardServices.innerHTML = "";
  (data.services || []).forEach(s => {
    const div = document.createElement("div");
    div.textContent = s;
    cardServices.appendChild(div);
  });

  /* STATS */
  const stats = data.stats || {};

  viewsEl.textContent = stats.views || 0;
  tapsEl.textContent = stats.taps || 0;
  clicksEl.textContent = stats.clicks || 0;

  applyPlan(data.plan || "basic");
});

/* PLAN CONTROL */
function applyPlan(plan){

  const analyticsCards = document.querySelectorAll(".stat");

  if(plan === "basic"){
    analyticsCards.forEach(c => lock(c));
  }

  if(plan === "pro" || plan === "elite"){
    analyticsCards.forEach(c => unlock(c));
  }

  if(plan === "elite"){
    upgradeBtn.style.display = "none";
  }
}

/* LOCK */
function lock(el){
  el.classList.add("locked");
  el.onclick = () => window.location.href = "/upgrade.html";
}

/* UNLOCK */
function unlock(el){
  el.classList.remove("locked");
  el.onclick = null;
}

/* LOGOUT */
document.querySelector(".logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/auth/login.html";
  });
});

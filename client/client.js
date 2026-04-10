/* ================= FIREBASE ================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  updateDoc,
  doc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* ================= CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* ================= STATE ================= */
let currentData = {};
let currentDocId = "";
let step = 1;
let isSaving = false;
let isLocked = true;
let wasLocked = null;

/* ================= AUTH (FIXED NO LOOP) ================= */

let authReady = false;

onAuthStateChanged(auth, async (user) => {

  if (!authReady) {
    authReady = true;

    if (!user) {
      console.log("No user → redirecting to login");
      window.location.replace("/auth/login.html");
      return;
    }

    console.log("User logged in:", user.uid);

    /* 🔥 LOAD USER DATA AFTER AUTH */
    try {
      const q = query(
        collection(db, "clients"),
        where("authUid", "==", user.uid)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        const docSnap = snap.docs[0];
        currentData = docSnap.data();
        currentDocId = docSnap.id;

        render();
        checkAccess();
      } else {
        console.warn("No client record found");
      }

    } catch (err) {
      console.error("Data load error:", err);
    }
  }

});

/* ================= ACCESS CONTROL ================= */

function checkAccess(){
  const status = currentData.status || "processing";
  const nowUnlocked = (status === "paid" || status === "completed");

  if(wasLocked === null){
    wasLocked = !nowUnlocked;
  }

  if(nowUnlocked){
    isLocked = false;
    deactivateLockScreen();
    wasLocked = false;
  } else {
    isLocked = true;
    activateLockScreen();
    wasLocked = true;
  }
}

function activateLockScreen(){
  const lock = document.getElementById("lockScreen");
  if(lock) lock.style.display = "flex";
}

function deactivateLockScreen(){
  const lock = document.getElementById("lockScreen");
  if(lock) lock.style.display = "none";
}

/* ================= RENDER ================= */

function render(){
  document.getElementById("userName").innerText = currentData.name || "User";
  document.getElementById("planBadge").innerText = (currentData.plan || "basic").toUpperCase();

  const img = currentData.profile || "/logo.png";
  document.getElementById("headerProfile").src = img;
  document.getElementById("heroProfile").src = img;

  document.getElementById("cardName").innerText = currentData.name || "Name";
  document.getElementById("cardPosition").innerText = currentData.position || "Position";

  const servicesContainer = document.getElementById("cardServices");
  servicesContainer.innerHTML = "";

  (currentData.services || []).forEach(s=>{
    const span = document.createElement("span");
    span.innerText = s;
    servicesContainer.appendChild(span);
  });

  document.getElementById("statusText").innerText =
    "Status: " + (currentData.status || "processing");
}

/* ================= GUARD ================= */

function guard(){
  if(isLocked){
    alert("Your account is still under review.");
    return true;
  }
  return false;
}

/* ================= VIEW ================= */

window.viewCard = ()=>{
  if(guard()) return;

  let page = "basic.html";
  if(currentData.plan === "pro") page = "pro.html";
  if(currentData.plan === "elite") page = "elite.html";

  window.open(`/view/${page}?id=${currentDocId}`);
};

/* ================= MODAL ================= */

window.openModal = ()=>{
  if(guard()) return;

  document.getElementById("editModal").style.display = "flex";

  document.getElementById("editName").value = currentData.name || "";
  document.getElementById("editPosition").value = currentData.position || "";

  document.getElementById("contactPhone").value = currentData.phone || "";
  document.getElementById("contactEmail").value = currentData.email || "";
  document.getElementById("contactFacebook").value = currentData.facebook || "";
  document.getElementById("contactInstagram").value = currentData.instagram || "";

  document.getElementById("website").value = currentData.website || "";

  const servicesBox = document.getElementById("servicesEdit");
  servicesBox.innerHTML = "";

  (currentData.services || []).forEach(s=>{
    const input = document.createElement("input");
    input.value = s;
    servicesBox.appendChild(input);
  });

  step = 1;
  updateSteps();
};

/* ================= STEP ================= */

function updateSteps(){
  document.querySelectorAll(".step").forEach(s=>s.classList.remove("active"));
  document.querySelector(`[data-step="${step}"]`).classList.add("active");
}

window.nextStep = async ()=>{
  if(step < 5){
    step++;
    updateSteps();
  } else {
    await saveProfile();
  }
};

window.prevStep = ()=>{
  if(step > 1){
    step--;
    updateSteps();
  }
};

/* ================= SAVE ================= */

async function saveProfile(){

  if(guard()) return;
  if(isSaving) return;

  isSaving = true;

  try{

    const name = document.getElementById("editName").value.trim();
    if(name) currentData.name = name;

    const position = document.getElementById("editPosition").value.trim();
    if(position) currentData.position = position;

    const phone = document.getElementById("contactPhone").value.trim();
    if(phone) currentData.phone = phone;

    const email = document.getElementById("contactEmail").value.trim();
    if(email) currentData.email = email;

    await updateDoc(doc(db,"clients",currentDocId), currentData);

    render();
    document.getElementById("editModal").style.display = "none";

  }catch(err){
    console.error(err);
    alert("Save failed");
  }

  isSaving = false;
}

/* ================= LOGOUT ================= */

document.querySelector(".logout").onclick = ()=>{
  signOut(auth).then(()=>{
    window.location.replace("/auth/login.html");
  });
};

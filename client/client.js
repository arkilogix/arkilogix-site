import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  updateDoc,
  doc,
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* STATE */
let currentData = {};
let currentDocId = "";
let step = 1;
let isSaving = false;
let isLocked = true;

/* AUTH */
let authChecked = false;

onAuthStateChanged(auth, (user)=>{

  if(!authChecked){
    authChecked = true;

    if(!user){
      setTimeout(()=>{
        if(!auth.currentUser){
          window.location.replace("/auth/login.html");
        }
      },500);
      return;
    }
  }

  if(!user){
    window.location.replace("/auth/login.html");
    return;
  }

  /* 🔥 REAL-TIME LISTENER */
  const q = query(
    collection(db, "clients"),
    where("authUid", "==", user.uid)
  );

  onSnapshot(q, (snapshot)=>{

    if(snapshot.empty){
      console.log("No client doc");
      activateLockScreen();
      return;
    }

    const docSnap = snapshot.docs[0];

    currentDocId = docSnap.id;
    currentData = docSnap.data();

    checkAccess();   // 🔥 LIVE LOCK/UNLOCK
    render();

  });
});

function showUnlockAnimation(){

  const unlock = document.getElementById("unlockScreen");
  if(!unlock) return;

  unlock.style.display = "flex";
  unlock.style.opacity = "0";

  setTimeout(()=>{
    unlock.style.opacity = "1";
  },50);

  setTimeout(()=>{
    unlock.style.opacity = "0";

    setTimeout(()=>{
      unlock.style.display = "none";
    },400);

  },1800);
}
/* ================= ACCESS CONTROL ================= */

let wasLocked = true;

function checkAccess(){
  const status = currentData.status || "processing";

  const nowUnlocked = (status === "paid" || status === "completed");

  if(nowUnlocked){

    if(wasLocked){
      showUnlockAnimation(); // 🔥 ONLY trigger once
    }

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
  disableDashboard();
}

function deactivateLockScreen(){
  const lock = document.getElementById("lockScreen");
  if(lock) lock.style.display = "none";
  enableDashboard();
}

function disableDashboard(){
  document.querySelectorAll("button, .btn, .sub-actions span").forEach(el=>{
    el.style.pointerEvents = "none";
    el.style.opacity = "0.5";
  });
}

function enableDashboard(){
  document.querySelectorAll("button, .btn, .sub-actions span").forEach(el=>{
    el.style.pointerEvents = "auto";
    el.style.opacity = "1";
  });
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

/* ================= SAFE ACTION GUARD ================= */

function guard(){
  if(isLocked){
    alert("Your account is still under review.");
    return true;
  }
  return false;
}

/* VIEW CARD */
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

  if(currentData.services?.length){
    currentData.services.forEach(s=>{
      const input = document.createElement("input");
      input.value = s;
      servicesBox.appendChild(input);
    });
  } else {
    servicesBox.appendChild(document.createElement("input"));
  }

  step = 1;
  updateSteps();
};

/* STEP CONTROL */
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

/* ================= CLOUDINARY ================= */

async function uploadImage(file){
  if(!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "arkilogix_profile");

  const res = await fetch("https://api.cloudinary.com/v1_1/dnlzwtkhs/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

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

    const fb = document.getElementById("contactFacebook").value.trim();
    if(fb) currentData.facebook = fb;

    const ig = document.getElementById("contactInstagram").value.trim();
    if(ig) currentData.instagram = ig;

    const website = document.getElementById("website").value.trim();
    if(website) currentData.website = website;

    const serviceInputs = document.querySelectorAll("#servicesEdit input");
    const newServices = [];

    serviceInputs.forEach(input=>{
      if(input.value.trim()){
        newServices.push(input.value.trim());
      }
    });

    if(newServices.length){
      currentData.services = newServices;
    }

    const profileFile = document.getElementById("imageInput").files[0];
    if(profileFile){
      const url = await uploadImage(profileFile);
      if(url) currentData.profile = url;
    }

    await updateDoc(doc(db,"clients",currentDocId), currentData);

    render();
    document.getElementById("editModal").style.display = "none";

  }catch(err){
    console.error(err);
    alert("Save failed");
  }

  isSaving = false;
}

/* SERVICES */
window.addServiceField = ()=>{
  const input = document.createElement("input");
  document.getElementById("servicesEdit").appendChild(input);
};

/* PROJECTS */
window.addProject = ()=>{
  const div = document.createElement("div");
  div.innerHTML = `<input type="file" accept="image/*">`;
  document.getElementById("projects").appendChild(div);
};

/* PROFILE IMAGE */
window.triggerImage = ()=>{
  document.getElementById("imageInput").click();
};

/* SHARE */
window.copyLink = ()=>{
  if(guard()) return;
  navigator.clipboard.writeText(window.location.href);
};

window.downloadVCard = ()=>{
  if(guard()) return;
  alert("vCard soon");
};

/* CTA */
window.explorePremium = ()=>{
  alert("Premium page soon");
};

window.exploreProducts = ()=>{
  alert("Pet NFC coming soon");
};

/* LOGOUT */
document.querySelector(".logout").onclick = ()=>{
  signOut(auth).then(()=>window.location.replace("/auth/login.html"));
};

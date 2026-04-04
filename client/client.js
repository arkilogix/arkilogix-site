let currentData = {};
let profileImageUrl = "";
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
currentData = data;
profileImageUrl = data.profileImage || "";

document.getElementById("modalImage").src = profileImageUrl || "/logo.png";
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
document.querySelector(".actions .btn").addEventListener("click", openModal);

function openModal(){
  document.getElementById("editModal").style.display = "flex";

  document.getElementById("editName").value = currentData.name || "";
  document.getElementById("editPosition").value = currentData.position || "";

  renderServicesEdit();
  updateStrength();
}

function closeModal(){
  document.getElementById("editModal").style.display = "none";
}

function renderServicesEdit(){
  const container = document.getElementById("servicesEdit");
  container.innerHTML = "";

  const services = currentData.services || [];

  services.forEach(s => {
    addServiceField(s);
  });

  if(services.length === 0) addServiceField();
}

function addServiceField(value=""){
  const container = document.getElementById("servicesEdit");

  if(container.children.length >= 3){
    alert("Basic plan allows max 3 services");
    return;
  }

  const div = document.createElement("div");
  div.className = "service-row";

  div.innerHTML = `
    <input value="${value}" oninput="updateStrength()">
    <button class="remove" onclick="this.parentElement.remove();updateStrength()">x</button>
  `;

  container.appendChild(div);
}
window.addServiceField = addServiceField;

document.getElementById("imageInput").addEventListener("change", uploadImage);

async function uploadImage(e){
  const file = e.target.files[0];
  if(!file) return;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "arkilogix_profile");
  formData.append("folder", `arkilogix/clients/${auth.currentUser.uid}`);
  formData.append("public_id", "profile");

  const res = await fetch(`https://api.cloudinary.com/v1_1/dnlzwtkhs/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  profileImageUrl = data.secure_url;

  document.getElementById("modalImage").src = profileImageUrl;

  updateStrength();
}

function updateStrength(){
  let score = 0;

  const name = document.getElementById("editName").value;
  const position = document.getElementById("editPosition").value;

  const services = [...document.querySelectorAll("#servicesEdit input")]
    .map(i => i.value)
    .filter(v => v);

  if(name) score += 25;
  if(position) score += 25;
  if(services.length >= 3) score += 25;
  if(profileImageUrl) score += 25;

  document.getElementById("strengthValue").textContent = score + "%";
}
window.updateStrength = updateStrength;
window.closeModal = closeModal;

import { updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function saveProfile(){

  const name = document.getElementById("editName").value;
  const position = document.getElementById("editPosition").value;

  const services = [...document.querySelectorAll("#servicesEdit input")]
    .map(i => i.value)
    .filter(v => v);

  const ref = doc(db, "clients", auth.currentUser.uid);

  await updateDoc(ref, {
    name,
    position,
    services,
    profileImage: profileImageUrl,
    updatedAt: new Date()
  });

  /* UPDATE UI */
  cardName.textContent = name;
  cardPosition.textContent = position;

  cardServices.innerHTML = "";
  services.forEach(s => {
    const div = document.createElement("div");
    div.textContent = s;
    cardServices.appendChild(div);
  });

  closeModal();
}
window.saveProfile = saveProfile;

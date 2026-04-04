import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* STATE */
let currentData = {};
let profileImageUrl = "";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyCUw-qxeRg8YaihNcJPmJDHL2z6zBE6PK4",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients",
  storageBucket: "arkilogix-clients.firebasestorage.app",
  messagingSenderId: "1074947351840",
  appId: "1:1074947351840:web:b077eb79963fff59316345"
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

/* AUTH (FIXED) */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "/auth/login.html";
      }
    }, 300);
    return;
  }

  // ✅ SAFE: user is confirmed
  loadDashboard(user);

});

/* LOAD DASHBOARD */
async function loadDashboard(user){

  const docSnap = await getDoc(doc(db, "clients", user.uid));

  if (!docSnap.exists()) {
    window.location.href = "/onboarding/index.html";
    return;
  }

  const data = docSnap.data();

  currentData = data;
  profileImageUrl = data.profileImage || "";

  /* UI */
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

  document.getElementById("modalImage").src = profileImageUrl || "/logo.png";

  /* STATS */
  const stats = data.stats || {};

  viewsEl.textContent = stats.views || 0;
  tapsEl.textContent = stats.taps || 0;
  clicksEl.textContent = stats.clicks || 0;

  applyPlan(data.plan || "basic");
}

/* PLAN */
function applyPlan(plan){

  const cards = document.querySelectorAll(".stat");

  if(plan === "basic"){
    cards.forEach(c => lock(c));
  }

  if(plan === "pro" || plan === "elite"){
    cards.forEach(c => unlock(c));
  }

  if(plan === "elite"){
    upgradeBtn.style.display = "none";
  }
}

function lock(el){
  el.classList.add("locked");
  el.onclick = () => window.location.href = "/upgrade.html";
}

function unlock(el){
  el.classList.remove("locked");
  el.onclick = null;
}

/* MODAL */
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
window.closeModal = closeModal;

/* SERVICES */
function renderServicesEdit(){
  const container = document.getElementById("servicesEdit");
  container.innerHTML = "";

  (currentData.services || []).forEach(s => addServiceField(s));

  if((currentData.services || []).length === 0) addServiceField();
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

/* CLOUDINARY */
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

function viewCard(){
  const uid = auth.currentUser.uid;
  const plan = currentData.plan || "basic";

  window.open(`/view/${plan}.html?id=${uid}`, "_blank");
}

/* STRENGTH */
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

/* SAVE */
async function saveProfile(){

  const name = document.getElementById("editName").value;
  const position = document.getElementById("editPosition").value;

  const services = [...document.querySelectorAll("#servicesEdit input")]
    .map(i => i.value)
    .filter(v => v);

  await updateDoc(doc(db, "clients", auth.currentUser.uid), {
    name,
    position,
    services,
    profileImage: profileImageUrl,
    updatedAt: new Date()
  });

  // update UI
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

/* LOGOUT */
document.querySelector(".logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/auth/login.html";
  });
});

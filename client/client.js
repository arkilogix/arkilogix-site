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

/* STATE */
let currentData = {};
let profileImageUrl = "";

/* ELEMENTS */
const userName = document.getElementById("userName");
const planBadge = document.getElementById("planBadge");
const headerProfile = document.getElementById("headerProfile");

const cardName = document.getElementById("cardName");
const cardPosition = document.getElementById("cardPosition");
const cardServices = document.getElementById("cardServices");

const viewsEl = document.getElementById("views");
const tapsEl = document.getElementById("taps");
const clicksEl = document.getElementById("clicks");

const upgradeBtn = document.getElementById("upgradeBtn");
const upgradeModal = document.getElementById("upgradeModal");

/* AUTH */
onAuthStateChanged(auth, async (user) => {

  if (!user) {
    setTimeout(() => {
      if (!auth.currentUser) {
        window.location.href = "/auth/login.html";
      }
    }, 300);
    return;
  }

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

  /* HEADER */
  userName.textContent = data.name || "User";
  planBadge.textContent = (data.plan || "basic").toUpperCase();

  if(headerProfile){
    headerProfile.src = profileImageUrl || "/logo.png";
  }

  /* CARD */
  cardName.textContent = data.name || "Name";
  cardPosition.textContent = data.position || "Position";

  cardServices.innerHTML = "";
  (data.services || []).forEach(s => {
    const span = document.createElement("span");
    span.textContent = s;
    cardServices.appendChild(span);
  });

  /* MODAL IMAGE */
  const modalImg = document.getElementById("modalImage");
  if(modalImg){
    modalImg.src = profileImageUrl || "/logo.png";
  }

  /* ANALYTICS */
  const stats = data.stats || {};

  const views = stats.views || 0;
  const taps = stats.taps || 0;
  const clicks = stats.clicks || 0;

  viewsEl.textContent = views;
  tapsEl.textContent = taps;
  clicksEl.textContent = clicks;

  const max = Math.max(views, taps, clicks, 1);

  document.getElementById("viewsBar").style.width = (views / max * 100) + "%";
  document.getElementById("tapsBar").style.width = (taps / max * 100) + "%";
  document.getElementById("clicksBar").style.width = (clicks / max * 100) + "%";

  renderLinks();
  applyPlan(data.plan || "basic");
}

/* PLAN SYSTEM */
function applyPlan(plan){

  const statsCards = document.querySelectorAll(".stat");

  if(plan === "basic"){
    statsCards.forEach(c => {
      c.classList.add("locked");
      c.querySelector("p").innerText = "—";
      c.onclick = openUpgrade;
    });
  }

  if(plan === "pro" || plan === "elite"){
    statsCards.forEach(c => {
      c.classList.remove("locked");
      c.onclick = null;
    });
  }

  if(plan === "elite"){
    upgradeBtn.style.display = "none";
  }
}

/* ========================= */
/* UPGRADE MODAL */
/* ========================= */

function openUpgrade(){
  if(upgradeModal){
    upgradeModal.style.display = "flex";
  }
}

function closeUpgrade(){
  if(upgradeModal){
    upgradeModal.style.display = "none";
  }
}

if(upgradeBtn){
  upgradeBtn.addEventListener("click", openUpgrade);
}

window.closeUpgrade = closeUpgrade;

/* ========================= */
/* EDIT MODAL */
/* ========================= */

const editBtn = document.querySelectorAll(".actions .btn")[0];

if(editBtn){
  editBtn.addEventListener("click", openModal);
}

/* CLICK PROFILE = EDIT */
const profileBtn = document.querySelector(".user-profile");
if(profileBtn){
  profileBtn.addEventListener("click", openModal);
}

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

/* ========================= */
/* LIVE PREVIEW */
/* ========================= */

document.getElementById("editName").addEventListener("input", e=>{
  cardName.textContent = e.target.value || "Name";
});

document.getElementById("editPosition").addEventListener("input", e=>{
  cardPosition.textContent = e.target.value || "Position";
});

/* ========================= */
/* IMAGE UPLOAD */
/* ========================= */

const imageInput = document.getElementById("imageInput");

if(imageInput){
  imageInput.addEventListener("change", (e) => {

    const file = e.target.files[0];
    if(!file) return;

    /* ========================= */
/* IMAGE UPLOAD (CLOUDINARY) */
/* ========================= */

const CLOUD_NAME = "dnlzwtkhs";
const UPLOAD_PRESET = "arkilogix-client";

const imageInput = document.getElementById("imageInput");

if(imageInput){
  imageInput.addEventListener("change", async (e) => {

    const file = e.target.files[0];
    if(!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try{
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();

      const imageUrl = data.secure_url;

      // SAVE TEMP
      profileImageUrl = imageUrl;

      // UPDATE UI
      document.getElementById("modalImage").src = imageUrl;

      const headerProfile = document.getElementById("headerProfile");
      if(headerProfile){
        headerProfile.src = imageUrl;
      }

    }catch(err){
      alert("Upload failed");
      console.error(err);
    }

  });
}

    reader.readAsDataURL(file);
  });
}

/* ========================= */
/* SERVICES EDIT */
/* ========================= */

function renderServicesEdit(){
  const container = document.getElementById("servicesEdit");
  container.innerHTML = "";

  (currentData.services || []).forEach(s => addServiceField(s));

  if((currentData.services || []).length === 0){
    addServiceField();
  }
}

function addServiceField(value=""){
  const container = document.getElementById("servicesEdit");

  const div = document.createElement("div");
  div.className = "service-row";

  div.innerHTML = `
    <input value="${value}" oninput="updateStrength()">
    <button class="remove" onclick="this.parentElement.remove();updateStrength()">x</button>
  `;

  container.appendChild(div);
}

window.addServiceField = addServiceField;

/* ========================= */
/* SAVE PROFILE */
/* ========================= */

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
    updatedAt: Date.now()
  });

  currentData.name = name;
  currentData.position = position;
  currentData.services = services;

  cardName.textContent = name;
  cardPosition.textContent = position;

  cardServices.innerHTML = "";
  services.forEach(s => {
    const span = document.createElement("span");
    span.textContent = s;
    cardServices.appendChild(span);
  });

  closeModal();
}

/* ========================= */
/* LINKS SYSTEM */
/* ========================= */

const LINK_TYPES = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" }
];

function renderLinks(){
  const container = document.getElementById("linksContainer");
  if(!container) return;

  container.innerHTML = "";

  (currentData.links || []).forEach(l => addLink(l));
}

function addLink(data = {}){
  const container = document.getElementById("linksContainer");

  if((currentData.plan || "basic") === "basic"){
    openUpgrade();
    return;
  }

  if(container.children.length >= 5 && currentData.plan === "pro"){
    openUpgrade();
    return;
  }

  const div = document.createElement("div");
  div.className = "link-row";

  div.innerHTML = `
    <select>
      ${LINK_TYPES.map(t =>
        `<option value="${t.value}" ${data.type === t.value ? "selected" : ""}>${t.label}</option>`
      ).join("")}
    </select>

    <input placeholder="Enter URL" value="${data.url || ""}">

    <button onclick="this.parentElement.remove()">x</button>
  `;

  container.appendChild(div);
}

async function saveLinks(){

  const rows = document.querySelectorAll(".link-row");

  const links = [...rows].map(r => {
    const type = r.querySelector("select").value;
    const url = r.querySelector("input").value;

    return { type, url };
  }).filter(l => l.url);

  await updateDoc(doc(db, "clients", auth.currentUser.uid), {
    links
  });

  currentData.links = links;

  alert("Links saved");
}

window.addLink = addLink;
window.saveLinks = saveLinks;

/* ========================= */
/* VIEW CARD */
/* ========================= */

function viewCard(){
  const uid = auth.currentUser.uid;
  const plan = currentData.plan || "basic";

  window.open(`/view/${plan}.html?id=${uid}`, "_blank");
}

window.viewCard = viewCard;

/* ========================= */
/* STRENGTH */
/* ========================= */

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

/* ========================= */
/* LOGOUT */
/* ========================= */

document.querySelector(".logout").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/auth/login.html";
  });
});

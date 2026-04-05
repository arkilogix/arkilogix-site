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
let currentStep = 1;

/* CLOUDINARY */
const CLOUD_NAME = "dnlzwtkhs";
const UPLOAD_PRESET = "arkilogix_profile";

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

  userName.textContent = data.name || "User";
  planBadge.textContent = (data.plan || "basic").toUpperCase();

  if(headerProfile){
    headerProfile.src = profileImageUrl || "/logo.png";
  }

  cardName.textContent = data.name || "Name";
  cardPosition.textContent = data.position || "Position";

  cardServices.innerHTML = "";
  (data.services || []).forEach(s => {
    const span = document.createElement("span");
    span.textContent = s;
    cardServices.appendChild(span);
  });

  const modalImg = document.getElementById("modalImage");
  if(modalImg){
    modalImg.src = profileImageUrl || "/logo.png";
  }

  const stats = data.stats || {};
  const views = stats.views || 0;
  const taps = stats.taps || 0;
  const clicks = stats.clicks || 0;

  if(viewsEl) viewsEl.textContent = views;
  if(tapsEl) tapsEl.textContent = taps;
  if(clicksEl) clicksEl.textContent = clicks;

  const max = Math.max(views, taps, clicks, 1);

  if(document.getElementById("viewsBar"))
    document.getElementById("viewsBar").style.width = (views / max * 100) + "%";

  if(document.getElementById("tapsBar"))
    document.getElementById("tapsBar").style.width = (taps / max * 100) + "%";

  if(document.getElementById("clicksBar"))
    document.getElementById("clicksBar").style.width = (clicks / max * 100) + "%";

  renderLinks();
  applyPlan(data.plan || "basic");
}

/* PLAN */
function applyPlan(plan){
  const statsCards = document.querySelectorAll(".stat");

  if(plan === "basic"){
    statsCards.forEach(c => {
      c.classList.add("locked");
      const p = c.querySelector("p");
      if(p) p.innerText = "—";
      c.onclick = openUpgrade;
    });
  } else {
    statsCards.forEach(c => {
      c.classList.remove("locked");
      c.onclick = null;
    });
  }

  if(plan === "elite" && upgradeBtn){
    upgradeBtn.style.display = "none";
  }
}

/* UPGRADE */
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

/* MODAL */
const editBtn = document.querySelectorAll(".actions .btn")[0];
if(editBtn){
  editBtn.addEventListener("click", openModal);
}

const profileBtn = document.querySelector(".user-profile");
if(profileBtn){
  profileBtn.addEventListener("click", openModal);
}

function openModal(){
  document.getElementById("editModal").style.display = "flex";

  const nameInput = document.getElementById("editName");
  const posInput = document.getElementById("editPosition");

  if(nameInput) nameInput.value = currentData.name || "";
  if(posInput) posInput.value = currentData.position || "";

  currentStep = 1;
  showStep(1);

  renderServicesEdit();
  updateServiceLimitUI();
  updateStrength();
}

function closeModal(){
  document.getElementById("editModal").style.display = "none";
}
window.closeModal = closeModal;

/* LIVE PREVIEW */
const nameInput = document.getElementById("editName");
if(nameInput){
  nameInput.addEventListener("input", e=>{
    cardName.textContent = e.target.value || "Name";
  });
}

const posInput = document.getElementById("editPosition");
if(posInput){
  posInput.addEventListener("input", e=>{
    cardPosition.textContent = e.target.value || "Position";
  });
}

/* IMAGE UPLOAD */
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
        { method: "POST", body: formData }
      );

      const data = await res.json();
      const imageUrl = data.secure_url;

      profileImageUrl = imageUrl;

      const modalImg = document.getElementById("modalImage");
      if(modalImg) modalImg.src = imageUrl;

      if(headerProfile){
        headerProfile.src = imageUrl;
      }

      imageInput.value = "";

    }catch(err){
      console.error(err);
      alert("Upload failed");
    }
  });
}

/* SERVICES */
function renderServicesEdit(){
  const container = document.getElementById("servicesEdit");
  if(!container) return;

  container.innerHTML = "";

  (currentData.services || []).forEach(s => addServiceField(s));

  if((currentData.services || []).length === 0){
    addServiceField();
  }
}

function addServiceField(value=""){

  const container = document.getElementById("servicesEdit");
  if(!container) return;

  const currentCount = container.querySelectorAll("input").length;
  const plan = currentData.plan || "basic";

  if(plan === "basic" && currentCount >= 3){
    openUpgrade();
    return;
  }

  const div = document.createElement("div");
  div.className = "service-row";

  div.innerHTML = `
    <input value="${value}" oninput="updateStrength()">
    <button class="remove" onclick="this.parentElement.remove();updateStrength();updateServiceLimitUI()">×</button>
  `;

  container.appendChild(div);
  updateServiceLimitUI();
}
window.addServiceField = addServiceField;

function updateServiceLimitUI(){

  const container = document.getElementById("servicesEdit");
  const addBtn = document.querySelector(".add-service-btn");

  if(!container || !addBtn) return;

  const count = container.querySelectorAll("input").length;
  const plan = currentData.plan || "basic";

  if(plan === "basic" && count >= 3){
    addBtn.innerText = "Limit reached (3)";
    addBtn.style.opacity = "0.5";
  }else{
    addBtn.innerText = "+ Add Service";
    addBtn.style.opacity = "1";
  }
}

/* SAVE PROFILE */
async function saveProfile(){

  const saveBtn = document.getElementById("saveBtn");
  if(!saveBtn) return;

  saveBtn.disabled = true;
  saveBtn.innerText = "Saving...";

  try{

    const name = document.getElementById("editName")?.value || "";
    const position = document.getElementById("editPosition")?.value || "";

    let services = [...document.querySelectorAll("#servicesEdit input")]
      .map(i => i.value)
      .filter(v => v);

    const plan = currentData.plan || "basic";

    if(plan === "basic" && services.length > 3){
      openUpgrade();
      saveBtn.disabled = false;
      saveBtn.innerText = "Save";
      return;
    }

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

    saveBtn.innerText = "Saved ✓";

    setTimeout(()=>{
      closeModal();
      saveBtn.innerText = "Save";
      saveBtn.disabled = false;
    }, 600);

  }catch(err){
    console.error(err);
    saveBtn.innerText = "Error";
    setTimeout(()=>{
      saveBtn.innerText = "Save";
      saveBtn.disabled = false;
    }, 1000);
  }
}

/* LINKS */
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
  if(!container) return;

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

  await updateDoc(doc(db, "clients", auth.currentUser.uid), { links });

  currentData.links = links;

  alert("Links saved");
}

window.addLink = addLink;
window.saveLinks = saveLinks;

/* VIEW CARD */
function viewCard(){
  const uid = auth.currentUser.uid;
  const plan = currentData.plan || "basic";
  window.open(`/view/${plan}.html?id=${uid}`, "_blank");
}
window.viewCard = viewCard;

/* STRENGTH */
function updateStrength(){
  let score = 0;

  const name = document.getElementById("editName")?.value || "";
  const position = document.getElementById("editPosition")?.value || "";

  const services = [...document.querySelectorAll("#servicesEdit input")]
    .map(i => i.value)
    .filter(v => v);

  if(name) score += 25;
  if(position) score += 25;
  if(services.length >= 3) score += 25;
  if(profileImageUrl) score += 25;

  const el = document.getElementById("strengthValue");
  if(el) el.textContent = score + "%";
}
window.updateStrength = updateStrength;

/* STEPS */
function showStep(step){

  document.querySelectorAll(".step").forEach(s=>{
    s.classList.remove("active");
  });

  const current = document.querySelector(`.step[data-step="${step}"]`);
  if(current) current.classList.add("active");

  const indicator = document.getElementById("stepIndicator");
  if(indicator) indicator.innerText = `${step} / 4`;

  const titles = {
    1: "Step 1: Identity",
    2: "Step 2: Contacts",
    3: "Step 3: Services",
    4: "Upgrade"
  };

  const title = document.getElementById("stepTitle");
  if(title) title.innerText = titles[step];

  const nextBtn = document.getElementById("nextBtn");

  if(nextBtn){
    nextBtn.innerText = step === 4 ? "Finish" : "Next";
  }
}

function nextStep(){
  if(currentStep === 4){
    saveProfile();
    return;
  }
  currentStep++;
  showStep(currentStep);
}

function prevStep(){
  if(currentStep === 1) return;
  currentStep--;
  showStep(currentStep);
}

/* LOGOUT */
const logoutBtn = document.querySelector(".logout");
if(logoutBtn){
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "/auth/login.html";
    });
  });
}

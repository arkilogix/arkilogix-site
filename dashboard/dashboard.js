import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc,
  doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("clientsContainer");

let clients = [];
let editingId = null;
let upgradeId = null;

/* LOAD */
async function loadClients() {
  const snapshot = await getDocs(collection(db, "clients"));

  clients = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => !c.deleted);

  render(clients);
}

/* RENDER */
function render(data) {
  container.innerHTML = "";

  let totalViews = 0, totalTaps = 0, topViews = 0, topClient = "-";

  data.forEach(c => {

    totalViews += c.views || 0;
    totalTaps += c.taps || 0;

    if ((c.views || 0) > topViews) {
      topViews = c.views;
      topClient = c.name;
    }

    const initials = (c.name || "")
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();

    const avatar = c.photoURL
      ? `<img src="${c.photoURL}" onerror="this.parentElement.innerHTML='${initials}'">`
      : initials;

    const disabledClass = c.disabled ? "disabled" : "";

    container.innerHTML += `
      <div class="client-card glass ${disabledClass}">

        <div class="client-header">
          <div class="client-left">
            <div class="avatar">${avatar}</div>
            <div>
              <h3>${c.name}</h3>
              <p>${c.position || ""}</p>
            </div>
          </div>

          <div class="badge ${c.disabled ? "disabled" : c.plan}">
            ${c.disabled ? "Disabled" : c.plan}
          </div>
        </div>

        <div class="divider"></div>

        <div class="client-stats">
          <span>Views ${c.views || 0}</span>
          <span>Taps ${c.taps || 0}</span>
        </div>

        <div class="divider"></div>

        <div class="client-actions">

          <button class="icon-btn" onclick="openClient('${c.id}')">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M14 3h7v7"></path>
              <path d="M10 14L21 3"></path>
              <path d="M21 14v7h-7"></path>
              <path d="M3 10l11 11"></path>
            </svg>
          </button>

          <button class="btn" onclick="editClient('${c.id}')">Edit</button>

          <button class="icon-btn" onclick="deleteClient('${c.id}')">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M3 6h18"></path>
              <path d="M8 6v12"></path>
              <path d="M16 6v12"></path>
            </svg>
          </button>

          <button class="icon-btn" onclick="toggleDisable('${c.id}', ${c.disabled})">
            <svg class="icon" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4" y1="4" x2="20" y2="20"></line>
            </svg>
          </button>

          <button class="btn gold" onclick="openUpgrade('${c.id}')">
            ${c.plan === "elite" ? "✔ Elite" : "Upgrade"}
          </button>

        </div>

      </div>
    `;
  });

  document.getElementById("totalClients").textContent = data.length;
  document.getElementById("totalViews").textContent = totalViews;
  document.getElementById("totalTaps").textContent = totalTaps;
  document.getElementById("topClient").textContent = topClient;
}

/* CRUD */
async function saveClient() { /* same as before */ }
async function deleteClient(id) {
  await updateDoc(doc(db, "clients", id), { deleted:true });
  loadClients();
}

async function toggleDisable(id, state){
  await updateDoc(doc(db,"clients",id),{ disabled: !state });
  loadClients();
}

/* UPGRADE */
function openUpgrade(id){
  upgradeId = id;
  upgradeModal.style.display="flex";
}

function closeUpgrade(){
  upgradeModal.style.display="none";
}

async function confirmUpgrade(){
  const newPlan = upgradePlan.value;
  await updateDoc(doc(db,"clients",upgradeId),{ plan:newPlan });
  closeUpgrade();
  loadClients();
}

/* OPEN */
function openClient(id){
  window.open(`/card.html?id=${id}`,"_blank");
}

/* GLOBAL */
window.openClient=openClient;
window.deleteClient=deleteClient;
window.toggleDisable=toggleDisable;
window.openUpgrade=openUpgrade;
window.closeUpgrade=closeUpgrade;
window.confirmUpgrade=confirmUpgrade;

loadClients();

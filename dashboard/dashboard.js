import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc,
  doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("clientsContainer");

let clients = [];
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

  data.forEach(c => {

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
          <div class="stat-item">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            ${c.views || 0}
          </div>

          <div class="stat-item">
            <svg class="icon" viewBox="0 0 24 24">
              <path d="M4 4l7 17 2-7 7-2z"></path>
            </svg>
            ${c.taps || 0}
          </div>
        </div>

        <div class="divider"></div>

        <div class="client-actions">

          <div class="actions-left">

            <button class="icon-btn open" onclick="openClient('${c.id}')">
              <svg class="icon" viewBox="0 0 24 24">
                <path d="M14 3h7v7"></path>
                <path d="M10 14L21 3"></path>
                <path d="M3 10v11h11"></path>
              </svg>
            </button>

            <button class="btn" onclick="editClient('${c.id}')">Edit</button>

            <button class="icon-btn delete" onclick="deleteClient('${c.id}')">
              <svg class="icon" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </button>

            <button class="icon-btn disable" onclick="toggleDisable('${c.id}', ${c.disabled})">
              <svg class="icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4" y1="4" x2="20" y2="20"></line>
              </svg>
            </button>

          </div>

          <button class="btn gold" onclick="openUpgrade('${c.id}')">
            ${c.plan === "elite" ? "✔ Elite" : "Upgrade"}
          </button>

        </div>

      </div>
    `;
  });
}

/* ACTIONS */
async function deleteClient(id){
  await updateDoc(doc(db,"clients",id),{ deleted:true });
  loadClients();
}

async function toggleDisable(id,state){
  await updateDoc(doc(db,"clients",id),{ disabled:!state });
  loadClients();
}

function openClient(id){
  window.open(`/card.html?id=${id}`,"_blank");
}

/* UPGRADE */
function openUpgrade(id){
  upgradeId=id;
  upgradeModal.style.display="flex";
}

function closeUpgrade(){
  upgradeModal.style.display="none";
}

async function confirmUpgrade(){
  await updateDoc(doc(db,"clients",upgradeId),{
    plan: upgradePlan.value
  });
  closeUpgrade();
  loadClients();
}

/* GLOBAL */
window.deleteClient=deleteClient;
window.toggleDisable=toggleDisable;
window.openClient=openClient;
window.openUpgrade=openUpgrade;
window.closeUpgrade=closeUpgrade;
window.confirmUpgrade=confirmUpgrade;

loadClients();

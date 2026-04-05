import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc,
  doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let clients = [];
let filter = "all";
let upgradeId = null;

const container = document.getElementById("clientsContainer");

/* LOAD */
async function loadClients(){
  const snap = await getDocs(collection(db,"clients"));
  clients = snap.docs.map(d=>({id:d.id,...d.data()})).filter(c=>!c.deleted);
  render();
}

/* FILTER */
window.setFilter = (e,f)=>{
  filter = f;
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  e.target.classList.add("active");
  render();
};

/* RENDER */
function render(){

  // 🔥 FIXED ANALYTICS
  document.getElementById("totalClients").textContent = clients.length;

  const totalViews = clients.reduce((sum,c)=>sum+(c.views||0),0);
  const totalTaps = clients.reduce((sum,c)=>sum+(c.taps||0),0);

  document.getElementById("totalViews").textContent = totalViews;
  document.getElementById("totalTaps").textContent = totalTaps;

  let top = [...clients].sort((a,b)=>(b.views||0)-(a.views||0))[0];
  document.getElementById("topClient").textContent = top?.name || "-";

  // FILTER LOGIC
  let data = clients;
  if(filter==="disabled") data = clients.filter(c=>c.disabled);
  else if(filter!=="all") data = clients.filter(c=>c.plan===filter && !c.disabled);

  // TOP CARD
  document.getElementById("topCard").innerHTML = top ? `
    <h3>Top Performer ⭐</h3>
    <p>${top.name || "No Name"}</p>
    <p>${top.views || 0} views</p>
  ` : "";

  container.innerHTML = "";

  data.forEach(c=>{

    const initials = (c.name || "NA")
      .split(" ")
      .map(n=>n[0])
      .join("")
      .toUpperCase();

    const avatarHTML = c.photoURL
      ? `<img src="${c.photoURL}" onerror="this.parentElement.innerHTML='${initials}'">`
      : initials;

    container.innerHTML += `
    <div class="client-card glass ${c.disabled?"disabled":""}">

      <div class="client-header">
        <div class="client-left">
          <div class="avatar">${avatarHTML}</div>
          <div>
            <h3>${c.name || "No Name"}</h3>
            <p>${c.position || ""}</p>
          </div>
        </div>

        <div class="badge ${c.disabled?"disabled":c.plan}">
          ${c.disabled?"Disabled":c.plan}
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
          ${c.plan==="elite" ? "✔ Elite" : "Upgrade"}
        </button>

      </div>

    </div>`;
  });
}

/* ACTIONS */
window.openClient = (id)=>window.open(`/card.html?id=${id}`);

window.deleteClient = async(id)=>{
  await updateDoc(doc(db,"clients",id),{deleted:true});
  loadClients();
};

window.toggleDisable = async(id,state)=>{
  await updateDoc(doc(db,"clients",id),{disabled:!state});
  loadClients();
};

/* UPGRADE */
window.openUpgrade = (id)=>{
  upgradeId=id;
  upgradeModal.style.display="flex";
};

window.closeUpgrade = ()=>upgradeModal.style.display="none";

window.confirmUpgrade = async()=>{
  await updateDoc(doc(db,"clients",upgradeId),{
    plan: upgradePlan.value
  });
  closeUpgrade();
  loadClients();
};

loadClients();

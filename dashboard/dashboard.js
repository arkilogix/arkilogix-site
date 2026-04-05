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
window.setFilter = (f)=>{
  filter = f;
  document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
  event.target.classList.add("active");
  render();
};

/* RENDER */
function render(){
  let data = clients;

  if(filter==="disabled") data = clients.filter(c=>c.disabled);
  else if(filter!=="all") data = clients.filter(c=>c.plan===filter && !c.disabled);

  container.innerHTML = "";

  let top = clients.sort((a,b)=>(b.views||0)-(a.views||0))[0];

  document.getElementById("topCard").innerHTML = top ? `
    <h3>Top Performer ⭐</h3>
    <p>${top.name}</p>
    <p>${top.views||0} views</p>
  ` : "";

  data.forEach(c=>{
    const initials = (c.name||"").split(" ").map(n=>n[0]).join("").toUpperCase();
    const avatar = c.photoURL ? `<img src="${c.photoURL}">` : initials;

    container.innerHTML += `
    <div class="client-card glass ${c.disabled?"disabled":""}">

      <div class="client-header">
        <div class="client-left">
          <div class="avatar">${avatar}</div>
          <div>
            <h3>${c.name}</h3>
            <p>${c.position||""}</p>
          </div>
        </div>

        <div class="badge ${c.disabled?"disabled":c.plan}">
          ${c.disabled?"Disabled":c.plan}
        </div>
      </div>

      <div class="divider"></div>

      <div class="client-stats">
        <div class="stat-item">${c.views||0} views</div>
        <div class="stat-item">${c.taps||0} taps</div>
      </div>

      <div class="divider"></div>

      <div class="client-actions">

        <div class="actions-left">
          <button onclick="openClient('${c.id}')">🔗</button>
          <button onclick="editClient('${c.id}')">Edit</button>
          <button onclick="deleteClient('${c.id}')">🗑</button>
          <button onclick="toggleDisable('${c.id}',${c.disabled})">🚫</button>
        </div>

        <button class="btn gold" onclick="openUpgrade('${c.id}')">
          ${c.plan==="elite"?"✔ Elite":"Upgrade"}
        </button>

      </div>

    </div>`;
  });
}

/* ACTIONS */
window.openClient=(id)=>window.open(`/card.html?id=${id}`);

window.deleteClient=async(id)=>{
  await updateDoc(doc(db,"clients",id),{deleted:true});
  loadClients();
};

window.toggleDisable=async(id,state)=>{
  await updateDoc(doc(db,"clients",id),{disabled:!state});
  loadClients();
};

/* UPGRADE */
window.openUpgrade=(id)=>{
  upgradeId=id;
  upgradeModal.style.display="flex";
};

window.closeUpgrade=()=>upgradeModal.style.display="none";

window.confirmUpgrade=async()=>{
  await updateDoc(doc(db,"clients",upgradeId),{
    plan: upgradePlan.value
  });
  closeUpgrade();
  loadClients();
};

loadClients();

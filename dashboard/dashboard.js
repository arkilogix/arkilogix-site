import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("clientsContainer");

async function loadClients() {
  const snapshot = await getDocs(collection(db, "clients"));

  container.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const link = `/view/${data.plan}.html?id=${id}`;

    container.innerHTML += `
      <div class="card">
        <h3>${data.name}</h3>
        <p>${data.position || ""}</p>
        <p><b>${data.plan.toUpperCase()}</b></p>

        <p>Views: ${data.views || 0}</p>
        <p>Last: ${data.lastViewed || "-"}</p>

        <a href="${link}" target="_blank">Open</a>

        <button onclick="editClient('${id}')">Edit</button>
        <button onclick="deleteClient('${id}')">Delete</button>
      </div>
    `;
  });
}

loadClients();

// =========================
// CREATE CLIENT (STEP 6)
// =========================
async function saveClient() {
  const name = document.getElementById("name").value;
  const position = document.getElementById("position").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const plan = document.getElementById("plan").value;

  await addDoc(collection(db, "clients"), {
    name,
    position,
    email,
    phone,
    plan,
    createdAt: new Date(),
    views: 0,
    lastViewed: null
  });

  loadClients();
}


// =========================
// DELETE CLIENT (STEP 7)
// =========================
async function deleteClient(id) {
  await deleteDoc(doc(db, "clients", id));
  loadClients();
}


// =========================
// UPDATE PLAN (STEP 8)
// =========================
async function upgradePlan(id, newPlan) {
  await updateDoc(doc(db, "clients", id), {
    plan: newPlan
  });

  loadClients();
}


// =========================
// MAKE FUNCTIONS GLOBAL
// =========================
window.saveClient = saveClient;
window.deleteClient = deleteClient;
window.upgradePlan = upgradePlan;

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

  let totalClients = 0;
  let totalViews = 0;
  let totalTaps = 0;

  let topClientName = "-";
  let topViews = 0;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const id = docSnap.id;

    const plan = data.plan || "basic";
    const link = `/view/${plan}.html?id=${id}`;

    // 📊 ANALYTICS
    totalClients++;
    totalViews += data.views || 0;
    totalTaps += data.taps || 0;

    if ((data.views || 0) > topViews) {
      topViews = data.views || 0;
      topClientName = data.name || "No Name";
    }

    // 🧱 UI CARD
    container.innerHTML += `
      <div class="card">
        <h3>${data.name || "No Name"}</h3>
        <p>${data.position || ""}</p>
        <p><b>${plan.toUpperCase()}</b></p>

        <p>Views: ${data.views || 0}</p>
        <p>Taps: ${data.taps || 0}</p>

        <a href="${link}" target="_blank">Open</a>

        <button onclick="editClient('${id}')">Edit</button>
        <button onclick="deleteClient('${id}')">Delete</button>
      </div>
    `;
  });

  // 📊 UPDATE DASHBOARD UI
  document.getElementById("totalClients").textContent = totalClients;
  document.getElementById("totalViews").textContent = totalViews;
  document.getElementById("totalTaps").textContent = totalTaps;
  document.getElementById("topClient").textContent = topClientName;
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
  const confirmDelete = confirm("Are you sure you want to delete this client?");

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "clients", id));
    loadClients();
  } catch (err) {
    alert("Error deleting client");
    console.error(err);
  }
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

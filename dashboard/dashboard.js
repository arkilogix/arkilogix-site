import { db } from "./firebase.js";
import {
  collection, getDocs, addDoc,
  doc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("clientsContainer");
const searchInput = document.getElementById("search");

let clients = [];
let editingId = null;

// LOAD CLIENTS
async function loadClients() {
  const snapshot = await getDocs(collection(db, "clients"));

  clients = snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => !c.deleted); // SOFT DELETE FILTER

  render(clients);
}

// RENDER
function render(data) {
  container.innerHTML = "";

  let totalViews = 0;
  let totalTaps = 0;
  let topClient = "-";
  let topViews = 0;

  data.forEach(c => {
    totalViews += c.views || 0;
    totalTaps += c.taps || 0;

    if ((c.views || 0) > topViews) {
      topViews = c.views;
      topClient = c.name;
    }

    container.innerHTML += `
      <div class="client-card">
        <h3>${c.name}</h3>
        <p>${c.position || ""}</p>
        <p><b>${(c.plan || "basic").toUpperCase()}</b></p>

        <p>Views: ${c.views || 0} • Taps: ${c.taps || 0}</p>

        <div class="actions">
          <button class="edit" onclick="editClient('${c.id}')">Edit</button>
          <button class="delete" onclick="deleteClient('${c.id}')">Delete</button>
        </div>
      </div>
    `;
  });

  document.getElementById("totalClients").textContent = data.length;
  document.getElementById("totalViews").textContent = totalViews;
  document.getElementById("totalTaps").textContent = totalTaps;
  document.getElementById("topClient").textContent = topClient;
}

// SEARCH
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  render(clients.filter(c => c.name?.toLowerCase().includes(q)));
});

// SAVE
async function saveClient() {
  const data = {
    name: name.value,
    position: position.value,
    email: email.value,
    phone: phone.value,
    plan: plan.value,
  };

  if (editingId) {
    await updateDoc(doc(db, "clients", editingId), data);
  } else {
    await addDoc(collection(db, "clients"), {
      ...data,
      views: 0,
      taps: 0,
      analytics: {},
      createdAt: new Date()
    });
  }

  closeModal();
  loadClients();
}

// EDIT
function editClient(id) {
  const c = clients.find(x => x.id === id);
  if (!c) return;

  name.value = c.name;
  position.value = c.position;
  email.value = c.email;
  phone.value = c.phone;
  plan.value = c.plan;

  editingId = id;
  openModal();
}

// SOFT DELETE
async function deleteClient(id) {
  await updateDoc(doc(db, "clients", id), {
    deleted: true,
    deletedAt: new Date()
  });

  loadClients();
}

// MODAL
function openModal() { modal.style.display = "flex"; }
function closeModal() { modal.style.display = "none"; editingId = null; }

// GLOBAL
window.saveClient = saveClient;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.openModal = openModal;
window.closeModal = closeModal;

loadClients();

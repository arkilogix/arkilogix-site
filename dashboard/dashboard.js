import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const container = document.getElementById("clientsContainer");

let editingId = null;

// DELETE SYSTEM
let deleteId = null;
let deletedData = null;
let deleteTimer = null;


// =========================
// LOAD CLIENTS + ANALYTICS
// =========================
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

    // 🧱 UI
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

  // 📊 UPDATE UI
  document.getElementById("totalClients").textContent = totalClients;
  document.getElementById("totalViews").textContent = totalViews;
  document.getElementById("totalTaps").textContent = totalTaps;
  document.getElementById("topClient").textContent = topClientName;
}

loadClients();


// =========================
// CREATE / UPDATE CLIENT
// =========================
async function saveClient() {
  const name = document.getElementById("name").value;
  const position = document.getElementById("position").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const plan = document.getElementById("plan").value;

  if (!name) {
    alert("Name is required");
    return;
  }

  if (editingId) {
    await updateDoc(doc(db, "clients", editingId), {
      name,
      position,
      email,
      phone,
      plan
    });

    editingId = null;
  } else {
    await addDoc(collection(db, "clients"), {
      name,
      position,
      email,
      phone,
      plan,
      createdAt: new Date(),
      views: 0,
      taps: 0,
      lastViewed: null
    });
  }

  closeModal();
  clearForm();
  loadClients();
}


// =========================
// EDIT CLIENT
// =========================
async function editClient(id) {
  const snap = await getDoc(doc(db, "clients", id));

  if (!snap.exists()) return;

  const data = snap.data();

  document.getElementById("name").value = data.name || "";
  document.getElementById("position").value = data.position || "";
  document.getElementById("email").value = data.email || "";
  document.getElementById("phone").value = data.phone || "";
  document.getElementById("plan").value = data.plan || "basic";

  editingId = id;
  openCreateModal();
}


// =========================
// DELETE (OPEN MODAL)
// =========================
function deleteClient(id) {
  deleteId = id;
  document.getElementById("deleteModal").style.display = "flex";
}


// =========================
// CONFIRM DELETE (UNDO SYSTEM)
// =========================
async function confirmDelete() {
  if (!deleteId) return;

  const ref = doc(db, "clients", deleteId);

  const snap = await getDoc(ref);
  if (snap.exists()) {
    deletedData = snap.data();
  }

  closeDeleteModal();
  loadClients();

  const toast = document.getElementById("undoToast");
  toast.style.display = "flex";

  deleteTimer = setTimeout(async () => {
    await deleteDoc(ref);
    toast.style.display = "none";
    deleteId = null;
    deletedData = null;
  }, 5000);
}


// =========================
// UNDO DELETE
// =========================
async function undoDelete() {
  if (!deletedData || !deleteId) return;

  clearTimeout(deleteTimer);

  await setDoc(doc(db, "clients", deleteId), deletedData);

  document.getElementById("undoToast").style.display = "none";

  deleteId = null;
  deletedData = null;

  loadClients();
}


// =========================
// MODAL HELPERS
// =========================
function openCreateModal() {
  document.getElementById("modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
  editingId = null;
}

function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
}

function clearForm() {
  document.getElementById("name").value = "";
  document.getElementById("position").value = "";
  document.getElementById("email").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("plan").value = "basic";
}


// =========================
// GLOBAL FUNCTIONS
// =========================
window.saveClient = saveClient;
window.editClient = editClient;
window.deleteClient = deleteClient;
window.confirmDelete = confirmDelete;
window.undoDelete = undoDelete;
window.openCreateModal = openCreateModal;
window.closeModal = closeModal;
window.closeDeleteModal = closeDeleteModal;

const db = firebase.firestore();
const auth = firebase.auth();

let USERS = [];
let selectedUser = null;

// =========================
// 🔐 ADMIN CHECK
// =========================
async function isAdmin(uid) {
  try {
    const doc = await db.collection("admins").doc(uid).get();
    return doc.exists;
  } catch (err) {
    console.error("Admin check error:", err);
    return false;
  }
}

// =========================
// 🔑 AUTH STATE
// =========================
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    location.href = "/";
    return;
  }

  const admin = await isAdmin(user.uid);

  if (!admin) {
    alert("Not authorized");
    location.href = "/";
    return;
  }

  console.log("Admin verified:", user.uid);
  loadUsers();
});

// =========================
// 📦 LOAD USERS
// =========================
async function loadUsers() {
  try {
    const snap = await db.collection("clients").get();

    USERS = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    render(USERS);
    updateStats();

  } catch (err) {
    console.error("Load users error:", err);
  }
}

// =========================
// 🧾 RENDER TABLE
// =========================
function render(data) {
  const table = document.getElementById("table");
  if (!table) return;

  table.innerHTML = "";

  if (data.length === 0) {
    table.innerHTML = `<tr><td colspan="4">No users found</td></tr>`;
    return;
  }

  data.forEach(u => {
    table.innerHTML += `
      <tr onclick="openPanel('${u.id}')">
        <td>${u.name || "-"}</td>
        <td>${u.email || "-"}</td>
        <td>${u.plan || "basic"}</td>
        <td><button>View</button></td>
      </tr>
    `;
  });
}

// =========================
// 📊 STATS
// =========================
function updateStats() {
  let basic = 0, pro = 0, elite = 0;

  USERS.forEach(u => {
    if (u.plan === "pro") pro++;
    else if (u.plan === "elite") elite++;
    else basic++;
  });

  setText("total", USERS.length);
  setText("basic", basic);
  setText("pro", pro);
  setText("elite", elite);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

// =========================
// 🔍 SEARCH
// =========================
window.addEventListener("DOMContentLoaded", () => {
  const search = document.getElementById("search");

  if (!search) return;

  search.addEventListener("input", (e) => {
    const val = e.target.value.toLowerCase();

    const filtered = USERS.filter(u =>
      (u.name || "").toLowerCase().includes(val) ||
      (u.email || "").toLowerCase().includes(val)
    );

    render(filtered);
  });
});

// =========================
// 📂 PANEL
// =========================
function openPanel(id) {
  selectedUser = USERS.find(u => u.id === id);
  if (!selectedUser) return;

  const panel = document.getElementById("panel");
  if (panel) panel.classList.add("open");

  setText("pName", selectedUser.name || "-");
  setText("pEmail", selectedUser.email || "-");
  setText("pPhone", selectedUser.phone || "-");

  setText("pPlan", "Plan: " + (selectedUser.plan || "basic"));
  setText("pStatus", "Status: " + (selectedUser.status || "active"));
  setText("pPayment", "Payment: " + (selectedUser.paymentStatus || "none"));

  updateStatusButton();
}

function closePanel() {
  const panel = document.getElementById("panel");
  if (panel) panel.classList.remove("open");
}

// =========================
// 🔗 CARD LINK
// =========================
function getCardLink(user) {
  const base = window.location.origin;
  const plan = user.plan || "basic";
  return `${base}/view/${plan}.html?id=${user.id}`;
}

// VIEW CARD
function viewCard() {
  if (!selectedUser) return;
  window.open(getCardLink(selectedUser), "_blank");
}

// COPY LINK
function copyLink() {
  if (!selectedUser) return;

  const link = getCardLink(selectedUser);

  navigator.clipboard.writeText(link)
    .then(() => alert("Link copied!"))
    .catch(() => alert("Copy failed"));
}

// =========================
// 🚫 TOGGLE STATUS
// =========================
async function toggleStatus() {
  if (!selectedUser) return;

  const current = selectedUser.status || "active";
  const newStatus = current === "active" ? "disabled" : "active";

  try {
    await db.collection("clients").doc(selectedUser.id).update({
      status: newStatus
    });

    alert("User status updated");
    closePanel();
    loadUsers();

  } catch (err) {
    console.error("Status update error:", err);
  }
}

function updateStatusButton() {
  const btn = document.getElementById("statusBtn");
  if (!btn || !selectedUser) return;

  const status = selectedUser.status || "active";
  btn.innerText = status === "active" ? "Disable User" : "Enable User";
}

// =========================
// 🔄 UPDATE PLAN
// =========================
async function updatePlan(plan) {
  if (!selectedUser) return;

  if (!confirm(`Change plan to ${plan}?`)) return;

  try {
    await db.collection("clients").doc(selectedUser.id).update({
      plan: plan
    });

    alert("Plan updated");
    closePanel();
    loadUsers();

  } catch (err) {
    console.error("Plan update error:", err);
  }
}

// =========================
// 💸 APPROVE PAYMENT
// =========================
async function approvePayment(plan) {
  if (!selectedUser) return;

  if (!confirm(`Approve ${plan} payment?`)) return;

  try {
    await db.collection("clients").doc(selectedUser.id).update({
      plan: plan,
      paymentStatus: "paid",
      upgradedAt: new Date()
    });

    alert("Payment approved");
    closePanel();
    loadUsers();

  } catch (err) {
    console.error("Payment approval error:", err);
  }
}

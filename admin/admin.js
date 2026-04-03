const db = firebase.firestore();
const auth = firebase.auth();

let USERS = [];
let selectedUser = null;

// ✅ ADMIN CHECK
async function isAdmin(uid) {
  const doc = await db.collection("admins").doc(uid).get();
  return doc.exists;
}

// ✅ AUTH
auth.onAuthStateChanged(async (user) => {
  if (!user) return location.href = "/";

  const admin = await isAdmin(user.uid);

  if (!admin) {
    alert("Not authorized");
    return location.href = "/";
  }

  loadUsers();
});

// ✅ LOAD USERS
async function loadUsers() {
  const snap = await db.collection("clients").get();

  USERS = snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  render(USERS);
  updateStats();
}

// ✅ RENDER
function render(data) {
  const table = document.getElementById("table");
  table.innerHTML = "";

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

// ✅ STATS
function updateStats() {
  let basic = 0, pro = 0, elite = 0;

  USERS.forEach(u => {
    if (u.plan === "pro") pro++;
    else if (u.plan === "elite") elite++;
    else basic++;
  });

  document.getElementById("total").innerText = USERS.length;
  document.getElementById("basic").innerText = basic;
  document.getElementById("pro").innerText = pro;
  document.getElementById("elite").innerText = elite;
}

// ✅ SEARCH
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

// ✅ OPEN PANEL
function openPanel(id) {
  selectedUser = USERS.find(u => u.id === id);

  document.getElementById("panel").classList.add("open");

  document.getElementById("pName").innerText = selectedUser.name || "-";
  document.getElementById("pEmail").innerText = selectedUser.email || "-";
  document.getElementById("pPhone").innerText = selectedUser.phone || "-";
  document.getElementById("pPlan").innerText =
    "Plan: " + (selectedUser.plan || "basic");

  document.getElementById("pStatus").innerText =
    "Status: " + (selectedUser.status || "active");

  document.getElementById("pPayment").innerText =
    "Payment: " + (selectedUser.paymentStatus || "none");

  updateStatusButton();
}

function closePanel() {
  document.getElementById("panel").classList.remove("open");
}

// ✅ CARD LINK
function getCardLink(user) {
  const base = window.location.origin;
  const plan = user.plan || "basic";
  return `${base}/view/${plan}.html?id=${user.id}`;
}

// 🔗 VIEW CARD
function viewCard() {
  if (!selectedUser) return;
  window.open(getCardLink(selectedUser), "_blank");
}

// 📋 COPY LINK
function copyLink() {
  const link = getCardLink(selectedUser);
  navigator.clipboard.writeText(link);
  alert("Link copied!");
}

// 🚫 TOGGLE STATUS
async function toggleStatus() {
  const newStatus =
    (selectedUser.status || "active") === "active"
      ? "disabled"
      : "active";

  await db.collection("clients").doc(selectedUser.id).update({
    status: newStatus
  });

  alert("User updated");
  closePanel();
  loadUsers();
}

// UPDATE BUTTON TEXT
function updateStatusButton() {
  const btn = document.getElementById("statusBtn");

  if ((selectedUser.status || "active") === "active") {
    btn.innerText = "Disable User";
  } else {
    btn.innerText = "Enable User";
  }
}

// ✅ UPDATE PLAN
async function updatePlan(plan) {
  if (!selectedUser) return;

  if (!confirm(`Change plan to ${plan}?`)) return;

  await db.collection("clients").doc(selectedUser.id).update({
    plan: plan
  });

  alert("Plan updated");

  closePanel();
  loadUsers();
}

// 💸 APPROVE PAYMENT (OPTION A)
async function approvePayment(plan) {
  if (!selectedUser) return;

  if (!confirm(`Approve ${plan} payment?`)) return;

  await db.collection("clients").doc(selectedUser.id).update({
    plan: plan,
    paymentStatus: "paid",
    upgradedAt: new Date()
  });

  alert("Payment approved");

  closePanel();
  loadUsers();
}

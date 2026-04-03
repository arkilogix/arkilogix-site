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

// ✅ RENDER TABLE
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

// ✅ SEARCH (safe load)
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

// ✅ PANEL
function openPanel(id) {
  selectedUser = USERS.find(u => u.id === id);

  document.getElementById("panel").classList.add("open");

  document.getElementById("pName").innerText = selectedUser.name || "-";
  document.getElementById("pEmail").innerText = selectedUser.email || "-";
  document.getElementById("pPhone").innerText = selectedUser.phone || "-";
  document.getElementById("pPlan").innerText =
    "Plan: " + (selectedUser.plan || "basic");
}

function closePanel() {
  document.getElementById("panel").classList.remove("open");
}

// ✅ UPDATE PLAN
async function updatePlan(plan) {
  if (!selectedUser) return;

  if (!confirm(`Change plan to ${plan}?`)) return;

  await db.collection("clients").doc(selectedUser.id).update({
    plan: plan
  });

  alert("Updated");

  closePanel();
  loadUsers();
}

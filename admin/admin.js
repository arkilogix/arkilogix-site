// ================= GLOBAL STATE =================
let users = [];
let selectedUser = null;

// ================= FIREBASE =================
const db = firebase.firestore();

// ================= FETCH USERS =================
db.collection("clients").orderBy("createdAt", "desc")
.onSnapshot(snapshot => {

  users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  renderTable(users);
  updateStats(users);
});

// ================= RENDER TABLE =================
function renderTable(data){

  const table = document.getElementById("table");
  table.innerHTML = "";

  data.forEach(user => {

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${user.name || "-"}</td>
      <td>${user.email || "-"}</td>
      <td>${user.plan || "-"}</td>
      <td><button onclick="openPanel('${user.id}')">View</button></td>
    `;

    table.appendChild(tr);
  });
}

// ================= SEARCH =================
document.getElementById("search").addEventListener("input", e => {

  const value = e.target.value.toLowerCase();

  const filtered = users.filter(u =>
    (u.name || "").toLowerCase().includes(value) ||
    (u.email || "").toLowerCase().includes(value)
  );

  renderTable(filtered);
});

// ================= STATS =================
function updateStats(data){

  const total = data.length;

  const paid = data.filter(u => u.status === "paid" || u.status === "completed").length;

  const revenue = data
    .filter(u => u.status === "paid" || u.status === "completed")
    .reduce((sum, u) => sum + (u.price || 0), 0);

  const conversion = total ? ((paid / total) * 100).toFixed(1) : 0;

  document.getElementById("total").innerText = total;
  document.getElementById("paid").innerText = paid;
  document.getElementById("conversion").innerText = conversion + "%";
  document.getElementById("revenue").innerText = "₱" + revenue.toLocaleString();
}

// ================= PANEL =================
window.openPanel = function(id){

  selectedUser = users.find(u => u.id === id);

  if(!selectedUser) return;

  document.getElementById("panel").classList.add("open");

  document.getElementById("pName").innerText = selectedUser.name || "-";
  document.getElementById("pEmail").innerText = selectedUser.email || "-";
  document.getElementById("pPhone").innerText = selectedUser.phone || "-";
  document.getElementById("pPlan").innerText = "Plan: " + (selectedUser.plan || "-");
  document.getElementById("pStatus").innerText = "Status: " + (selectedUser.status || "-");

  document.getElementById("pPayment").innerHTML = selectedUser.paymentProof
    ? `<a href="${selectedUser.paymentProof}" target="_blank">View Proof</a>`
    : "No payment proof";

  // Button text
  document.getElementById("statusBtn").innerText =
    selectedUser.disabled ? "Enable User" : "Disable User";
}

window.closePanel = function(){
  document.getElementById("panel").classList.remove("open");
}

// ================= UPDATE STATUS =================
window.toggleStatus = async function(){

  if(!selectedUser) return;

  await db.collection("clients").doc(selectedUser.id).update({
    disabled: !selectedUser.disabled
  });
}

// ================= UPDATE PLAN =================
window.updatePlan = async function(plan){

  if(!selectedUser) return;

  await db.collection("clients").doc(selectedUser.id).update({
    plan: plan
  });

  alert("Plan updated to " + plan);
}

// ================= APPROVE PAYMENT =================
window.approvePayment = async function(plan){

  if(!selectedUser) return;

  await db.collection("clients").doc(selectedUser.id).update({
    status: "paid",
    plan: plan,
    paidAt: new Date()
  });

  alert("Payment approved");
}

// ================= VIEW CARD =================
window.viewCard = function(){

  if(!selectedUser) return;

  let page = selectedUser.plan === "elite"
    ? "elite.html"
    : selectedUser.plan === "pro"
    ? "pro.html"
    : "basic.html";

  const link = `${window.location.origin}/arkilogix-site/view/${page}?id=${selectedUser.id}`;

  window.open(link, "_blank");
}

// ================= COPY LINK =================
window.copyLink = function(){

  if(!selectedUser) return;

  let page = selectedUser.plan === "elite"
    ? "elite.html"
    : selectedUser.plan === "pro"
    ? "pro.html"
    : "basic.html";

  const link = `${window.location.origin}/arkilogix-site/view/${page}?id=${selectedUser.id}`;

  navigator.clipboard.writeText(link);
  alert("Link copied!");
}

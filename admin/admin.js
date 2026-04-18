emailjs.init("Wp1sOcLJH-dg_dkLs");

const db = firebase.firestore();

let users = [];
let filter = "pending_verification";
let selected = null;

/* AUTH */
firebase.auth().onAuthStateChanged(user=>{
  if(!user) window.location.href="/auth/login.html";
});

/* LOGOUT */
window.logout = function(){
  firebase.auth().signOut();
  window.location.href="/auth/login.html";
}

/* FETCH */
db.collection("clients").orderBy("createdAt","desc")
.onSnapshot(s=>{
  users = s.docs.map(d=>({
    id:d.id,
    ...d.data(),
    status: d.data().status || "pending_verification",
    shippingStatus: d.data().shippingStatus || "pending"
  }));
  render();
});

/* FILTER */
window.setFilter = (f,el)=>{
  filter = f;
  document.querySelectorAll(".tabs div").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  render();
}

/* RENDER */
function render(){

  const table = document.getElementById("table");
  table.innerHTML = "";

  let data = filter==="all"
    ? users
    : users.filter(u => (u.status || "pending_verification") === filter);

  if(data.length===0){
    table.innerHTML="<tr><td colspan='7'>No orders</td></tr>";
    return;
  }

  data.forEach(u=>{

    if(u.isArchived) return;

    const tr = document.createElement("tr");
    tr.onclick = ()=>openPanel(u);

    tr.innerHTML = `
    <td>${u.paymentProof ? `<img src="${u.paymentProof}" class="thumb">` : `<div class="thumb"></div>`}</td>
    <td>${u.name || "-"} ${u.hasAccount ? "✓" : "○"}</td>
    <td>${u.plan || "-"}</td>
    <td>₱${(u.price||0).toLocaleString()}</td>
    <td>${formatStatus(u.status)}</td>
    <td>${formatShipping(u.shippingStatus)}</td>
    <td>${format(u.createdAt)}</td>
    `;

    table.appendChild(tr);

  });
}

/* PANEL */
function openPanel(u){

  selected = u;

  const p = document.getElementById("panel");
  p.classList.add("open");

  const addressBlock = `
  <div style="line-height:1.5;font-size:13px;">
    ${u.name || ""}<br>
    ${u.phone || ""}<br><br>

    ${u.addressLine1 || ""}<br>
    ${u.addressLine2 || ""}<br>
    ${u.barangay || ""}<br>
    ${u.city || ""}, ${u.province || ""}<br>

    ${u.notes ? `<br><span style="color:#888">Notes: ${u.notes}</span>` : ""}
  </div>
  `;

  p.innerHTML = `
  <div class="close-btn" onclick="closePanel()">✕</div>

  <h2>${u.name || "-"}</h2>

  <p>${u.email || "-"}</p>
  <p>${u.phone || "-"}</p>

  <button class="btn" onclick="emailClient()">Email Client</button>

  <hr>

  <p><strong>${u.plan || "-"}</strong> • ${u.card || "-"}</p>
  <p>₱${(u.price||0).toLocaleString()}</p>

  <hr>

  <p>Status: ${formatStatus(u.status)}</p>

  <h3 style="margin-top:20px;">Payment</h3>

  ${u.paymentProof 
  ? `<img src="${u.paymentProof}" style="width:100%;border-radius:8px;margin-top:10px;cursor:pointer" onclick="preview('${u.paymentProof}')">`
  : `<p style="color:#888;">No payment proof uploaded</p>`
  }

  <hr>

  <h3>📦 Shipping</h3>

  ${addressBlock}

  <button class="btn" onclick="copyAddress()">Copy Address</button>

  <p style="margin-top:10px;">Status: <strong>${formatShipping(u.shippingStatus)}</strong></p>

  ${shippingActions(u)}

  <hr>

  ${actions(u)}

  <br>

  <div onclick="archive()" style="color:#888;cursor:pointer;font-size:13px;margin-top:20px">Archive</div>
  `;
}

/* SHIPPING ACTIONS */
function shippingActions(u){

  if(u.shippingStatus==="pending"){
    return `<button class="btn" onclick="updateShipping('in_production')">Start Production</button>`;
  }

  if(u.shippingStatus==="in_production"){
    return `<button class="btn" onclick="updateShipping('shipped')">Mark as Shipped</button>`;
  }

  if(u.shippingStatus==="shipped"){
    return `<button class="btn" onclick="updateShipping('completed')">Mark Completed</button>`;
  }

  return "";
}

/* SHIPPING UPDATE */
window.updateShipping = function(status){
  if(!selected) return;

  db.collection("clients").doc(selected.id).update({
    shippingStatus: status
  });

  alert("Shipping status updated");
}

/* EMAIL CLIENT */
window.emailClient = function(){
  if(!selected || !selected.email) return;

  const subject = encodeURIComponent("Your NFC Card Update");
  const body = encodeURIComponent(`Hi ${selected.name || ""},

We are updating you regarding your NFC card order.

Thank you,
ArkiLogix`);

  window.location.href = `mailto:${selected.email}?subject=${subject}&body=${body}`;
}

/* COPY ADDRESS */
window.copyAddress = function(){
  if(!selected) return;

  const text = `
${selected.name || ""}
${selected.phone || ""}

${selected.addressLine1 || ""}
${selected.addressLine2 || ""}
${selected.barangay || ""}
${selected.city || ""}, ${selected.province || ""}

${selected.notes || ""}
`;

  navigator.clipboard.writeText(text);
  alert("Address copied!");
}

/* ACTIONS */
function actions(u){

  if(u.status==="pending_verification"){
    return `
    <button class="btn" onclick="approve('${u.id}')">Approve</button>
    <button class="btn" onclick="reject('${u.id}')">Reject</button>
    `;
  }

  if(u.status==="paid"){
    return `<button class="btn" onclick="processing('${u.id}')">Mark Processing</button>`;
  }

  if(u.status==="processing"){
    return `<button class="btn" onclick="complete('${u.id}')">Mark Completed</button>`;
  }

  return "";
}

/* ACTION FUNCTIONS */
window.approve = async(id)=>{
  try{
    console.log("Approving:", id);

    await db.collection("clients").doc(id).update({
      status: "paid",
      approvedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    closePanel();

  }catch(err){
    console.error("APPROVE ERROR:", err);
    alert("Approval failed ❌");
  }
}

window.reject = id=>update(id,"pending_payment");
window.processing = id=>update(id,"processing");
window.complete = id=>update(id,"completed");

function update(id,status){
  db.collection("clients").doc(id).update({status});
}

/* ARCHIVE */
window.archive = function(){
  if(!selected) return;
  db.collection("clients").doc(selected.id).update({isArchived:true});
  closePanel();
}

/* PANEL CONTROLS */
window.closePanel = function(){
  document.getElementById("panel").classList.remove("open");
}

/* FIXED OUTSIDE CLICK */
document.addEventListener("click", function(e){
  const panel = document.getElementById("panel");

  if(e.target.closest("tr")) return;

  if(!panel.contains(e.target) && panel.classList.contains("open")){
    closePanel();
  }
});

/* ESC CLOSE */
document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    closePanel();
  }
});

/* MODAL */
window.preview = src=>{
  document.getElementById("modalImg").src = src;
  document.getElementById("modal").classList.add("show");
}

window.closeModal = ()=>{
  document.getElementById("modal").classList.remove("show");
}

/* HELPERS */
function format(d){
  if(!d) return "-";
  if(d.seconds) return new Date(d.seconds*1000).toLocaleDateString();
  return new Date(d).toLocaleDateString();
}

function formatStatus(s){
  if(!s) return "Pending Verification";
  return s.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase());
}

function formatShipping(s){
  if(!s) return "Pending";
  return s.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase());
}

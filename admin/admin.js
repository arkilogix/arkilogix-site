firebase.auth().onAuthStateChanged(user=>{
  console.log("ADMIN USER:", user);

  if(!user){
    alert("NOT LOGGED IN ❌");
    window.location.href="/auth/login.html";
  } else {
    console.log("LOGGED IN AS:", user.email);
  }
});

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
db.collection("clients")
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
  const mobile = document.getElementById("mobileList");
  mobile.innerHTML = "";
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
    
  // 📱 MOBILE CARD
  const card = document.createElement("div");
  card.className = "mobile-card";
  card.onclick = () => openPanel(u);
  
  card.innerHTML = `
    <div class="mobile-name">${u.name || "-"}</div>
    <div class="mobile-sub">${u.plan || "-"} • ₱${(u.price||0).toLocaleString()}</div>
    <div class="mobile-status">
      ${formatStatus(u.status)} • ${formatShipping(u.shippingStatus)}
    </div>
  `;
  
  mobile.appendChild(card);
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
    <div class="mobile-header">
      <span onclick="closePanel()">← Back</span>
    </div>
  
    <div class="close-btn" onclick="closePanel()">✕</div>

  <h2>${u.name || "-"}</h2>

  <p>${u.email || "-"}</p>
  <p>${u.phone || "-"}</p>

${u.link ? `
<hr>

<h3>🔗 Digital Card</h3>

<input 
  value="${u.link}" 
  style="width:100%;padding:10px;border-radius:8px;border:none;background:#1a1a1a;color:#fff"
  readonly
>

<button class="btn" onclick="copyClientLink()">Copy Link</button>

<img 
  src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(u.link)}"
  style="width:100%;margin-top:12px;border-radius:10px;background:#fff;padding:12px"
>

<button class="btn" onclick="downloadQR()">Download QR (HD)</button>

` : ""}

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

    <div class="actions-wrapper">
    ${actions(u)}
  </div>

  <br>

  <div onclick="archive()" style="color:#888;cursor:pointer;font-size:13px;margin-top:20px">Archive</div>
  `;
}

/* SHIPPING ACTIONS */
function shippingActions(u){

  // ❗ must be paid first
  if(u.status !== "paid"){
    return `<p style="color:#888;">Waiting for payment</p>`;
  }

  if(u.shippingStatus === "pending"){
    return `<button class="btn" onclick="updateShipping('printing')">Start Production</button>`;
  }

  if(u.shippingStatus === "printing"){
    return `<button class="btn" onclick="updateShipping('encoding')">Mark as Encoding</button>`;
  }

  if(u.shippingStatus === "encoding"){
    return `<button class="btn" onclick="updateShipping('ready')">Mark as Ready</button>`;
  }

  if(u.shippingStatus === "ready"){
    return `<button class="btn" onclick="updateShipping('shipped')">Mark as Shipped</button>`;
  }

  if(u.shippingStatus === "shipped"){
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

  return `
  
  ${u.status !== "paid" ? `
    <button class="btn" onclick="markPaid('${u.id}')">Mark as Paid</button>
  ` : ""}

  ${u.status === "paid"
    ? `<button class="btn" onclick="lock('${u.id}')">Lock Dashboard</button>`
    : `<button class="btn" onclick="unlock('${u.id}')">Unlock Dashboard</button>`
  }

  <button class="btn" onclick="processing('${u.id}')">Mark Processing</button>
  <button class="btn" onclick="complete('${u.id}')">Mark Completed</button>

  <hr>

  <button class="btn" style="border-color:red;color:red"
    onclick="deleteClient('${u.id}')">
    Delete Client
  </button>
  `;
}

/* ACTION FUNCTIONS */


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

  const label = s.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase());

  let color = "#888";

  if(s === "paid") color = "#3b82f6";         // blue
  if(s === "processing") color = "#a855f7";   // purple
  if(s === "completed") color = "#22c55e";    // green
  if(s === "pending_payment") color = "#f59e0b"; // orange

  return `<span style="color:${color};font-weight:600;">${label}</span>`;
}

function formatShipping(s){
  if(!s) return "Pending";

  const label = s.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase());

  let color = "#888";

  if(s === "printing") color = "#3b82f6";
  if(s === "encoding") color = "#a855f7";
  if(s === "ready") color = "#22c55e";
  if(s === "shipped") color = "#06b6d4";
  if(s === "completed") color = "#16a34a";

  return `<span style="color:${color};font-weight:600;">${label}</span>`;
}

/* MARK AS PAID */
window.markPaid = async(id)=>{
  if(!confirm("Mark this client as PAID?")) return;

  try{

    await db.collection("clients").doc(id).update({
      status: "paid",
      paidAt: firebase.firestore.FieldValue.serverTimestamp(),
      isLocked: false,
      shippingStatus: "pending" // 🔥 ensure workflow starts
    });

    // 🔥 AUTO DOWNLOAD QR
    if(selected && selected.link){
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(selected.link)}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = (selected.name || "client") + "-qr.png";
      a.click();
    }

    alert("Client activated + QR downloaded ✅");

    closePanel();

  }catch(err){
    console.error(err);
    alert("Failed to update ❌");
  }
};

/* LOCK DASHBOARD */
window.lock = async(id)=>{
  if(!confirm("Lock this client's dashboard?")) return;

  await db.collection("clients").doc(id).update({
    isLocked: true
  });

  alert("Dashboard locked 🔒");
};


/* UNLOCK DASHBOARD */
window.unlock = async(id)=>{
  if(!confirm("Unlock this client's dashboard?")) return;

  await db.collection("clients").doc(id).update({
    isLocked: false,
    status: "paid"
  });

  alert("Dashboard unlocked 🔓");
};

window.deleteClient = async(id)=>{
  if(!confirm("⚠️ DELETE this client permanently?\nThis will erase ALL data.")) return;

  if(!confirm("FINAL CONFIRMATION: This cannot be undone.")) return;

  try{

    // 🔥 DELETE FIRESTORE
    await db.collection("clients").doc(id).delete();

    // 🔥 DELETE CLOUDINARY (folder)
    await deleteCloudinaryFolder(id);

    alert("Client deleted permanently 🗑");

    closePanel();

  }catch(err){
    console.error(err);
    alert("Delete failed ❌");
  }
};

async function deleteCloudinaryFolder(clientId){

  // ⚠️ This should be done via backend (Node / Firebase Function)
  // For now we log it

  console.log("DELETE CLOUDINARY FOLDER:", "nfc-clients/" + clientId);

  // OPTIONAL: call your backend endpoint
  // await fetch("/delete-cloudinary", { method:"POST", body: JSON.stringify({clientId}) });

}

window.copyClientLink = function(){
  if(!selected || !selected.link) return;

  navigator.clipboard.writeText(selected.link);
  alert("Client link copied!");
}

window.downloadQR = function(){
  if(!selected || !selected.link) return;

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(selected.link)}`;

  const a = document.createElement("a");
  a.href = url;
  a.download = "qr.png";
  a.click();
}

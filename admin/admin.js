const db = firebase.firestore();

let users = [];
let filter = "all";
let selected = null;

/* FETCH */
db.collection("clients").onSnapshot(s=>{
  users = s.docs.map(d=>({id:d.id,...d.data()}));
  render();
});

/* FILTER */
window.setFilter = (f,el)=>{
  filter = f;
  document.querySelectorAll(".filter").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  render();
};

/* RENDER */
function render(){
  
    // 🔥 KPI START (ADD HERE)
  const kpi = document.getElementById("kpi");

  const needsAction = users.filter(u =>
    !u.status ||
    u.status === "pending_verification" ||
    u.status === "pending_payment"
  ).length;

  const paid = users.filter(u => u.status === "paid").length;

  const production = users.filter(u =>
    ["printing","encoding","ready"].includes(u.shippingStatus)
  ).length;

  const completed = users.filter(u => u.status === "completed").length;
  const revenue = users
  .filter(u => u.status === "paid")
  .reduce((sum,u)=> sum + (u.price || 0), 0);
  
  kpi.innerHTML = `
  
    <div class="kpi-box">
    <div class="kpi-title">Revenue</div>
    <div class="kpi-value">₱${revenue.toLocaleString()}</div>
    </div>
    
    <div class="kpi-box">
      <div class="kpi-title">Needs Action</div>
      <div class="kpi-value">${needsAction}</div>
    </div>

    <div class="kpi-box">
      <div class="kpi-title">Paid</div>
      <div class="kpi-value">${paid}</div>
    </div>

    <div class="kpi-box">
      <div class="kpi-title">Production</div>
      <div class="kpi-value">${production}</div>
    </div>

    <div class="kpi-box">
      <div class="kpi-title">Completed</div>
      <div class="kpi-value">${completed}</div>
    </div>
  `;
  // 🔥 KPI END

  const list = document.getElementById("list");
  list.innerHTML = "";

let search = document.getElementById("search")?.value?.toLowerCase().trim() || "";

let data;

// 🔹 FILTER
if(filter === "all"){
  data = users;
}
else if(filter === "needs_action"){
  data = users.filter(u =>
    !u.status ||
    u.status === "pending_verification" ||
    u.status === "pending_payment"
  );
}
else{
  data = users.filter(u => (u.status || "pending_verification") === filter);
}

// 🔍 SEARCH
if(search){
  data = data.filter(u => {

    const name = (u.name || u.fullName || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    const company = (u.company || "").toLowerCase();

    return (
      name.includes(search) ||
      email.includes(search) ||
      phone.includes(search) ||
      company.includes(search)
    );
  });
}

// 🧠 SMART SORT
data.sort((a,b)=>{

  const priority = (u)=>{
    if(!u.status || u.status === "pending_verification" || u.status === "pending_payment") return 1;
    if(u.shippingStatus === "ready") return 2;
    if(["printing","encoding"].includes(u.shippingStatus)) return 3;
    return 4;
  };

  return priority(a) - priority(b);
});
  
  data.forEach(u=>{

    const card = document.createElement("div");
    card.className = "card";

    if(u.shippingStatus === "ready"){
    card.style.border = "1px solid #22c55e";
    card.style.boxShadow = "0 0 14px rgba(34,197,94,0.5)";
    card.style.background = "rgba(34,197,94,0.05)";
    }
    card.onclick = ()=>openModal(u);

    card.innerHTML = `
      <img class="avatar" src="${u.profile || '/logo.png'}">

      <div style="flex:1">
        <div class="name">${u.name || "-"}</div>
        <div class="sub">${u.plan || "-"} • ₱${(u.price||0).toLocaleString()}</div>
      </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
      <div class="badge ${getStatusClass(u.status)}">
      ${formatStatus(u.status)}
    </div>
  
    <div class="badge ${getShippingClass(u.shippingStatus)}">
      ${formatStatus(u.shippingStatus)}
    </div>
  
  </div>
    `;

    list.appendChild(card);
  });
}

function renderActionButton(u){

  const action = getNextAction(u);

  if(!action) return "";

  return `
    <button class="btn primary" onclick="handleAction()">
      ${action.label}
    </button>
  `;
}

window.handleAction = async function(){
  const action = getNextAction(selected);
  if(!action) return;
  await action.action();
  setTimeout(()=>closeModal(), 200);
};

/* MODAL */
function openModal(u){
  const page = u.plan === "elite" ? "elite.html" :
             u.plan === "pro" ? "pro.html" : "basic.html";

  const link = window.location.origin + "/view/" + page + "?id=" + u.id;
    
  selected = u;

  const modal = document.getElementById("modal");
  const box = document.getElementById("modalBox");

  modal.classList.add("show");

box.innerHTML = `

<!-- 👤 CLIENT -->
<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
  <img src="${u.profile || '/logo.png'}" style="width:56px;height:56px;border-radius:14px;object-fit:cover">
  <div>
    <div style="font-weight:600;font-size:16px">${u.name || "-"}</div>
    <div style="font-size:12px;color:#94a3b8">${u.email || ""}</div>
  </div>
</div>

<!-- 💰 PAYMENT -->
<div style="margin-top:10px">
  <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">Payment</div>

  <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:12px">
    <div><b>${u.plan || "-"}</b> • ₱${(u.price||0).toLocaleString()}</div>

    ${u.paymentProof ? `
      <img src="${u.paymentProof}" 
        style="width:100%;margin-top:10px;border-radius:10px;cursor:pointer"
        onclick="window.open('${u.paymentProof}','_blank')">
    ` : `<div style="font-size:12px;color:#888;margin-top:6px">No proof uploaded</div>`}
  </div>
</div>

<!-- 🔗 DIGITAL CARD -->
<div style="margin-top:16px">

  <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">Digital Card</div>

  <!-- LINK -->
  <input value="${link}" 
    style="width:100%;padding:10px;border-radius:10px;border:none;background:#020617;color:#fff">

  <!-- ACTIONS -->
  <div style="display:flex;gap:8px;margin-top:10px">
    <button class="btn glass" onclick="window.open('${link}','_blank')">Open</button>
    <button class="btn glass" onclick="copyLink()">Copy</button>
  </div>

  <!-- QR -->
  <img 
    src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}"
    style="width:100%;margin-top:10px;border-radius:12px;background:#fff;padding:12px"
  >

  <!-- DOWNLOAD -->
  <button class="btn glass" onclick="downloadQR()">Download QR</button>

</div>
<!-- 🏭 PRODUCTION -->
<div style="margin-top:16px">
  <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">Production</div>

  <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:12px">
    <div style="margin-bottom:6px">
  <b>${formatStatus(u.shippingStatus)}</b>
</div>

${renderProgress(u.shippingStatus)}
  </div>

  ${renderActionButton(u)}
</div>

<!-- 📦 SHIPPING -->
<div style="margin-top:16px">
  <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">Shipping</div>

  <div style="background:rgba(255,255,255,0.05);padding:12px;border-radius:12px;font-size:13px;line-height:1.5">
    ${u.name || ""}<br>
    ${u.phone || ""}<br><br>

    ${u.addressLine1 || ""}<br>
    ${u.addressLine2 || ""}<br>
    ${u.barangay || ""}<br>
    ${u.city || ""}, ${u.province || ""}
  </div>

  <button class="btn glass" onclick="copyAddress()">Copy Address</button>
</div>
<!-- ⚙️ ACTIONS -->
<div style="margin-top:20px">

  <div style="font-size:12px;color:#94a3b8;margin-bottom:6px">Actions</div>

  ${renderLockButton(u)}

<button class="btn glass" onclick="window.open('${link}','_blank')">
  View Card
</button>

  ${u.email ? `
    <button class="btn glass" onclick="emailClient()">
      Email Client
    </button>
  ` : ""}

  <button class="btn primary" onclick="upgradeToPro()">
    Upgrade to Pro
  </button>

</div>
<button class="btn glass" onclick="closeModal()">Close</button>
`;
}

window.closeModal = function(){
  document.getElementById("modal").classList.remove("show");
};

/* ACTION */
window.markPaid = async(id)=>{
  await db.collection("clients").doc(id).update({
    status:"paid",
    shippingStatus:"pending"
  });

const page = selected.plan === "elite" ? "elite.html" :
             selected.plan === "pro" ? "pro.html" : "basic.html";

const link = window.location.origin + "/view/" + page + "?id=" + selected.id;

const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(link)}`;

const a = document.createElement("a");
a.href = url;
a.download = (selected.name || "client") + "-qr.png";
a.click();
    
  closeModal();
};

/* QR */
window.downloadQR = function(){

  if(!selected) return;

  const page = selected.plan === "elite" ? "elite.html" :
               selected.plan === "pro" ? "pro.html" : "basic.html";

  const link = window.location.origin + "/view/" + page + "?id=" + selected.id;

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(link)}`;

  const a = document.createElement("a");
  a.href = url;
  a.download = (selected.name || "client") + "-qr.png";
  a.click();
};

function getNextAction(u){

  // ❗ NOT PAID YET
  if(!u.status || u.status === "pending_verification" || u.status === "pending_payment"){
    return {
      label: "Mark as Paid",
      action: () => markPaid(u.id)
    };
  }

  // 🔥 PRODUCTION FLOW
  const flow = ["pending","printing","encoding","ready","shipped","completed"];
  let current = u.shippingStatus || "pending";

  let index = flow.indexOf(current);

  if(index < flow.length - 1){
    let next = flow[index + 1];

    return {
      label: "Mark as " + capitalize(next),
      action: () => updateShipping(u.id, next)
    };
  }

  return null;
}

async function updateShipping(id, status){

  await db.collection("clients").doc(id).update({
    shippingStatus: status
  });

}

function capitalize(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatusClass(s){
  if(!s) return "pending";
  if(s.includes("pending")) return "pending";
  return s;
}

window.copyAddress = function(){
  if(!selected) return;

  const text = `
${selected.name || ""}
${selected.phone || ""}

${selected.addressLine1 || ""}
${selected.addressLine2 || ""}
${selected.barangay || ""}
${selected.city || ""}, ${selected.province || ""}
`;

  navigator.clipboard.writeText(text);
  alert("Address copied");
};

function formatStatus(s){
  if(!s) return "Pending";

  return s
    .replace(/_/g," ")
    .replace(/\b\w/g,l=>l.toUpperCase());
}

function renderProgress(status){

  const flow = ["pending","printing","encoding","ready","shipped","completed"];
  const labels = {
    pending:"Pending",
    printing:"Printing",
    encoding:"Encoding",
    ready:"Ready",
    shipped:"Shipped",
    completed:"Done"
  };

  let current = status || "pending";
  let index = flow.indexOf(current);

  return `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
      ${flow.slice(1,6).map((step,i)=>{

        const active = flow.indexOf(step) <= index;

        return `
          <div style="
            padding:4px 8px;
            border-radius:999px;
            font-size:10px;
            background:${active ? '#C9A96E' : 'rgba(255,255,255,0.08)'};
            color:${active ? '#000' : '#888'};
          ">
            ${labels[step]}
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function getShippingClass(s){
  if(!s) return "pending";

  if(s === "printing") return "processing";
  if(s === "encoding") return "processing";
  if(s === "ready") return "completed";
  if(s === "shipped") return "completed";

  return "pending";
}

function renderLockButton(u){

  const isLocked = u.locked === true;

  return `
    <button class="btn glass" onclick="toggleLock()">
      ${isLocked ? "Unlock Dashboard" : "Lock Dashboard"}
    </button>
  `;
}

window.toggleLock = async function(){

  if(!selected) return;

  const newState = !(selected.locked === true);

  await db.collection("clients").doc(selected.id).update({
    locked: newState
  });

};

  window.viewDetails = function(){
  
    if(!selected) return;
  
    const page = selected.plan === "elite" ? "elite.html" :
                 selected.plan === "pro" ? "pro.html" : "basic.html";
  
    const link = window.location.origin + "/view/" + page + "?id=" + selected.id;
  
    window.open(link, "_blank");
  };


window.upgradeToPro = async function(){

  if(!selected) return;

  await db.collection("clients").doc(selected.id).update({
    plan: "pro"
  });

  alert("Upgraded to Pro");
};

document.getElementById("search")?.addEventListener("input", () => {
  render();
});

window.copyLink = function(){

  if(!selected) return;

  const page = selected.plan === "elite" ? "elite.html" :
               selected.plan === "pro" ? "pro.html" : "basic.html";

  const link = window.location.origin + "/view/" + page + "?id=" + selected.id;

  navigator.clipboard.writeText(link);
  alert("Link copied");
};

window.emailClient = function(){

  if(!selected?.email) return;

  const page = selected.plan === "elite" ? "elite.html" :
               selected.plan === "pro" ? "pro.html" : "basic.html";

  const link = window.location.origin + "/view/" + page + "?id=" + selected.id;

  const subject = "Your NFC Digital Card";
  const body = `Hi ${selected.name || ""},

Here is your digital card:
${link}

Thank you!`;

  window.location.href = `mailto:${selected.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

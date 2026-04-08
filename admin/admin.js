let users = [];
let filter = "pending_verification";
let selected = null;

const db = firebase.firestore();

/* FETCH */
db.collection("clients").orderBy("createdAt","desc")
.onSnapshot(snap=>{
  users = snap.docs.map(d=>({id:d.id,...d.data()}));
  render();
  stats();
});

/* FILTER */
window.setFilter = function(f,el){
  filter = f;
  document.querySelectorAll(".tabs div").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  render();
}

/* RENDER */
function render(){

  const table = document.getElementById("table");
  table.innerHTML = "";

  let data = users;
  if(filter !== "all") data = users.filter(u=>u.status===filter);

  data.forEach(u=>{

    const tr = document.createElement("tr");

    tr.onclick = ()=>openPanel(u);

    tr.innerHTML = `
<td>
  ${u.paymentProof ? `<img src="${u.paymentProof}" class="thumb">` : `<div class="thumb"></div>`}
</td>

<td>
  ${u.name || "-"} ${u.hasAccount ? "✓" : "○"}
</td>

<td>${u.plan || "-"}</td>

<td>₱${(u.price||0).toLocaleString()}</td>

<td class="status">
  <div class="dot ${u.status}"></div>
  ${u.status}
</td>

<td>${formatDate(u.createdAt)}</td>

<td class="actions" onclick="event.stopPropagation()">
  ${actionIcons(u)}
</td>
`;

    table.appendChild(tr);
  });
}

/* ICONS */
function actionIcons(u){

  if(u.status==="pending_verification"){
    return `
<svg onclick="approve('${u.id}')"><use href="#check"/></svg>
<svg onclick="reject('${u.id}')"><use href="#x"/></svg>
`;
  }

  return "";
}

/* PANEL */
function openPanel(u){

  selected = u;

  const panel = document.getElementById("panel");
  panel.classList.add("open");

  panel.innerHTML = `
<h2>${u.name}</h2>

<div class="section">
<h3>Contact</h3>
<p>${u.email}</p>
<p>${u.phone}</p>
</div>

<div class="section">
<h3>Order</h3>
<p>${u.plan} • ${u.card}</p>
<p>₱${u.price}</p>
</div>

<div class="section">
<h3>Payment</h3>
${u.paymentProof ? `<img src="${u.paymentProof}" class="proof">` : "No proof"}
</div>
`;
}

/* ACTIONS */
window.approve = id => update(id,"paid");
window.reject = id => update(id,"pending_payment");

function update(id,status){
  db.collection("clients").doc(id).update({status});
}

/* STATS */
function stats(){

  document.getElementById("total").innerText = users.length;

  document.getElementById("verify").innerText =
    users.filter(u=>u.status==="pending_verification").length;

  document.getElementById("paid").innerText =
    users.filter(u=>u.status==="paid").length;

  const revenue = users
    .filter(u=>u.status==="paid")
    .reduce((s,u)=>s+(u.price||0),0);

  document.getElementById("revenue").innerText =
    "₱"+revenue.toLocaleString();
}

/* DATE */
function formatDate(d){
  if(!d) return "-";
  return new Date(d.seconds*1000).toLocaleDateString();
}

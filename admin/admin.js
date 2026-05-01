const db = firebase.firestore();

let users = [];
let filter = "all";
let selected = null;

/* FETCH */
db.collection("clients").onSnapshot(s=>{
  users = s.docs.map(d=>({
    id:d.id,
    ...d.data()
  }));
  render();
});

/* FILTER */
window.setFilter = (f,el)=>{
  filter = f;
  document.querySelectorAll(".tabs div").forEach(t=>t.classList.remove("active"));
  el.classList.add("active");
  render();
};

/* RENDER */
function render(){

  const table = document.getElementById("table");
  table.innerHTML = "";

  let data = filter==="all"
    ? users
    : users.filter(u => (u.status || "pending_verification") === filter);

  data.forEach(u=>{

    const row = document.createElement("div");
    row.className = "row data";
    row.onclick = ()=>openModal(u);

    row.innerHTML = `
      <img class="avatar" src="${u.profile || '/logo.png'}">
      <div>${u.name || "-"}</div>
      <div>${u.plan || "-"}</div>
      <div>₱${(u.price||0).toLocaleString()}</div>
      <div>${statusBadge(u.status)}</div>
      <div>${u.shippingStatus || "pending"}</div>
      <div>${format(u.createdAt)}</div>
    `;

    table.appendChild(row);
  });
}

/* STATUS */
function statusBadge(s){
  if(!s) return "";

  return `<span class="status ${s}">${s}</span>`;
}

/* MODAL */
function openModal(u){

  selected = u;

  const modal = document.getElementById("modal");
  const box = document.getElementById("modalBox");

  modal.classList.add("show");

  box.innerHTML = `
    <h3>${u.name}</h3>
    <p>${u.email || ""}</p>

    <p><b>Plan:</b> ${u.plan}</p>
    <p><b>Status:</b> ${u.status}</p>

    ${u.link ? `
      <hr>
      <p>Digital Card</p>
      <input value="${u.link}" style="width:100%">
    ` : ""}

    <button class="btn" onclick="markPaid('${u.id}')">Mark Paid</button>
    <button class="btn" onclick="closeModal()">Close</button>
  `;
}

window.closeModal = function(){
  document.getElementById("modal").classList.remove("show");
};

/* ACTION */
window.markPaid = async(id)=>{
  await db.collection("clients").doc(id).update({
    status:"paid"
  });
  alert("Marked as paid");
  closeModal();
};

/* HELPERS */
function format(d){
  if(!d) return "-";
  if(d.seconds) return new Date(d.seconds*1000).toLocaleDateString();
  return new Date(d).toLocaleDateString();
}

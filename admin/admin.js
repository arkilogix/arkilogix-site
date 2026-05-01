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

  const list = document.getElementById("list");
  list.innerHTML = "";

  let data = filter==="all"
    ? users
    : users.filter(u => (u.status || "pending_verification") === filter);

  data.forEach(u=>{

    const card = document.createElement("div");
    card.className = "card";
    card.onclick = ()=>openModal(u);

    card.innerHTML = `
      <img class="avatar" src="${u.profile || '/logo.png'}">

      <div style="flex:1">
        <div class="name">${u.name || "-"}</div>
        <div class="sub">${u.plan || "-"} • ₱${(u.price||0).toLocaleString()}</div>
      </div>

      <div class="badge ${u.status}">${u.status || "pending"}</div>
    `;

    list.appendChild(card);
  });
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

      <p><b>Digital Card</b></p>

      <input value="${u.link}" style="width:100%;padding:10px;border-radius:10px;border:none">

      <img 
        src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(u.link)}"
        style="width:100%;margin-top:12px;border-radius:10px;background:#fff;padding:10px"
      >

      <button class="btn glass" onclick="downloadQR()">Download QR</button>
    ` : ""}

    <button class="btn primary" onclick="markPaid('${u.id}')">Mark Paid</button>
    <button class="btn glass" onclick="closeModal()">Close</button>
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

/* QR */
window.downloadQR = function(){
  if(!selected || !selected.link) return;

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(selected.link)}`;

  const a = document.createElement("a");
  a.href = url;
  a.download = "qr.png";
  a.click();
};

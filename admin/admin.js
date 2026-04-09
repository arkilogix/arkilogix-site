emailjs.init("Wp1sOcLJH-dg_dkLs");

const db = firebase.firestore();

let users = [];
let filter = "pending_verification";
let selected = null;

/* AUTH GUARD */
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
users = s.docs.map(d=>({id:d.id,...d.data()}));
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

let data = filter==="all" ? users : users.filter(u=>u.status===filter);

if(data.length===0){
table.innerHTML="<tr><td colspan='7'>No orders</td></tr>";
return;
}

data.forEach(u=>{

if(u.isArchived) return;

const tr = document.createElement("tr");
tr.onclick = ()=>openPanel(u);

tr.innerHTML = `
<td>${u.paymentProof ? `<img src="${u.paymentProof}" class="thumb" onclick="event.stopPropagation();preview('${u.paymentProof}')">` : `<div class="thumb"></div>`}</td>
<td>${u.name} ${u.hasAccount ? "✓" : "○"}</td>
<td>${u.plan}</td>
<td>₱${(u.price||0).toLocaleString()}</td>
<td class="status"><div class="dot"></div>${u.status}</td>
<td>${format(u.createdAt)}</td>
<td class="actions" onclick="event.stopPropagation()">${icons(u)}</td>
`;

table.appendChild(tr);

});
}

/* ICONS */
function icons(u){

if(u.status==="pending_verification"){
return `
<svg onclick="approve('${u.id}')"><use href="#check"/></svg>
<svg onclick="reject('${u.id}')"><use href="#x"/></svg>`;
}

if(u.status==="paid"){
return `<svg onclick="processing('${u.id}')"><use href="#gear"/></svg>`;
}

if(u.status==="processing"){
return `<svg onclick="complete('${u.id}')"><use href="#check"/></svg>`;
}

return "";
}

/* ACTIONS */
window.approve = async(id)=>{
await update(id,"paid");
sendEmail(id);
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

/* EMAIL */
async function sendEmail(id){
const u = users.find(x=>x.id===id);
await emailjs.send("service_gxckvp8","template_07td6mf",{
name:u.name,
email:u.email,
plan:u.plan,
price:"₱"+u.price
});
}

/* PANEL */
function openPanel(u){

selected = u;

const p = document.getElementById("panel");
p.classList.add("open");

p.innerHTML = `
<h2>${u.name}</h2>

<p>${u.email}</p>
<p>${u.phone}</p>

<hr>

<p>${u.plan} • ${u.card}</p>
<p>₱${u.price}</p>

<hr>

<p>Status: ${u.status}</p>
<p>Account: ${u.hasAccount ? "Active" : "None"}</p>

${u.paymentProof ? `<img src="${u.paymentProof}" style="width:100%;margin-top:10px;border-radius:8px" onclick="preview('${u.paymentProof}')">` : ""}

<br><br>

${icons(u)}

<br><br>

<div onclick="archive()" style="color:#888;cursor:pointer;font-size:13px">Archive</div>
`;
}

/* MODAL */
window.preview = src=>{
document.getElementById("modalImg").src = src;
document.getElementById("modal").classList.add("show");
}

window.closeModal = ()=>{
document.getElementById("modal").classList.remove("show");
}

/* DATE */
function format(d){
if(!d) return "-";
return new Date(d.seconds*1000).toLocaleDateString();
}

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
table.innerHTML="<tr><td colspan='6'>No orders</td></tr>";
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
<td class="status"><div class="dot"></div>${formatStatus(u.status)}</td>
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

p.innerHTML = `
<div class="close-btn" onclick="closePanel()">✕</div>

<h2>${u.name || "-"}</h2>

<p>${u.email || "-"}</p>
<p>${u.phone || "-"}</p>

<hr>

<p><strong>${u.plan || "-"}</strong> • ${u.card || "-"}</p>
<p>₱${(u.price||0).toLocaleString()}</p>

<hr>

<p>Status: ${formatStatus(u.status)}</p>
<p>Account: ${u.hasAccount ? "Active" : "None"}</p>

<h3 style="margin-top:20px;">Payment</h3>

${u.paymentProof 
? `<img src="${u.paymentProof}" style="width:100%;border-radius:8px;margin-top:10px;cursor:pointer" onclick="preview('${u.paymentProof}')">`
: `<p style="color:#888;">No payment proof uploaded</p>`
}

<br>

${actions(u)}

<br>

<div onclick="archive()" style="color:#888;cursor:pointer;font-size:13px;margin-top:20px">Archive</div>
`;
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

/* PANEL CONTROLS */
window.closePanel = function(){
document.getElementById("panel").classList.remove("open");
}

/* OUTSIDE CLICK */
document.addEventListener("click", function(e){
const panel = document.getElementById("panel");
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
return new Date(d.seconds*1000).toLocaleDateString();
}

function formatStatus(s){
if(!s) return "-";
return s.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase());
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* STATE */
let currentData = {};
let currentDocId = "";
let step = 1;

/* AUTH */
onAuthStateChanged(auth, async (user)=>{
  if(!user) return location.href="/auth/login.html";

  const q = query(collection(db,"clients"), where("uid","==",user.uid));
  const snap = await getDocs(q);

  if(snap.empty) return;

  const docSnap = snap.docs[0];
  currentDocId = docSnap.id;
  currentData = docSnap.data();

  render();
});

/* RENDER */
function render(){
  document.getElementById("userName").innerText=currentData.name||"User";
  document.getElementById("planBadge").innerText=(currentData.plan||"basic").toUpperCase();

  const img=currentData.profile||"/logo.png";
  headerProfile.src=img;
  heroProfile.src=img;

  cardName.innerText=currentData.name||"Name";
  cardPosition.innerText=currentData.position||"Position";

  cardServices.innerHTML="";
  (currentData.services||[]).forEach(s=>{
    const span=document.createElement("span");
    span.innerText=s;
    cardServices.appendChild(span);
  });

  statusText.innerText="Status: "+(currentData.status||"processing");
}

/* VIEW CARD */
window.viewCard=()=>{
  let page="basic.html";
  if(currentData.plan==="pro") page="pro.html";
  if(currentData.plan==="elite") page="elite.html";
  window.open(`/view/${page}?id=${currentDocId}`);
};

/* MODAL */
window.openModal=()=>{
  editModal.style.display="flex";
};

window.nextStep=()=>{
  document.querySelector(`[data-step="${step}"]`).classList.remove("active");
  step++;
  document.querySelector(`[data-step="${step}"]`).classList.add("active");
};

window.prevStep=()=>{
  document.querySelector(`[data-step="${step}"]`).classList.remove("active");
  step--;
  document.querySelector(`[data-step="${step}"]`).classList.add("active");
};

/* SERVICES */
window.addServiceField=()=>{
  const div=document.createElement("div");
  div.innerHTML=`<input>`;
  servicesEdit.appendChild(div);
};

/* SAVE */
async function save(){
  await updateDoc(doc(db,"clients",currentDocId), currentData);
}

/* SHARE */
window.copyLink=()=>{
  navigator.clipboard.writeText(window.location.href);
};

window.downloadVCard=()=>{
  alert("vCard soon");
};

/* CTA */
window.explorePremium=()=>{
  alert("Premium page soon");
};

window.exploreProducts=()=>{
  alert("Pet NFC coming soon");
};

/* LOGOUT */
document.querySelector(".logout").onclick=()=>{
  signOut(auth).then(()=>location.href="/auth/login.html");
};

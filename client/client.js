import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSyCUw-qxeRg8YaihNcJPmJDHL2z6zBE6PK4",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients",
  storageBucket: "arkilogix-clients.firebasestorage.app",
  messagingSenderId: "1074947351840",
  appId: "1:1074947351840:web:b077eb79963fff59316345"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* STATE */
let currentData = {};
let profileImageUrl = "";
let currentStep = 1;
const TOTAL_STEPS = 4;

/* CLOUDINARY */
const CLOUD_NAME = "dnlzwtkhs";
const UPLOAD_PRESET = "arkilogix_profile";

/* HELPER */
const $ = (id) => document.getElementById(id);

/* AUTH */
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/auth/login.html";
    return;
  }
  loadDashboard(user);
});

/* LOAD */
async function loadDashboard(user){
  const snap = await getDoc(doc(db, "clients", user.uid));
  if (!snap.exists()) {
    window.location.href = "/onboarding/index.html";
    return;
  }

  const data = snap.data();
  currentData = data;
  profileImageUrl = data.profileImage || "";

  if($("userName")) $("userName").textContent = data.name || "User";
  if($("planBadge")) $("planBadge").textContent = (data.plan || "basic").toUpperCase();
  if($("headerProfile")) $("headerProfile").src = profileImageUrl || "/logo.png";

  if($("cardName")) $("cardName").textContent = data.name || "Name";
  if($("cardPosition")) $("cardPosition").textContent = data.position || "Position";

  if($("cardServices")){
    $("cardServices").innerHTML = "";
    (data.services || []).forEach(s=>{
      const span = document.createElement("span");
      span.textContent = s;
      $("cardServices").appendChild(span);
    });
  }

  if($("modalImage")) $("modalImage").src = profileImageUrl || "/logo.png";
}

/* =========================
   FIX BUTTONS
========================= */
document.addEventListener("DOMContentLoaded", () => {

  const editBtn = document.querySelector(".actions .btn");
  if(editBtn){
    editBtn.onclick = openModal;
  }

  const profileBtn = document.querySelector(".user-profile");
  if(profileBtn){
    profileBtn.onclick = openModal;
  }

});

/* =========================
   MODAL
========================= */
function openModal(){
  if(!$("editModal")) return;

  $("editModal").style.display = "flex";

  if($("editName")) $("editName").value = currentData.name || "";
  if($("editPosition")) $("editPosition").value = currentData.position || "";

  currentStep = 1;
  showStep(1);

  renderServicesEdit();
}

function closeModal(){
  $("editModal").style.display = "none";
}
window.closeModal = closeModal;

/* =========================
   STEP SYSTEM (FIXED)
========================= */
function showStep(step){

  currentStep = step;

  document.querySelectorAll(".step").forEach(s=>{
    s.style.display = "none";
  });

  const active = document.querySelector(`.step[data-step="${step}"]`);
  if(active){
    active.style.display = "block";
  }

  if($("stepIndicator")){
    $("stepIndicator").innerText = `${step} / ${TOTAL_STEPS}`;
  }

  const titles = {
    1:"Step 1: Identity",
    2:"Step 2: Contacts",
    3:"Step 3: Services",
    4:"Upgrade"
  };

  if($("stepTitle")){
    $("stepTitle").innerText = titles[step];
  }

  if($("nextBtn")){
    $("nextBtn").innerText = step === TOTAL_STEPS ? "Finish" : "Next";
  }
}

function nextStep(){
  if(currentStep < TOTAL_STEPS){
    currentStep++;
    showStep(currentStep);
  } else {
    saveProfile();
  }
}

function prevStep(){
  if(currentStep > 1){
    currentStep--;
    showStep(currentStep);
  }
}

/* =========================
   IMAGE UPLOAD
========================= */
const imageInput = $("imageInput");

if(imageInput){
  imageInput.addEventListener("change", async (e)=>{
    const file = e.target.files[0];
    if(!file) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,{
      method:"POST",
      body:fd
    });

    const data = await res.json();
    profileImageUrl = data.secure_url;

    if($("modalImage")) $("modalImage").src = profileImageUrl;
    if($("headerProfile")) $("headerProfile").src = profileImageUrl;
  });
}

/* =========================
   SERVICES
========================= */
function renderServicesEdit(){
  const container = $("servicesEdit");
  if(!container) return;

  container.innerHTML = "";

  (currentData.services || []).forEach(s=>addServiceField(s));

  if(!currentData.services || currentData.services.length === 0){
    addServiceField();
  }
}

function addServiceField(value=""){
  const container = $("servicesEdit");
  if(!container) return;

  const count = container.querySelectorAll("input").length;
  const plan = currentData.plan || "basic";

  if(plan === "basic" && count >= 3){
    return;
  }

  const div = document.createElement("div");
  div.className = "service-row";

  div.innerHTML = `
    <input value="${value}">
    <button onclick="this.parentElement.remove()">×</button>
  `;

  container.appendChild(div);
}
window.addServiceField = addServiceField;

/* =========================
   SAVE
========================= */
async function saveProfile(){

  const name = $("editName")?.value || "";
  const position = $("editPosition")?.value || "";

  const services = [...document.querySelectorAll("#servicesEdit input")]
    .map(i=>i.value)
    .filter(v=>v);

  await updateDoc(doc(db, "clients", auth.currentUser.uid),{
    name,
    position,
    services,
    profileImage: profileImageUrl
  });

  closeModal();
}

/* =========================
   VIEW
========================= */
function viewCard(){
  const uid = auth.currentUser.uid;
  window.open(`/view/basic.html?id=${uid}`,"_blank");
}
window.nextStep = nextStep;
window.prevStep = prevStep;
window.openModal = openModal;
window.closeModal = closeModal;
window.viewCard = viewCard;

/* =========================
   LOGOUT
========================= */
const logoutBtn = document.querySelector(".logout");
if(logoutBtn){
  logoutBtn.onclick = ()=>{
    signOut(auth).then(()=>{
      window.location.href = "/auth/login.html";
    });
  };
}

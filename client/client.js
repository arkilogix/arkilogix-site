import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCUw-qxeRg8YaihNcJPmJDHL2z6zBE6PK4",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentData = {};
let previousStatus = null;
let currentDocId = "";
let currentUserEmail = "";
let serviceLimit = 4;

/* AUTH */
onAuthStateChanged(auth, async (user)=>{
  if(!user){
    window.location.href="/auth/login.html";
    return;
  }

  currentUserEmail = user.email;

  try{

    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("clientId");

    let data = null;

    // 🔥 1. LOAD USING clientId (PRIMARY)
  if(clientId){
  
    const ref = doc(db, "clients", clientId);
  
    onSnapshot(ref, async (snap)=>{
  
      if(!snap.exists()) return;
  
      const data = snap.data();
      currentDocId = clientId;
  
      // 🔥 AUTO LINK UID IF MISSING
      if(!data.authUid){
        await updateDoc(ref, {
          authUid: user.uid
        });
      }
  
      handleRealtimeUpdate(data);
  
    });
  
    return;
  }

    // 🔥 2. FALLBACK TO UID (OLD METHOD)
    if(!data){
      const q = query(
        collection(db, "clients"),
        where("authUid", "==", user.uid)
      );

      const snap = await getDocs(q);

      if(!snap.empty){
        data = snap.docs[0].data();
        currentDocId = snap.docs[0].id;
      }
    }

    // ❌ STILL NOTHING
   if(!data){
  console.warn("No UID match, forcing clientId link...");

  const params = new URLSearchParams(window.location.search);
  const clientId = params.get("clientId");

  if(clientId){
    const ref = doc(db, "clients", clientId);
    const snap = await getDoc(ref);

    if(snap.exists()){
      data = snap.data();
      currentDocId = clientId;

      // 🔥 LINK CURRENT USER SAFELY
      await updateDoc(ref, {
        authUid: user.uid
      });

      console.log("✅ UID FIXED AUTOMATICALLY");
    }
  }
}

if(!data){
  console.error("Still no client found.");
  return;
}

  } catch(err){
    console.error("Firestore error:", err);
  }
});

/* ACCESS CONTROL */
function checkAccess(){

  const status = (currentData.status || "").toLowerCase();
  const adminLock = currentData.isLocked === true;

  if(adminLock){
    showLocked("🔒 Account Locked", "Please contact support.");
    return true;
  }

  const lockStates = [
    "pending",
    "pending_verification",
    "processing",
    "unpaid"
  ];

if(lockStates.includes(status)){
  applySoftLock(status);
  return false;
}

  hideLock();
  // 🔓 ensure UI fully clean
["views","taps","clicks"].forEach(id=>{
  const el = document.getElementById(id);
  if(el){
    el.style.filter = "none";
    el.style.opacity = "1";
  }
});

["viewCardBtn","shareCardBtn"].forEach(id=>{
  const btn = document.getElementById(id);
  if(btn){
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
  }
});
  return false;
}

function showLocked(title, message){

  let overlay = document.getElementById("lockOverlay");

  if(!overlay){
    overlay = document.createElement("div");
    overlay.id = "lockOverlay";
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="lock-screen">
      <div class="lock-card">
        <div class="lock-logo">ARKILOGIX</div>
        <div class="lock-title">${title}</div>
        <div class="lock-message">${message}</div>
        <div class="lock-loader">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `;

  overlay.style.display = "block";
  overlay.classList.remove("unlocking");
}

function hideLock(){
  const overlay = document.getElementById("lockOverlay");
  if(!overlay) return;

  overlay.classList.add("unlocking");

  setTimeout(()=>{
    overlay.remove();
  }, 400);
}

function applySoftLock(status){

  // remove any fullscreen lock
  const overlay = document.getElementById("lockOverlay");
  if(overlay) overlay.remove();

  // 🔒 blur stats
  ["views","taps","clicks"].forEach(id=>{
    const el = document.getElementById(id);
    if(el){
      el.style.filter = "blur(6px)";
      el.style.opacity = "0.6";
    }
  });

  // 🔒 disable actions
  const buttons = [
    "viewCardBtn",
    "shareCardBtn"
  ];

  buttons.forEach(id=>{
    const btn = document.getElementById(id);
    if(btn){
      btn.style.pointerEvents = "none";
      btn.style.opacity = "0.5";
    }
  });

}

function showPaymentBanner(status){
  return; // 🔥 DISABLED (we use floating button instead)
}

/* RENDER */
function render(){
  console.log("NAME:", currentData.name);
  console.log("POSITION:", currentData.position);
 
  if(!document.getElementById("heroProfile")) return;

  const img = currentData.profile || "/logo.png";

  const hero = document.getElementById("heroProfile");
  if(hero) hero.src = img;

  const headerImg = document.getElementById("headerProfile");
  if(headerImg) headerImg.src = img;

  const nameEl = document.getElementById("cardName");
  const posEl = document.getElementById("cardPosition");
  
  if(nameEl){
    nameEl.innerText = currentData.name || "Your Name";
  }
  
  if(posEl){
    posEl.innerText = currentData.position || "Your Position";
  }

  const viewsEl = document.getElementById("views");
  const tapsEl = document.getElementById("taps");
  const clicksEl = document.getElementById("clicks");

  animateNumberSafe(viewsEl, currentData?.stats?.views || 0);
  animateNumberSafe(tapsEl, currentData?.stats?.taps || 0);
  animateNumberSafe(clicksEl, currentData?.stats?.clicks || 0);

  const status = (currentData.status || "").toLowerCase();
  const chip = document.getElementById("statusChip");

  if(chip){
    chip.className = "status";
    chip.innerText = "";

    if(status === "paid"){
      chip.innerText = "Verified";
      chip.classList.add("verified");
    }

    if(status === "processing" || status === "pending"){
      chip.innerText = "Processing";
      chip.classList.add("processing");
    }
  }

  const planEl = document.getElementById("planBadge");

  if(planEl){
    const plan = (currentData.plan || "basic").toLowerCase();

    let label = "Basic Plan";
    let planClass = "plan-basic";

    if(plan === "pro"){
      label = "Pro Plan";
      planClass = "plan-pro";
    }

    if(plan === "elite"){
      label = "Elite Plan";
      planClass = "plan-elite";
    }

    let statusText = "";
    if(currentData.status === "paid"){
      statusText = "Verified · ";
    }

    planEl.innerText = statusText + label;
    planEl.className = "plan-badge " + planClass;
  }

  const container = document.getElementById("cardServices");
  if(container){
    container.innerHTML = "";

    if(currentData.services){
      const plan = (currentData.plan || "basic").toLowerCase();

      let limit = 4;
      if(plan === "pro") limit = 6;
      if(plan === "elite") limit = 999;

    currentData.services.slice(0, limit).forEach(s=>{
        const span = document.createElement("span");
        span.innerText = s;
        container.appendChild(span);
      });
    }
  }
}

function animateNumberSafe(el, value){
  if(!el) return;

  let start = 0;
  const duration = 400;
  const step = value / (duration / 16);

  const interval = setInterval(()=>{
    start += step;

    if(start >= value){
      el.innerText = value;
      clearInterval(interval);
    } else {
      el.innerText = Math.floor(start);
    }
  },16);
}

/* VIEW CARD */
window.viewCard = function(){
  let page = "basic.html";
  if(currentData.plan==="pro") page="pro.html";
  if(currentData.plan==="elite") page="elite.html";

  window.open(`/view/${page}?id=${currentDocId}`);
}

/* SHARE */
window.shareCard = function(){
  let page = "basic.html";
  if(currentData.plan==="pro") page="pro.html";
  if(currentData.plan==="elite") page="elite.html";

  const url = `${window.location.origin}/view/${page}?id=${currentDocId}`;

  if(navigator.share){
    navigator.share({title:"My Card",url});
  }else{
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  }
}

/* PASSWORD RESET */
window.resetPassword = function(){
  if(!currentUserEmail){
    alert("No email found.");
    return;
  }

  sendPasswordResetEmail(auth, currentUserEmail)
    .then(()=> alert("Password reset email sent."))
    .catch(()=> alert("Error sending email."));
}

/* UPGRADE */
window.upgradeToPro = function(){

  if(!confirm("Upgrade to Pro? You will send a request via email.")) return;

  const name = currentData?.name || "Client";
  const email = currentData?.email || "";

  const subject = encodeURIComponent("Upgrade to Pro Request");
  const body = encodeURIComponent(
`Hello ArkiLogix,

I would like to upgrade my card to Pro.

Name: ${name}
Email: ${email}

Please assist me with the upgrade.

Thank you.`
  );

  window.location.href =
    `mailto:info@arkilogix.com?subject=${subject}&body=${body}`;
};



function handleRealtimeUpdate(data){

  // 🔥 FIRST LOAD
  if(previousStatus === null){
    previousStatus = data.status;
    currentData = data;
    setupActivateButton();
    const locked = checkAccess();

    if(!locked){
      render();
    }

    return; // ✅ STOP HERE on first load
  }

  // 🔥 STATUS CHANGE DETECTED
  if(previousStatus !== data.status){

    if(data.status === "paid"){
      smoothUnlock();
    }

  }

  previousStatus = data.status;

  currentData = data;
  setupActivateButton();
  const locked = checkAccess();

  if(!locked){
    render();
  }
}

function smoothUnlock(){

  // 🔓 remove blur smoothly
  ["views","taps","clicks"].forEach(id=>{
    const el = document.getElementById(id);
    if(el){
      el.style.transition = "0.5s ease";
      el.style.filter = "blur(0px)";
      el.style.opacity = "1";
    }
  });

  // 🔓 enable buttons smoothly
  ["viewCardBtn","shareCardBtn"].forEach(id=>{
    const btn = document.getElementById(id);
    if(btn){
      btn.style.transition = "0.3s ease";
      btn.style.pointerEvents = "auto";
      btn.style.opacity = "1";
    }
  });

  // 🔓 remove banner
  const banner = document.getElementById("paymentBanner");
  if(banner){
    banner.style.transition = "0.4s ease";
    banner.style.opacity = "0";
    setTimeout(()=> banner.remove(), 400);
  }

  // 🔓 subtle message (optional clean)
  const msg = document.createElement("div");
  msg.innerText = "Card Activated";
  msg.style = `
    position:fixed;
    bottom:20px;
    left:50%;
    transform:translateX(-50%);
    background:#111;
    color:#fff;
    padding:10px 20px;
    border-radius:20px;
    font-size:13px;
    opacity:0;
    transition:0.4s;
  `;

  document.body.appendChild(msg);

  setTimeout(()=> msg.style.opacity = "1", 50);
  setTimeout(()=>{
    msg.style.opacity = "0";
    setTimeout(()=> msg.remove(), 400);
  }, 2000);
}
function setupActivateButton(){

  const btn = document.getElementById("activateBtn");
  if(!btn || !currentData) return;

  // 🔴 UNPAID
  if(currentData.status === "unpaid"){

    btn.classList.add("show");
    btn.classList.remove("pending");

    btn.innerText = "Activate My Card";
    btn.style.pointerEvents = "auto";

    btn.onclick = () => {
      window.location.href =
        "/payment.html?clientId=" + currentDocId;
    };
  }

  // 🟡 PENDING
  else if(currentData.status === "pending_verification"){

    btn.classList.add("show");
    btn.classList.add("pending");

    btn.innerText = "Verifying Payment...";
    btn.style.pointerEvents = "none";
  }

  // 🟢 PAID
  else{
    btn.classList.remove("show");
  }
}



window.editProfile = function(){

  document.getElementById("editName").value = currentData.name || "";
  document.getElementById("editPosition").value = currentData.position || "";
  document.getElementById("editCompany").value = currentData.company || "";
  document.getElementById("editPhone").value = currentData.phone || "";
  document.getElementById("editEmail").value = currentData.email || "";

  const container = document.getElementById("servicesContainer");
  container.innerHTML = "";

  // 🔥 PLAN LIMIT
  if(currentData.plan === "basic") serviceLimit = 4;
  else if(currentData.plan === "pro") serviceLimit = 6;
  else serviceLimit = 999;

  const services = currentData.services || [];

  // load services
  services.forEach(s => createServiceField(s));

  // 🔥 if empty, add one field
  if(services.length === 0){
    createServiceField();
  }

  document.getElementById("editModal").style.display = "flex";
};

window.closeEdit = function(){
  document.getElementById("editModal").style.display = "none";
};

window.saveEdit = async function(){

  const ref = doc(db, "clients", currentDocId);

  let profileUrl = currentData.profile || "";

  const file = document.getElementById("editProfilePhoto").files[0];

  // 🔥 upload new image if selected
  if(file){
    profileUrl = await uploadEditImage(file);
  }

  const serviceInputs = document.querySelectorAll("#servicesContainer input");
  
  const services = Array.from(serviceInputs)
    .map(i => i.value.trim())
    .filter(v => v);

  await updateDoc(ref, {
    name: document.getElementById("editName").value,
    position: document.getElementById("editPosition").value,
    company: document.getElementById("editCompany").value,
    phone: document.getElementById("editPhone").value,
    email: document.getElementById("editEmail").value,
    profile: profileUrl,
    services: services
  });

  closeEdit();
};

async function uploadEditImage(file){

  if(!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "nfc_upload");

  // 🔥 KEEP SAME STRUCTURE
  formData.append("folder", `nfc-clients/${currentDocId}/profile`);
  formData.append("public_id", `profile_${Date.now()}`);

  const res = await fetch("https://api.cloudinary.com/v1_1/dnlzwtkhs/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

function createServiceField(value = ""){

  const container = document.getElementById("servicesContainer");

  const row = document.createElement("div");
  row.className = "service-row";

  const input = document.createElement("input");
  input.value = value;
  input.placeholder = "Service";

  const remove = document.createElement("button");
  remove.innerText = "×";
  remove.className = "remove-btn";

  remove.onclick = () => row.remove();

  row.appendChild(input);
  row.appendChild(remove);

  container.appendChild(row);
}

window.addServiceField = function(){

  const container = document.getElementById("servicesContainer");
  const msg = document.getElementById("serviceLimitMsg");

  const currentCount = container.children.length;

  if(currentCount >= serviceLimit){

    // 🔥 MESSAGE
    if(currentData.plan === "basic"){
      msg.innerHTML = `Limit reached. <a href="#" onclick="upgradeToPro()">Upgrade to Pro</a>`;
    } else if(currentData.plan === "pro"){
      msg.innerHTML = `Limit reached. <a href="#" onclick="upgradeToPro()">Upgrade to Elite</a>`;
    } else {
      msg.innerHTML = "";
    }

    // 🔥 ANIMATION TRIGGER
    msg.classList.remove("limit-msg");
    void msg.offsetWidth;
    msg.classList.add("limit-msg");

    container.classList.remove("limit-hit","limit-glow");
    void container.offsetWidth;
    container.classList.add("limit-hit","limit-glow");

    return;
  }

  // ✅ CLEAR MESSAGE
  msg.innerHTML = "";
  container.classList.remove("limit-glow");

  createServiceField();
};
/* LOGOUT */
window.logout = function(){
  signOut(auth).then(()=>{
    window.location.href="/auth/login.html";
  });
}

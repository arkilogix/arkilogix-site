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
let autoSaveInterval = null;
let hasUnsavedChanges = false;

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
    const lockScreen = document.getElementById("lockScreen");
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
    if(currentData.status === "pending_verification"){
      lockScreen.style.display = "flex";
    } else {
      lockScreen.style.display = "none";
    }

    planEl.innerText = statusText + label;
    planEl.className = "plan-badge " + planClass;
  }

  const lockScreen = document.getElementById("lockScreen");
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
    setupFeatureLocks();
    const locked = checkAccess();

    if(!locked){
      render();
    }
    hideLoader();
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
  setupFeatureLocks(); // 🔥 ADD THIS
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
  ["viewBtn","shareBtn"].forEach(id=>{
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

  if(currentData.status === "unpaid"){

    btn.style.display = "block";
    btn.innerText = "Activate My Card";

    btn.onclick = () => {
      window.location.href =
        "/payment.html?clientId=" + currentDocId;
    };

  }

  else if(currentData.status === "pending_verification"){

    btn.style.display = "block";
    btn.innerText = "Verifying Payment...";
    btn.style.opacity = "0.6";
    btn.style.pointerEvents = "none";

  }

  else{
    btn.style.display = "none";
  }
}



window.editProfile = function(){
    if(currentData.status !== "paid"){
      alert("Please activate your card first.");
      return;
    }
    const nameInput = document.getElementById("editName");
    if(nameInput) nameInput.value = currentData.name || "";
    
    const positionInput = document.getElementById("editPosition");
    if(positionInput) positionInput.value = currentData.position || "";
    
    const companyInput = document.getElementById("editCompany");
    if(companyInput) companyInput.value = currentData.company || "";
  
    const phoneInput = document.getElementById("editPhone");
    if(phoneInput) phoneInput.value = currentData.phone || "";
    
    const emailInput = document.getElementById("editEmail");
    if(emailInput) emailInput.value = currentData.email || "";

    const fbInput = document.getElementById("editFacebook");
    if(fbInput) fbInput.value = currentData.facebook || "";
    
    const igInput = document.getElementById("editInstagram");
    if(igInput) igInput.value = currentData.instagram || "";
    
    const webInput = document.getElementById("editWebsite");
    if(webInput) webInput.value = currentData.website || "";
  
    const container = document.getElementById("servicesContainer");
    container.innerHTML = "";

  // 🔥 LOCK LOGIC (CLEAN)
  const locked = document.querySelector(".locked-wrapper");
  const inputs = locked ? locked.querySelectorAll("input") : [];

  if(currentData.plan === "basic"){
    locked.style.opacity = "0.5";
    inputs.forEach(i => i.disabled = true);
  } else {
    locked.style.opacity = "1";
    inputs.forEach(i => i.disabled = false);
  }

  // 🔥 PLAN LIMIT
  if(currentData.plan === "basic") serviceLimit = 4;
  else if(currentData.plan === "pro") serviceLimit = 6;
  else serviceLimit = 999;

  const services = currentData.services || [];

  services.forEach(s => createServiceField(s));

  if(services.length === 0){
    createServiceField();
  }

  document.getElementById("editModal").style.display = "flex";
  showStep(1);
  const photoInput = document.getElementById("editProfilePhoto");

if(photoInput){
  photoInput.onchange = function(e){

    const file = e.target.files[0];
    if(!file) return;

    const preview = document.getElementById("profilePreview");

    if(preview){
      preview.src = URL.createObjectURL(file);
      preview.style.display = "block";
    }
  };
}
  clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(autoSaveEdit, 30000);
};

window.closeEdit = function(){

  if(hasUnsavedChanges){
    const confirmClose = confirm("You have unsaved changes. Exit anyway?");
    if(!confirmClose) return;
  }

  const modal = document.getElementById("editModal");

  modal.classList.add("modal-closing");

  setTimeout(()=>{
    modal.style.display = "none";
    modal.classList.remove("modal-closing");
    clearInterval(autoSaveInterval);
    hasUnsavedChanges = false;
  }, 200);

};

window.saveEdit = async function(){

  const ref = doc(db, "clients", currentDocId);

  let profileUrl = currentData.profile || "";

  const file = document.getElementById("editProfilePhoto").files[0];

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
    
      phone: document.getElementById("editPhone")?.value || "",
      email: document.getElementById("editEmail")?.value || "",
      facebook: document.getElementById("editFacebook")?.value || "",
      instagram: document.getElementById("editInstagram")?.value || "",
      website: document.getElementById("editWebsite")?.value || "",
    
      services: services
    });

  hasUnsavedChanges = false;

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
  const box = document.getElementById("servicesContainer");
    if(box){
      box.classList.add("shake");
      setTimeout(()=> box.classList.remove("shake"), 300);
    }
  
    const overlay = document.getElementById("serviceLockOverlay");
    if(overlay){
      overlay.classList.add("show");
      setTimeout(()=>{
        overlay.classList.remove("show");
      }, 2000);
    }
  
    return;
  }

  // ✅ CLEAR MESSAGE
  msg.innerHTML = "";
  container.classList.remove("limit-glow");

  createServiceField();
};

let currentStep = 1;

console.log("STEP:", step);
console.log(document.getElementById("step"+step));

function showStep(step){


  document.querySelectorAll(".edit-step").forEach(s=>{
    s.classList.remove("active");
  });

  document.getElementById("step"+step).classList.add("active");

    const nextBtn = document.querySelector(".edit-nav .primary");
    
    if(nextBtn){
      if(step === 4){
        nextBtn.innerText = "Confirm";
      } else {
        nextBtn.innerText = "Next";
      }
    }

  // PROGRESS
  const progress = (step / 5) * 100;
  document.getElementById("stepProgressFill").style.width = progress + "%";

  // LABEL
  document.getElementById("stepLabel").innerText = `Step ${step} of 5`;

  // FINAL STEP
  if(step === 5){
    document.querySelector(".edit-nav").style.display = "none";
    document.getElementById("finalActions").style.display = "flex";
  } else {
    document.querySelector(".edit-nav").style.display = "flex";
    document.getElementById("finalActions").style.display = "none";
  }

  // 🔥 CONFIRM DATA
  if(step === 5){

    const name = document.getElementById("editName")?.value || "-";
    const position = document.getElementById("editPosition")?.value || "-";
    const company = document.getElementById("editCompany")?.value || "-";

    const services = document.querySelectorAll("#servicesContainer input");
    const count = Array.from(services).filter(i => i.value.trim()).length;

    document.getElementById("confirmName").innerText = name;
    document.getElementById("confirmPosition").innerText = position;
    document.getElementById("confirmCompany").innerText = company;
    document.getElementById("confirmServices").innerText = count + " items";
  }

  currentStep = step;
}

window.nextEditStep = function(){
  if(currentStep < 5){
    showStep(currentStep + 1);
  }
}

window.prevEditStep = function(){
  if(currentStep > 1){
    showStep(currentStep - 1);
  }
}

async function autoSaveEdit(){

  if(!currentDocId) return;

  try{

    const ref = doc(db, "clients", currentDocId);

    const serviceInputs = document.querySelectorAll("#servicesContainer input");

    const services = Array.from(serviceInputs)
      .map(i => i.value.trim())
      .filter(v => v);

    await updateDoc(ref, {
      name: document.getElementById("editName").value,
      position: document.getElementById("editPosition").value,
      company: document.getElementById("editCompany").value,
    
      phone: document.getElementById("editPhone")?.value || "",
      email: document.getElementById("editEmail")?.value || "",
      facebook: document.getElementById("editFacebook")?.value || "",
      instagram: document.getElementById("editInstagram")?.value || "",
      website: document.getElementById("editWebsite")?.value || "",
    
      profile: profileUrl,
      services: services
    });

    console.log("Auto-saved");

    const indicator = document.getElementById("saveIndicator");

    indicator.innerText = "Saving...";
    setTimeout(()=>{
      indicator.innerText = "Saved ✓";
    }, 500);
  
  hasUnsavedChanges = false;
  
  // fade out after 2 sec
  setTimeout(()=>{
    indicator.innerText = "";
  }, 2000);
  } catch(err){
    console.log("Auto-save failed", err);
  }
}

document.addEventListener("keydown", function(e){
  // ESC key
  if(e.key === "Escape"){
    const modal = document.getElementById("editModal");
    // only close if modal is open
    if(modal && modal.style.display === "flex"){
      closeEdit();
    }
  }
});

window.handleEditOutsideClick = function(e){
  const box = document.querySelector(".edit-box");
  // if click is outside modal box
  if(!box.contains(e.target)){
    closeEdit();
  }

};

document.addEventListener("input", function(e){
  const modal = document.getElementById("editModal");
  if(modal.style.display === "flex" && modal.contains(e.target)){
    hasUnsavedChanges = true;
  }

});

function setupFeatureLocks(){

  if(!currentData) return;

  const isLocked = currentData.status !== "paid";

  const viewBtn = document.getElementById("viewBtn");
  const editBtn = document.getElementById("editBtn");
  const shareBtn = document.getElementById("shareBtn");

  const overlay = document.getElementById("cardLockOverlay");
  const card = document.querySelector(".card");

  if(isLocked){

    // 🔒 overlay + blur
    if(overlay) overlay.style.display = "flex";
    if(card) card.classList.add("locked");

    // 🔒 buttons → redirect to payment
    [viewBtn, editBtn, shareBtn].forEach(btn=>{
      if(!btn) return;

      btn.classList.add("locked");

      btn.onclick = () => {
        window.location.href = "/payment.html?clientId=" + currentDocId;
      };
    });

    if(viewBtn) viewBtn.innerText = "Activate to View";
    if(editBtn) editBtn.innerText = "Activate to Edit";
    if(shareBtn) shareBtn.innerText = "Activate to Share";

  } else {

    // ✅ remove overlay
    if(overlay) overlay.style.display = "none";
    if(card) card.classList.remove("locked");

    // ✅ restore normal buttons
    if(viewBtn){
      viewBtn.classList.remove("locked");
      viewBtn.innerText = "View My Card";
      viewBtn.onclick = viewCard;
    }

    if(editBtn){
      editBtn.classList.remove("locked");
      editBtn.innerText = "Edit Profile";
      editBtn.onclick = editProfile;
    }

    if(shareBtn){
      shareBtn.classList.remove("locked");
      shareBtn.innerText = "Share";
      shareBtn.onclick = shareCard;
    }
  }
}

function hideLoader(){

  const loader = document.getElementById("appLoader");
  if(!loader) return;

  setTimeout(()=>{
    loader.classList.add("hide");

    setTimeout(()=>{
      loader.remove();
    }, 500);

  }, 300); // small delay for smooth feel
}

/* LOGOUT */
window.logout = function(){
  signOut(auth).then(()=>{
    window.location.href="/auth/login.html";
  });
}

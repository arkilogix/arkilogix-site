const db = firebase.firestore();
const auth = firebase.auth();

let currentData = {};
let currentDocId = "";
let isSaving = false;
let isLocked = true;

/* AUTH */
auth.onAuthStateChanged(async (user)=>{
  if(!user){
    window.location.href="/auth/login.html";
    return;
  }

  const snap = await db.collection("clients")
    .where("authUid","==",user.uid).get();

  if(!snap.empty){
    currentData = snap.docs[0].data();
    currentDocId = snap.docs[0].id;
  }

  render();
  checkAccess();
});

/* ACCESS */
function checkAccess(){
  const status = currentData.status || "processing";
  isLocked = !(status==="paid" || status==="completed");

  document.getElementById("statusChip").innerText = status.toUpperCase();
}

/* RENDER */
function render(){
  document.getElementById("userName").innerText = currentData.name || "User";
  document.getElementById("planBadge").innerText = (currentData.plan||"basic").toUpperCase();

  const img = currentData.profile || "/logo.png";
  document.getElementById("heroProfile").src = img;
  document.getElementById("headerProfile").src = img;

  document.getElementById("cardName").innerText = currentData.name || "Name";
  document.getElementById("cardPosition").innerText = currentData.position || "Position";

  const services = document.getElementById("cardServices");
  services.innerHTML = "";

  (currentData.services||[]).forEach(s=>{
    const span=document.createElement("span");
    span.innerText=s;
    services.appendChild(span);
  });

  document.getElementById("editCount").innerText = currentData.editCount || 0;
}

/* GUARD */
function guard(){
  if(isLocked){
    alert("Account under review.");
    return true;
  }
  return false;
}

/* OPEN EDIT */
window.openModal=()=>{
  if(guard()) return;

  if((currentData.editCount||0)>=2 && !currentData.editUnlocked){
    openUpgradeModal();
    return;
  }

  document.getElementById("editModal").style.display="flex";

  editName.value=currentData.name||"";
  editPosition.value=currentData.position||"";
};

/* SAVE */
async function saveProfile(){
  if(isSaving) return;
  isSaving=true;

  currentData.name=editName.value;
  currentData.position=editPosition.value;
  currentData.editCount=(currentData.editCount||0)+1;

  await db.collection("clients").doc(currentDocId).update(currentData);

  render();
  closeModal();
  isSaving=false;
}

/* MODALS */
function closeModal(){
  document.getElementById("editModal").style.display="none";
}

function openUpgradeModal(){
  document.getElementById("upgradeModal").style.display="flex";
}

function closeUpgradeModal(){
  document.getElementById("upgradeModal").style.display="none";
}

/* UNLOCK */
async function processUnlock(){
  await db.collection("clients").doc(currentDocId).update({
    editUnlocked:true
  });

  currentData.editUnlocked=true;

  closeUpgradeModal();
  alert("Unlocked!");
}

/* LOGOUT */
document.querySelector(".logout").onclick=()=>{
  auth.signOut().then(()=>{
    window.location.href="/auth/login.html";
  });
};

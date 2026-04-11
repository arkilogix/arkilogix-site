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
  const upgradeBtn = document.querySelector(".btn.upgrade");
  
  if(currentData.editUnlocked){
    upgradeBtn.innerText = "Unlocked ✓";
    upgradeBtn.disabled = true;
  }
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
  isSaving = true;

  const btn = document.querySelector("#editModal .primary");
  btn.innerText = "Saving...";
  btn.disabled = true;

  try{

    currentData.name = editName.value;
    currentData.position = editPosition.value;
    currentData.editCount = (currentData.editCount || 0) + 1;

    await db.collection("clients").doc(currentDocId).update(currentData);

    render();
    closeModal();

  }catch(err){
    alert("Save failed");
  }

  btn.innerText = "Save";
  btn.disabled = false;
  isSaving = false;
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

function checkAccess(){

  const status = currentData.status || "processing";
  const chip = document.getElementById("statusChip");

  chip.innerText = status.toUpperCase();

  if(status === "paid" || status === "completed"){
    chip.style.background = "#e6f7ec";
    chip.style.color = "#1a7f37";
    isLocked = false;
  } else {
    chip.style.background = "#f3f3f3";
    chip.style.color = "#555";
    isLocked = true;
  }
}

/* LOGOUT */
document.querySelector(".logout").onclick=()=>{
  auth.signOut().then(()=>{
    window.location.href="/auth/login.html";
  });
};

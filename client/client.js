const db = firebase.firestore();
const auth = firebase.auth();

let currentData = {};
let currentDocId = "";
let step = 1;
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

  if(status !== "paid" && status !== "completed"){
    document.getElementById("lockScreen").style.display="flex";
    isLocked = true;
  } else {
    document.getElementById("lockScreen").style.display="none";
    isLocked = false;
  }
}

/* RENDER */
function render(){

  const img = currentData.profile || "/logo.png";

  document.getElementById("heroProfile").src = img;
  document.getElementById("headerProfile").src = img;

  document.getElementById("cardName").innerText = currentData.name || "Your Name";
  document.getElementById("cardPosition").innerText = currentData.position || "Your Position";

  // STATUS
  const status = currentData.status || "processing";
  const chip = document.getElementById("statusChip");

  chip.innerText = status.toUpperCase();

  chip.className = "status " + status;

  // SERVICES
  const container = document.getElementById("cardServices");
  container.innerHTML = "";

  if(currentData.services && currentData.services.length){
    currentData.services.slice(0,3).forEach(s=>{
      const span = document.createElement("span");
      span.innerText = s;
      container.appendChild(span);
    });
  }
}

/* VIEW */
function viewCard(){
  let page = "basic.html";
  if(currentData.plan==="pro") page="pro.html";
  if(currentData.plan==="elite") page="elite.html";

  window.open(`/view/${page}?id=${currentDocId}`);
}

/* SHARE */
function shareCard(){
  const url = `${window.location.origin}/view/basic.html?id=${currentDocId}`;

  if(navigator.share){
    navigator.share({title:"My Card",url});
  }else{
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  }
}

/* UPGRADE */
function upgradeToPro(){
  const subject = "Upgrade to Pro Request";
  const body = `Hello, I want to upgrade.\n\nName: ${currentData.name}\nCurrent Plan: ${currentData.plan}`;

  window.location.href = `mailto:info@arkilogix.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* OFFERS */
function viewOffers(){
  alert("Coming soon.");
}

/* STEP SYSTEM */
function updateStepUI(){
  const titles = {1:"Identity",2:"Contacts",3:"Services"};
  stepTitle.innerText = titles[step];

  document.querySelectorAll(".step").forEach(s=>s.classList.remove("active"));
  document.querySelector(`[data-step="${step}"]`).classList.add("active");
}

function nextStep(){
  if(step<3){step++;updateStepUI();}
  else saveProfile();
}

function prevStep(){
  if(step>1){step--;updateStepUI();}
}

/* SAVE */
async function saveProfile(){
  currentData.name = editName.value;
  currentData.position = editPosition.value;

  await db.collection("clients").doc(currentDocId).update(currentData);
  render();
  editModal.style.display="none";
}

/* SERVICES */
function addService(){
  const container = servicesContainer;
  const input = document.createElement("input");
  input.placeholder="Service";
  container.appendChild(input);
}

/* LOGOUT */
document.querySelector(".logout").onclick=()=>{
  auth.signOut().then(()=>{
    window.location.href="/auth/login.html";
  });
};

const db = firebase.firestore();
const auth = firebase.auth();

let currentData = {};
let currentDocId = "";
let isLocked = true;

/* AUTH */
auth.onAuthStateChanged(async (user)=>{
  if(!user){
    window.location.href="/auth/login.html";
    return;
  }

  // RESET PASSWORD NEEDS EMAIL
 db.collection("clients")
  .where("authUid","==",user.uid)
  .onSnapshot(snap => {

    if(!snap.empty){
      currentData = snap.docs[0].data();
      currentDocId = snap.docs[0].id;

      console.log("STATUS:", currentData.status); // debug

      render();
      checkAccess();
    }

  });
});

/* ACCESS CONTROL */
function checkAccess(){

  const status = (currentData.status || "").toLowerCase();

  const lock = document.getElementById("lockScreen");

  if(status !== "paid" && status !== "completed"){
    lock.style.display="flex";
    isLocked = true;
  } else {
    lock.style.display="none";
    isLocked = false;
  }

  document.querySelectorAll(".btn").forEach(btn=>{
    btn.style.pointerEvents = isLocked ? "none" : "auto";
    btn.style.opacity = isLocked ? "0.5" : "1";
  });
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

  if(currentData.services){
    currentData.services.slice(0,3).forEach(s=>{
      const span = document.createElement("span");
      span.innerText = s;
      container.appendChild(span);
    });
  }
}

/* VIEW CARD */
function viewCard(){
  let page = "basic.html";
  if(currentData.plan==="pro") page="pro.html";
  if(currentData.plan==="elite") page="elite.html";

  window.open(`/view/${page}?id=${currentDocId}`);
}

/* SHARE */
function shareCard(){
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
function resetPassword(){
  if(!window.currentUserEmail){
    alert("No email found.");
    return;
  }

  auth.sendPasswordResetEmail(window.currentUserEmail)
    .then(()=>{
      alert("Password reset email sent.");
    })
    .catch(()=>{
      alert("Error sending email.");
    });
}

/* UPGRADE */
function upgradeToPro(){
  const subject = "Upgrade to Pro Request";
  const body = `Name: ${currentData.name}\nPlan: ${currentData.plan}`;

  window.location.href = `mailto:info@arkilogix.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/* LOGOUT */
function logout(){
  auth.signOut().then(()=>{
    window.location.href="/auth/login.html";
  });
}

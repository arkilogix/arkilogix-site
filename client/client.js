/* ================= FIREBASE (COMPAT MODE) ================= */
const db = firebase.firestore();
const auth = firebase.auth();

/* ================= STATE ================= */
let currentData = {};
let currentDocId = "";
let step = 1;
let isSaving = false;
let isLocked = true;
let wasLocked = null;

/* ================= AUTH (NO LOOP FIX) ================= */
let authChecked = false;

auth.onAuthStateChanged(async (user) => {

  if (!authChecked) {
    authChecked = true;

    if (!user) {
      console.log("No user → redirect login");
      window.location.href = "/auth/login.html";
      return;
    }

    console.log("User OK:", user.uid);

    try {

      const snap = await db.collection("clients")
        .where("authUid", "==", user.uid)
        .get();

      if (!snap.empty) {

        const docSnap = snap.docs[0];
        currentData = docSnap.data();
        currentDocId = docSnap.id;
      
      } else {
      
        console.warn("No authUid match → trying email match");
      
        const emailSnap = await db.collection("clients")
          .where("email","==",user.email)
          .get();
      
        if (!emailSnap.empty) {
      
          const docSnap = emailSnap.docs[0];
          currentData = docSnap.data();
          currentDocId = docSnap.id;
      
          // 🔥 LINK ACCOUNT (CRITICAL)
          await db.collection("clients").doc(currentDocId).update({
            authUid: user.uid,
            hasAccount: true
          });
      
        } else {
      
          console.error("No matching record found");
          alert("No order found. Please contact admin.");
          return;
      
        }
      }

      render();
      checkAccess();

    } catch (err) {
      console.error("LOAD ERROR:", err);
    }
  }

});

/* ================= ACCESS CONTROL ================= */

function checkAccess(){
  const status = currentData.status || "processing";
  const nowUnlocked = (status === "paid" || status === "completed");

  if(wasLocked === null){
    wasLocked = !nowUnlocked;
  }

  if(nowUnlocked){
    isLocked = false;
    deactivateLockScreen();
    wasLocked = false;
  } else {
    isLocked = true;
    activateLockScreen();
    wasLocked = true;
  }
}

function activateLockScreen(){
  const lock = document.getElementById("lockScreen");
  if(lock) lock.style.display = "flex";
}

function deactivateLockScreen(){
  const lock = document.getElementById("lockScreen");
  if(lock) lock.style.display = "none";
}

/* ================= RENDER ================= */

function render(){
  document.getElementById("userName").innerText = currentData.name || "User";
  document.getElementById("planBadge").innerText = (currentData.plan || "basic").toUpperCase();

  const img = currentData.profile || "/logo.png";
  document.getElementById("headerProfile").src = img;
  document.getElementById("heroProfile").src = img;

  document.getElementById("cardName").innerText = currentData.name || "Name";
  document.getElementById("cardPosition").innerText = currentData.position || "Position";

  const servicesContainer = document.getElementById("cardServices");
  servicesContainer.innerHTML = "";

  (currentData.services || []).forEach(s=>{
    const span = document.createElement("span");
    span.innerText = s;
    servicesContainer.appendChild(span);
  });

  document.getElementById("statusText").innerText =
    "Status: " + (currentData.status || "processing");
}

/* ================= GUARD ================= */

function guard(){
  if(isLocked){
    alert("Your account is still under review.");
    return true;
  }
  return false;
}

/* ================= VIEW ================= */

window.viewCard = ()=>{
  if(guard()) return;

  let page = "basic.html";
  if(currentData.plan === "pro") page = "pro.html";
  if(currentData.plan === "elite") page = "elite.html";

  window.open(`/view/${page}?id=${currentDocId}`);
};

/* ================= MODAL ================= */

window.openModal = ()=>{
  if(guard()) return;

  document.getElementById("editModal").style.display = "flex";

  document.getElementById("editName").value = currentData.name || "";
  document.getElementById("editPosition").value = currentData.position || "";
};

function closeModal(){
  document.getElementById("editModal").style.display = "none";
}
/* ================= SAVE ================= */
async function saveProfile(){

  if(guard()) return;
  if(isSaving) return;

  // 🔥 CHECK EDIT LIMIT
  const editCount = currentData.editCount || 0;

  if(editCount >= 2 && !currentData.editUnlocked){
    alert("Edit limit reached. Please upgrade to continue editing.");
    return;
  }

  isSaving = true;

  try{

    const name = document.getElementById("editName").value.trim();
    const position = document.getElementById("editPosition").value.trim();
    const phone = document.getElementById("contactPhone")?.value.trim();
    const email = document.getElementById("contactEmail")?.value.trim();

    if(name) currentData.name = name;
    if(position) currentData.position = position;
    if(phone) currentData.phone = phone;
    if(email) currentData.email = email;

    // 🔥 INCREMENT EDIT COUNT
    currentData.editCount = (currentData.editCount || 0) + 1;

    await db.collection("clients").doc(currentDocId).update(currentData);

    render();
    closeModal();

    // 🔥 UX FEEDBACK
    if(currentData.editCount >= 2){
      setTimeout(()=>{
        alert("You've used your free edits. Next edits will require upgrade.");
      },300);
    }

  }catch(err){
    console.error(err);
    alert("Save failed");
  }

  isSaving = false;
}


/* ================= LOGOUT ================= */

document.querySelector(".logout").onclick = ()=>{
  auth.signOut().then(()=>{
    window.location.href = "/auth/login.html";
  });
};

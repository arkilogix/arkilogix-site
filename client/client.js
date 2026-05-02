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

    if(clientId){
      const ref = doc(db, "clients", clientId);

      onSnapshot(ref, async (snap)=>{
        if(!snap.exists()) return;

        const data = snap.data();
        currentDocId = clientId;

        if(!data.authUid){
          await updateDoc(ref, { authUid: user.uid });
        }

        handleRealtimeUpdate(data);
      });

      return;
    }

    if(!data){
      const q = query(
        collection(db, "clients"),
        where("authUid", "==", user.uid)
      );

      const snap = await getDocs(q);

      if(!snap.empty){
        data = snap.docs[0].data();
        currentDocId = snap.docs[0].id;
        handleRealtimeUpdate(data);
      }
    }

    if(!data){
      if(clientId){
        const ref = doc(db, "clients", clientId);
        const snap = await getDoc(ref);

        if(snap.exists()){
          data = snap.data();
          currentDocId = clientId;

          await updateDoc(ref, { authUid: user.uid });
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

function handleRealtimeUpdate(data){

  // FIRST LOAD
  if(previousStatus === null){
    previousStatus = data.status;
    currentData = data;

    render();
    return;
  }

  // STATUS CHANGE
  if(previousStatus !== data.status){
    if(data.status === "paid"){
      console.log("Card activated");
    }
  }

  previousStatus = data.status;
  currentData = data;

  render();
}

/* RENDER */
function render(){

  const hero = document.getElementById("heroProfile");
  if(hero) hero.src = img;

  const img = currentData.profile || "/logo.png";

  document.getElementById("heroProfile").src = img;
  document.getElementById("headerProfile").src = img;

  document.getElementById("cardName").innerText = currentData.name || "Your Name";
  document.getElementById("cardPosition").innerText = currentData.position || "Your Position";

  const preview = document.getElementById("projectPreview");

  if(preview && currentData.projectImages){
    preview.innerHTML = "";

    const plan = (currentData.plan || "basic").toLowerCase();
    let limit = 0;

    if(plan === "pro") limit = 3;
    if(plan === "elite") limit = 6;

    currentData.projectImages.slice(0, limit).forEach(img=>{
      const el = document.createElement("img");
      el.src = img;
      el.style.width = "60px";
      el.style.borderRadius = "8px";
      el.style.objectFit = "cover";
      preview.appendChild(el);
    });
  }
}

/* EDIT PROFILE */
window.editProfile = function(){

  if(currentData.status !== "paid"){
    alert("Please activate your card first.");
    return;
  }

  document.getElementById("editName").value = currentData.name || "";
  document.getElementById("editPosition").value = currentData.position || "";

  const projectInput = document.getElementById("editProjects");

  if(projectInput){
    projectInput.onchange = async function(e){

      const files = Array.from(e.target.files);
      if(!files.length) return;

      const plan = (currentData.plan || "basic").toLowerCase();

      // 🔒 BLOCK BASIC
      if(plan === "basic"){
        alert("Upgrade to Pro to add highlight projects.");
        return;
      }

      const uploaded = [];

      for(const file of files){
        const url = await uploadProjectImage(file);
        uploaded.push(url);
      }

      let limit = 3;
      if(plan === "elite") limit = 6;

      currentData.projectImages = [
        ...(currentData.projectImages || []),
        ...uploaded
      ].slice(0, limit);

      console.log("Saved project images:", currentData.projectImages);

      render();
    };
  }
};

/* SAVE */
window.saveEdit = async function(){

  const ref = doc(db, "clients", currentDocId);

  await updateDoc(ref, {
    name: document.getElementById("editName").value,
    position: document.getElementById("editPosition").value,
    projectImages: currentData.projectImages || []
  });

  render();
};

/* AUTO SAVE */
async function autoSaveEdit(){

  if(!currentDocId) return;

  try{
    const ref = doc(db, "clients", currentDocId);

    const services = [];

    await updateDoc(ref, {
      services: services, // ✅ FIXED COMMA
      projectImages: currentData.projectImages || []
    });

    console.log("Auto-saved");

  } catch(err){
    console.log("Auto-save failed", err);
  }
}

/* UPLOAD */
async function uploadProjectImage(file){

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "nfc_upload");
  formData.append("folder", `nfc-clients/${currentDocId}/projects`);

  const res = await fetch("https://api.cloudinary.com/v1_1/dnlzwtkhs/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

function closeEdit(){
  const modal = document.getElementById("editModal");
  if(modal){
    modal.style.display = "none";
  }
}

/* SAFE CLICK OUTSIDE */
window.handleEditOutsideClick = function(e){
  const box = document.querySelector(".edit-box");
  if(box && !box.contains(e.target)){
    closeEdit();
  }
};

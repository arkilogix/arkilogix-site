import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot }
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

/* AUTH */
onAuthStateChanged(auth, async (user)=>{
  if(!user){
    window.location.href="/auth/login.html";
    return;
  }

  try{
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get("clientId");

    let data = null;

    // ✅ REALTIME MODE
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

    // ✅ UID QUERY MODE
    const q = query(
      collection(db, "clients"),
      where("authUid", "==", user.uid)
    );

    const snap = await getDocs(q);

    if(!snap.empty){
      data = snap.docs[0].data();
      currentDocId = snap.docs[0].id;

      handleRealtimeUpdate(data); // 🔥 REQUIRED
    }

    // ✅ FAILSAFE FETCH
    if(!data && clientId){
      const ref = doc(db, "clients", clientId);
      const snap2 = await getDoc(ref);

      if(snap2.exists()){
        data = snap2.data();
        currentDocId = clientId;

        handleRealtimeUpdate(data); // 🔥 REQUIRED
      }
    }

    if(!data){
      console.error("No client data found.");
      return;
    }

  } catch(err){
    console.error("Firestore error:", err);
  }
});

/* REALTIME HANDLER */
function handleRealtimeUpdate(data){

  previousStatus = data.status;
  currentData = data;

  render();
}

/* RENDER */
function render(){

  const img = currentData.profile || "/logo.png";

  const hero = document.getElementById("heroProfile");
  const header = document.getElementById("headerProfile");

  if(hero) hero.src = img;
  if(header) header.src = img;

  const nameEl = document.getElementById("cardName");
  const posEl = document.getElementById("cardPosition");

  if(nameEl) nameEl.innerText = currentData.name || "Your Name";
  if(posEl) posEl.innerText = currentData.position || "Your Position";

  const preview = document.getElementById("projectPreview");

  if(preview){
    preview.innerHTML = "";

    const plan = (currentData.plan || "basic").toLowerCase();
    let limit = 0;

    if(plan === "pro") limit = 3;
    if(plan === "elite") limit = 6;

    if(currentData.projectImages){
      currentData.projectImages.slice(0, limit).forEach(imgUrl=>{
        const el = document.createElement("img");
        el.src = imgUrl;
        el.style.width = "60px";
        el.style.borderRadius = "8px";
        el.style.objectFit = "cover";
        preview.appendChild(el);
      });
    }
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

/* CLOSE MODAL */
function closeEdit(){
  const modal = document.getElementById("editModal");
  if(modal){
    modal.style.display = "none";
  }
}

window.handleEditOutsideClick = function(e){
  const box = document.querySelector(".edit-box");
  if(box && !box.contains(e.target)){
    closeEdit();
  }
};

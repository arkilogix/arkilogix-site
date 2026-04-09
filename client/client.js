import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, updateDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* FIREBASE */
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "arkilogix-clients.firebaseapp.com",
  projectId: "arkilogix-clients"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* STATE */
let currentData = {};
let currentDocId = "";
let step = 1;

/* AUTH */
let authChecked = false;

onAuthStateChanged(auth, async (user)=>{

  if(!authChecked){
    authChecked = true;

    if(!user){
      setTimeout(()=>{
        if(!auth.currentUser){
          window.location.replace("/auth/login.html");
        }
      },500);
      return;
    }
  }

  if(!user){
    window.location.replace("/auth/login.html");
    return;
  }

  console.log("USER OK:", user.uid);

  const ref = doc(db, "clients", user.uid);
  const snap = await getDoc(ref);

  if(!snap.exists()){
    console.log("No client doc");
    return;
  }

  currentDocId = user.uid;
  currentData = snap.data();

  render();
});

/* RENDER */
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

  document.getElementById("statusText").innerText = "Status: " + (currentData.status || "processing");
}

/* VIEW CARD */
window.viewCard = ()=>{
  let page = "basic.html";
  if(currentData.plan === "pro") page = "pro.html";
  if(currentData.plan === "elite") page = "elite.html";
  window.open(`/view/${page}?id=${currentDocId}`);
};

/* ================= MODAL ================= */

window.openModal = ()=>{
  document.getElementById("editModal").style.display = "flex";

  document.getElementById("editName").value = currentData.name || "";
  document.getElementById("editPosition").value = currentData.position || "";

  document.getElementById("contactPhone").value = currentData.phone || "";
  document.getElementById("contactEmail").value = currentData.email || "";
  document.getElementById("contactFacebook").value = currentData.facebook || "";
  document.getElementById("contactInstagram").value = currentData.instagram || "";

  document.getElementById("website").value = currentData.website || "";

  const servicesBox = document.getElementById("servicesEdit");
  servicesBox.innerHTML = "";

  if(currentData.services?.length){
    currentData.services.forEach(s=>{
      const input = document.createElement("input");
      input.value = s;
      servicesBox.appendChild(input);
    });
  } else {
    servicesBox.appendChild(document.createElement("input"));
  }

  step = 1;
  updateSteps();
};

/* STEP CONTROL */
function updateSteps(){
  document.querySelectorAll(".step").forEach(s=>s.classList.remove("active"));
  document.querySelector(`[data-step="${step}"]`).classList.add("active");
}

window.nextStep = async ()=>{
  if(step < 5){
    step++;
    updateSteps();
  } else {
    await saveProfile();
  }
};

window.prevStep = ()=>{
  if(step > 1){
    step--;
    updateSteps();
  }
};

/* ================= CLOUDINARY ================= */

async function uploadImage(file){
  if(!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "arkilogix_profile");

  const res = await fetch("https://api.cloudinary.com/v1_1/dnlzwtkhs/image/upload", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  return data.secure_url;
}

/* ================= SAVE ================= */

async function saveProfile(){

  currentData.name = document.getElementById("editName").value;
  currentData.position = document.getElementById("editPosition").value;

  currentData.phone = document.getElementById("contactPhone").value;
  currentData.email = document.getElementById("contactEmail").value;
  currentData.facebook = document.getElementById("contactFacebook").value;
  currentData.instagram = document.getElementById("contactInstagram").value;

  currentData.website = document.getElementById("website").value;

  // SERVICES
  const serviceInputs = document.querySelectorAll("#servicesEdit input");
  currentData.services = [];

  serviceInputs.forEach(input=>{
    if(input.value.trim()){
      currentData.services.push(input.value.trim());
    }
  });

  try{

    // PROFILE IMAGE
    const profileFile = document.getElementById("imageInput").files[0];
    if(profileFile){
      const url = await uploadImage(profileFile);
      if(url) currentData.profile = url;
    }

    // PROJECTS
    const projectInputs = document.querySelectorAll("#projects input[type='file']");
    let projectUrls = [];

    for(const input of projectInputs){
      if(input.files[0]){
        const url = await uploadImage(input.files[0]);
        if(url) projectUrls.push(url);
      }
    }

    if(projectUrls.length){
      currentData.projects = projectUrls;
    }

    await updateDoc(doc(db,"clients",currentDocId), currentData);

    render();

    document.getElementById("editModal").style.display = "none";

  }catch(err){
    console.error(err);
    alert("Upload failed");
  }
}

/* SERVICES */
window.addServiceField = ()=>{
  const input = document.createElement("input");
  document.getElementById("servicesEdit").appendChild(input);
};

/* PROJECTS */
window.addProject = ()=>{
  const div = document.createElement("div");
  div.innerHTML = `<input type="file" accept="image/*">`;
  document.getElementById("projects").appendChild(div);
};

/* PROFILE IMAGE */
window.triggerImage = ()=>{
  document.getElementById("imageInput").click();
};

/* SHARE */
window.copyLink = ()=>{
  navigator.clipboard.writeText(window.location.href);
};

window.downloadVCard = ()=>{
  alert("vCard soon");
};

/* CTA */
window.explorePremium = ()=>{
  alert("Premium page soon");
};

window.exploreProducts = ()=>{
  alert("Pet NFC coming soon");
};

/* LOGOUT */
document.querySelector(".logout").onclick = ()=>{
  signOut(auth).then(()=>window.location.replace("/auth/login.html"));
};

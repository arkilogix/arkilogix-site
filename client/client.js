// FIXED STEP LOGIC (replace your step section with this)

let currentStep = 1;
const TOTAL_STEPS = 4;

function showStep(step){

  const steps = document.querySelectorAll(".step");

  // SAFETY: prevent overflow
  if(step < 1) step = 1;
  if(step > TOTAL_STEPS) step = TOTAL_STEPS;

  currentStep = step;

  // HIDE ALL
  steps.forEach(s => s.classList.remove("active"));

  // SHOW CURRENT
  const current = document.querySelector(`.step[data-step="${currentStep}"]`);
  if(current) current.classList.add("active");

  // UPDATE HEADER
  const indicator = document.getElementById("stepIndicator");
  if(indicator) indicator.innerText = `${currentStep} / ${TOTAL_STEPS}`;

  const titles = {
    1: "Step 1: Identity",
    2: "Step 2: Contacts",
    3: "Step 3: Services",
    4: "Upgrade"
  };

  const title = document.getElementById("stepTitle");
  if(title) title.innerText = titles[currentStep];

  // BUTTON LOGIC
  const nextBtn = document.getElementById("nextBtn");

  if(nextBtn){
    nextBtn.innerText = currentStep === TOTAL_STEPS ? "Finish" : "Next";
  }
}

/* NEXT */
function nextStep(){

  // FIX: stop skipping and overlapping
  if(currentStep < TOTAL_STEPS){
    currentStep++;
    showStep(currentStep);
  }else{
    saveProfile();
  }
}

/* BACK */
function prevStep(){

  if(currentStep > 1){
    currentStep--;
    showStep(currentStep);
  }
}

/* IMPORTANT: RESET PROPERLY */
function openModal(){

  document.getElementById("editModal").style.display = "flex";

  const nameInput = document.getElementById("editName");
  const posInput = document.getElementById("editPosition");

  if(nameInput) nameInput.value = currentData.name || "";
  if(posInput) posInput.value = currentData.position || "";

  // 🔥 CRITICAL FIX
  currentStep = 1;

  setTimeout(() => {
    showStep(1);
  }, 0);

  renderServicesEdit();
  updateServiceLimitUI();
  updateStrength();
}

<script>
document.addEventListener("DOMContentLoaded", function () {

  const params = new URLSearchParams(window.location.search);
  const client = params.get("client");

  if (client) {
    fetch(`clients/${client}.json`)
      .then(res => res.json())
      .then(profile => {

        console.log("PROFILE:", profile);

        // SAFE SET FUNCTION
        function setText(id, value) {
          const el = document.getElementById(id);
          if (el) el.innerText = value;
        }

        function setSrc(id, value) {
          const el = document.getElementById(id);
          if (el) el.src = value;
        }

        function setHref(id, value) {
          const el = document.getElementById(id);
          if (el) el.href = value;
        }

        function setBg(id, value) {
          const el = document.getElementById(id);
          if (el) el.style.backgroundImage = `url(${value})`;
        }

        // BASIC INFO
        setText("name", profile.name);
        setText("title", profile.title);
        setSrc("profileImg", profile.profileImage);
        setBg("banner", profile.bannerImage);

        // LINKS
        setHref("website", profile.website);
        setHref("call", `tel:${profile.phone}`);
        setHref("sms", `sms:${profile.phone}`);
        setHref("email", `mailto:${profile.email}`);
        setHref("instagram", profile.instagram);
        setHref("facebook", profile.facebook);

        // SAVE CONTACT
        const saveBtn = document.getElementById("saveContact");
        if (saveBtn) {
          saveBtn.onclick = () => {
            const vCard = `
BEGIN:VCARD
VERSION:3.0
FN:${profile.name}
ORG:${profile.title}
TEL:${profile.phone}
EMAIL:${profile.email}
END:VCARD
            `;

            const blob = new Blob([vCard], { type: 'text/vcard' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${profile.name}.vcf`;
            a.click();
          };
        }

        // ABOUT
        if (profile.about) {
          const aboutEl = document.querySelector(".section p");
          if (aboutEl) aboutEl.innerText = profile.about;
        }

        // PORTFOLIO
        if (profile.projects) {
          const container = document.querySelector(".portfolio");
          if (container) {
            container.innerHTML = "";

            profile.projects.forEach(img => {
              const el = document.createElement("img");
              el.src = img;
              el.onclick = () => openLightbox(img);
              container.appendChild(el);
            });
          }
        }

      })
      .catch(err => {
        console.error("ERROR:", err);
        const el = document.getElementById("name");
        if (el) el.innerText = "ERROR LOADING PROFILE";
      });
  }

});

function openLightbox(src) {
  const img = document.getElementById("lightbox-img");
  const box = document.getElementById("lightbox");
  if (img && box) {
    img.src = src;
    box.classList.add("active");
  }
}

function closeLightbox() {
  const box = document.getElementById("lightbox");
  if (box) box.classList.remove("active");
}
</script>

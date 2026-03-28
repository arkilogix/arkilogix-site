<script>
const params = new URLSearchParams(window.location.search);
const client = params.get("client");

console.log("CLIENT:", client);

if (!client) {
  document.getElementById("app").innerHTML = `
    <h1>ArkiLogix</h1>
    <p>We build smart digital systems.</p>
  `;
} else {

  // LOAD TEMPLATE
  fetch("arc-one.html")
    .then(res => {
      console.log("TEMPLATE STATUS:", res.status);
      if (!res.ok) throw new Error("Template not found");
      return res.text();
    })
    .then(html => {
      document.getElementById("app").innerHTML = html;

      // LOAD JSON
      return fetch(`clients/${client}.json`);
    })
    .then(res => {
      console.log("JSON STATUS:", res.status);
      if (!res.ok) throw new Error("JSON not found");
      return res.json();
    })
    .then(profile => {
      console.log("PROFILE:", profile);

      document.getElementById("name").innerText = profile.name;
      document.getElementById("title").innerText = profile.title;
      document.getElementById("profileImg").src = profile.profileImage;
      document.getElementById("banner").style.backgroundImage = `url(${profile.bannerImage})`;

      document.getElementById("website").href = profile.website;
      document.getElementById("call").href = `tel:${profile.phone}`;
      document.getElementById("sms").href = `sms:${profile.phone}`;
      document.getElementById("email").href = `mailto:${profile.email}`;
      document.getElementById("instagram").href = profile.instagram;
      document.getElementById("facebook").href = profile.facebook;

    })
    .catch(err => {
      console.error("ERROR:", err);
      document.getElementById("app").innerHTML = "<h1>ERROR</h1>";
    });
}
</script>

const params = new URLSearchParams(window.location.search);
const client = params.get("client");

if (!client) {
  document.getElementById("title").textContent =
    "We build smart digital systems for professionals.";
} else {
  fetch(`/clients/${client}.json`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("name").textContent = data.name;
      document.getElementById("title").textContent = data.title;
      document.getElementById("profile").src = data.image;
      document.getElementById("phone").href = `tel:${data.phone}`;
      document.getElementById("email").href = `mailto:${data.email}`;
    })
    .catch(() => {
      document.body.innerHTML = "<h1>Client not found</h1>";
    });
}

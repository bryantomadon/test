// Affiche un message personnalisé : index.html?prenom=Lea
const params = new URLSearchParams(window.location.search);
const prenom = params.get("prenom");

if (prenom) {
  document.getElementById("salut").innerHTML = "Bienvenue " + prenom + " !";
}
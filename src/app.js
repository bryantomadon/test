// Terminal S — comportements de la page.
// Règle de sécurité : on n'écrit jamais de HTML depuis le JavaScript,
// uniquement du texte (textContent) et des éléments créés un par un.
(function () {
  "use strict";

  var calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Message personnalisé : index.html?prenom=Lea ----------
  // Le paramètre vient de l'URL : c'est une donnée non fiable.
  // On la nettoie, on la limite en longueur et on l'affiche en texte brut.
  function lirePrenom() {
    var brut = new URLSearchParams(window.location.search).get("prenom");
    if (!brut) {
      return "";
    }
    return brut.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 24);
  }

  var prenom = lirePrenom();
  if (prenom) {
    var salut = document.getElementById("salut");
    var passager = document.getElementById("passager");
    if (salut) {
      salut.textContent = "Bienvenue à bord, " + prenom + " !";
    }
    if (passager) {
      passager.textContent = prenom.toUpperCase();
    }
  }

  // ---------- Horloge du terminal ----------
  var horloge = document.getElementById("horloge");
  function majHorloge() {
    var d = new Date();
    var hh = String(d.getHours()).padStart(2, "0");
    var mm = String(d.getMinutes()).padStart(2, "0");
    horloge.textContent = hh + ":" + mm;
    horloge.setAttribute("datetime", hh + ":" + mm);
  }
  if (horloge) {
    majHorloge();
    window.setInterval(majHorloge, 15000);
  }

  // ---------- Tableau des départs à palettes ----------
  var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";

  function completer(texte, longueur) {
    return (texte + " ".repeat(longueur)).slice(0, longueur);
  }

  // Prépare une cellule : un texte lisible par les lecteurs d'écran
  // et une rangée de palettes décoratives.
  function preparerCellule(cellule, longueur) {
    var lu = document.createElement("span");
    lu.className = "sr-only";
    var palettes = document.createElement("span");
    palettes.className = "flaps";
    palettes.setAttribute("aria-hidden", "true");
    for (var i = 0; i < longueur; i += 1) {
      var ch = document.createElement("span");
      ch.className = "ch";
      ch.textContent = " ";
      palettes.appendChild(ch);
    }
    cellule.appendChild(lu);
    cellule.appendChild(palettes);
    return { lu: lu, cases: palettes.children, longueur: longueur };
  }

  function basculer(caseEl, cible, delai) {
    if (calme) {
      caseEl.textContent = cible;
      return;
    }
    var depart = ALPHABET.indexOf(cible.toUpperCase());
    var etapes = [];
    for (var k = 1; k <= 3; k += 1) {
      etapes.push(ALPHABET.charAt((Math.max(depart, 0) + k * 7) % ALPHABET.length));
    }
    etapes.push(cible);
    etapes.forEach(function (lettre, n) {
      window.setTimeout(function () {
        caseEl.textContent = lettre;
        caseEl.classList.remove("flip");
        void caseEl.offsetWidth; // relance l'animation CSS
        caseEl.classList.add("flip");
      }, delai + n * 70);
    });
  }

  function afficher(cellule, texte) {
    var propre = completer(texte, cellule.longueur);
    cellule.lu.textContent = texte;
    for (var i = 0; i < cellule.longueur; i += 1) {
      var caseEl = cellule.cases.item(i);
      var lettre = propre.charAt(i);
      if (caseEl.textContent !== lettre) {
        basculer(caseEl, lettre, i * 35);
      }
    }
  }

  var corps = document.getElementById("vols");
  if (corps) {
    var vols = Array.prototype.map.call(corps.rows, function (ligne) {
      return {
        ligne: ligne,
        etape: ligne.getAttribute("data-gate") || "",
        dest: preparerCellule(ligne.querySelector(".dest"), 12),
        porte: preparerCellule(ligne.querySelector(".gate-cell"), 6),
        statut: preparerCellule(ligne.querySelector(".status"), 8)
      };
    });

    // Même enchaînement que .gitlab-ci.yml : build, puis test/scan/dynamique, puis deploy
    var vagues = [["BUILD"], ["TEST"], ["SCAN", "DYNAM"], ["DEPLOY"]];
    var numeroRun = document.getElementById("numero-run");
    var run = 245;

    var ETATS = ["is-run", "is-ok", "is-go"];
    function statut(vol, texte, etat) {
      ETATS.forEach(function (c) { vol.ligne.classList.remove(c); });
      if (etat) {
        vol.ligne.classList.add(etat);
      }
      afficher(vol.statut, texte);
    }

    function volsDe(vague) {
      return vols.filter(function (v) { return vague.indexOf(v.etape) !== -1; });
    }

    vols.forEach(function (v) {
      afficher(v.dest, v.ligne.getAttribute("data-dest") || "");
      afficher(v.porte, v.etape);
    });

    if (calme) {
      // Pas d'animation : on montre directement un pipeline terminé.
      vols.forEach(function (v) {
        if (v.etape === "DEPLOY") {
          statut(v, "DÉCOLLÉ", "is-go");
        } else {
          statut(v, "VALIDÉ", "is-ok");
        }
      });
    } else {
      var lancerRun = function () {
        if (numeroRun) {
          numeroRun.textContent = "#" + String(run).padStart(4, "0");
        }
        vols.forEach(function (v) { statut(v, "PRÉVU", ""); });

        vagues.forEach(function (vague, n) {
          var debut = 1600 + n * 2600;
          window.setTimeout(function () {
            volsDe(vague).forEach(function (v) { statut(v, "EN COURS", "is-run"); });
          }, debut);
          window.setTimeout(function () {
            volsDe(vague).forEach(function (v) {
              if (v.etape === "DEPLOY") {
                statut(v, "DÉCOLLÉ", "is-go");
              } else {
                statut(v, "VALIDÉ", "is-ok");
              }
            });
          }, debut + 1800);
        });

        run += 1;
        window.setTimeout(lancerRun, 1600 + vagues.length * 2600 + 6000);
      };
      lancerRun();
    }
  }

  // ---------- Shift-left : le curseur du poste de contrôle ----------
  var ETAPES = [
    { nom: "Code", cout: "€", texte: "Repérée dans l'éditeur ou la merge request : la personne qui a écrit le code corrige en quelques minutes, avec tout le contexte en tête." },
    { nom: "Build", cout: "€€", texte: "Le pipeline échoue quelques minutes après le push. On corrige avant de passer à autre chose, rien n'est encore sorti." },
    { nom: "Test", cout: "€€€", texte: "Il faut rouvrir le sujet, retrouver le contexte, refaire une revue et relancer toute la batterie de tests." },
    { nom: "Déploiement", cout: "€€€€", texte: "Retour arrière, coordination entre équipes, fenêtre de livraison manquée : le vol est retardé." },
    { nom: "Production", cout: "€€€€€", texte: "L'avion a décollé : incident, données potentiellement exposées, correctif en urgence et communication de crise." }
  ];

  var curseur = document.getElementById("etape");
  var verdict = document.getElementById("verdict");
  var verdictEtape = document.getElementById("verdict-etape");
  var verdictCout = document.getElementById("verdict-cout");
  var verdictTexte = document.getElementById("verdict-texte");

  function majVerdict() {
    var n = Math.min(Math.max(parseInt(curseur.value, 10) || 0, 0), ETAPES.length - 1);
    var e = ETAPES[n];
    verdict.setAttribute("data-level", String(n));
    verdictEtape.textContent = e.nom;
    verdictCout.textContent = e.cout;
    verdictTexte.textContent = e.texte;
    curseur.setAttribute("aria-valuetext", e.nom + ", coût " + e.cout.length + " sur 5");
  }

  if (curseur && verdict && verdictEtape && verdictCout && verdictTexte) {
    curseur.addEventListener("input", majVerdict);
    majVerdict();
  }
}());

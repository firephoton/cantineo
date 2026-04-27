<template>
  <div class="w-full min-h-full overflow-y-auto flex flex-col items-center p-4 box-border">
    <div class="w-full max-w-md flex flex-col gap-4">
      <form @submit.prevent class="flex flex-col gap-4 mb-4">
        <label class="text-white font-bold">Date</label>
        <input v-model="dateSelectionnee" type="date" @change="chargerRepasDuJour" class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg font-bold">
        <p class="text-slate-300 text-sm">Prix du repas : {{ prixBaseRepas }} €</p>
      </form>
      <form @submit.prevent class="w-full max-w-md mt-2">
        <h2 class="text-xl font-bold text-white mb-2">Employés ({{ listeEmployes.length }})</h2>
        <ul class="bg-slate-800 rounded-lg divide-y divide-slate-600">
          <div v-for="employe in listeEmployes" :key="employe.id_employe" class="p-4 text-white flex justify-between items-center">
            <span>{{ employe.nom }} {{ employe.prenom }}</span>
            <input type="checkbox" :checked="aRepasCeJour(employe)" @change="onChangeCheck(employe, $event.target.checked)" class="w-5 h-5 rounded">
          </div>
        </ul>
      </form>
    </div>
  </div>
</template>

<script setup>
// --- Imports ---
import { ref, computed, onMounted } from 'vue'
import { useDatabase } from './sqlite.js'

// --- Base de données ---
var model = useDatabase()

// --- Données (formulaire et liste) ---
var prixBaseRepas = ref(5)
var dateSelectionnee = ref('')
var liste = ref([])
var listeRepasDuJour = ref([])

// --- Liste affichée ---
var listeEmployes = computed(function () {
  var r = liste.value
  if (r && r.length >= 0) return r
  return []
})

// --- Initialisation et chargement ---
function init() {
  model.ouvrirBase().then(function () {
    model.creerTables().then(function () {
      dateSelectionnee.value = dateAujourdhui()
      charger()
    })
  })
}

function charger() {
  model.getPrixRepas().then(function (prix) {
    prixBaseRepas.value = prix
  })
  model.listerEmployes().then(function (resultat) {
    if (resultat && resultat.length >= 0) liste.value = resultat
    else liste.value = []
    chargerRepasDuJour()
  })
}

function chargerRepasDuJour() {
  var date = dateSelectionnee.value
  if (!date) return
  model.listerRepasPourDate(date).then(function (resultat) {
    if (resultat && resultat.length >= 0) listeRepasDuJour.value = resultat
    else listeRepasDuJour.value = []
  })
}

// --- Utilitaires ---
function dateAujourdhui() {
  var d = new Date()
  var an = d.getFullYear()
  var mois = d.getMonth() + 1
  var jour = d.getDate()
  if (mois < 10) mois = '0' + mois
  else mois = String(mois)
  if (jour < 10) jour = '0' + jour
  else jour = String(jour)
  return an + '-' + mois + '-' + jour
}

function aRepasCeJour(employe) {
  var repas = listeRepasDuJour.value
  for (var i = 0; i < repas.length; i++) {
    if (repas[i].id_employe === employe.id_employe) return true
  }
  return false
}

function idRepasPourEmploye(employe) {
  var repas = listeRepasDuJour.value
  for (var i = 0; i < repas.length; i++) {
    if (repas[i].id_employe === employe.id_employe) return repas[i].id_repas
  }
  return null
}

// --- Actions ---
function onChangeCheck(employe, coche) {
  var date = dateSelectionnee.value
  if (!date) return
  if (coche) {
    model.ajouterRepas(date, prixBaseRepas.value, employe.id_employe).then(function () {
      chargerRepasDuJour()
    })
  } else {
    var idRepas = idRepasPourEmploye(employe)
    if (idRepas == null) return
    model.supprimerRepas(idRepas).then(function () {
      chargerRepasDuJour()
    })
  }
}

// --- Lifecycle ---
onMounted(function () {
  init()
})
</script>

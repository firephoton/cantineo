<template>
  <div class="w-full min-h-full overflow-y-auto flex flex-col items-center p-4 box-border">
    <div class="w-full max-w-md flex flex-col gap-4">
      <form @submit.prevent="ajouter" class="flex flex-col gap-4 mb-4">
        <label class="text-white font-bold">Nom</label>
        <input v-model="nom" type="text" placeholder="Nom" required class="bg-blue-100 border-blue-400 border-2 rounded-lg w-full p-4 text-slate-900 text-lg font-bold">
        <label class="text-white font-bold">Prénom</label>
        <input v-model="prenom" type="text" placeholder="Prénom" required class="bg-blue-100 border-blue-400 border-2 rounded-lg w-full p-4 text-slate-900 text-lg font-bold">
        <button type="submit" class="bg-blue-400 text-slate-900 w-full p-4 rounded-lg text-2xl font-bold">Ajouter</button>
      </form>
      <div class="w-full max-w-md mt-2">
        <h2 class="text-xl font-bold text-white mb-2">Employés ({{ listeEmployes.length }})</h2>
        <ul class="bg-slate-800 rounded-lg divide-y divide-slate-600">
          <div v-for="employe in listeEmployes" :key="employe.id_employe" class="p-4 text-white flex justify-evenly">
            <p class="flex justify-start w-1/3">{{ employe.nom }} {{ employe.prenom }}</p>
            <div class="flex justify-evenly w-2/3">
              <button type="button" @click="ouvrirModif(employe)" class="bg-blue-500 w-2/5 text-white rounded-lg text-sm font-bold">Modifier</button>
              <button type="button" @click="supprimer(employe.id_employe)" class="bg-red-500 w-2/5 text-white rounded-lg text-sm font-bold">Supprimer</button>
            </div>
          </div>
        </ul>
      </div>
    </div>
    <div v-if="popupModif" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="fermerPopup">
      <div class="bg-slate-800 rounded-xl p-4 w-full max-w-md mx-4 shadow-xl">
        <h3 class="text-white font-bold mb-3">Modifier l'employé</h3>
        <form @submit.prevent="validerModif" class="flex flex-col gap-3">
          <label class="text-white font-bold">Nom</label>
          <input v-model="modifNom" type="text" placeholder="Nom" required class="bg-slate-700 text-white border border-slate-600 rounded-lg p-3">
          <label class="text-white font-bold">Prénom</label>
          <input v-model="modifPrenom" type="text" placeholder="Prénom" required class="bg-slate-700 text-white border border-slate-600 rounded-lg p-3">
          <div class="flex gap-2">
            <button type="button" @click="fermerPopup" class="flex-1 py-2 rounded-lg bg-slate-600 text-white font-medium">Annuler</button>
            <button type="submit" class="flex-1 py-2 rounded-lg bg-blue-500 text-white font-medium">Enregistrer</button>
          </div>
        </form>
      </div>
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
var nom = ref('')
var prenom = ref('')
var liste = ref([])
var popupModif = ref(null)
var modifNom = ref('')
var modifPrenom = ref('')

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
      charger()
    })
  })
}

function charger() {
  model.listerEmployes().then(function (resultat) {
    if (resultat && resultat.length >= 0) liste.value = resultat
    else liste.value = []
  })
}

// --- Actions ---
function ajouter() {
  model.ajouterEmploye(nom.value, prenom.value).then(function () {
    nom.value = ''
    prenom.value = ''
    charger()
  })
}

function ouvrirModif(employe) {
  popupModif.value = employe.id_employe
  modifNom.value = employe.nom
  modifPrenom.value = employe.prenom
}

function fermerPopup() {
  popupModif.value = null
}

function validerModif() {
  if (popupModif.value == null) return
  model.modifierEmploye(popupModif.value, modifNom.value, modifPrenom.value).then(function () {
    popupModif.value = null
    charger()
  })
}

function supprimer(idEmploye) {
  model.supprimerEmploye(idEmploye).then(function () {
    charger()
  })
}

// --- Lifecycle ---
onMounted(function () {
  init()
})
</script>

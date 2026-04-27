<template>
  <div class="w-full min-h-full overflow-y-auto flex flex-col items-center p-4 box-border">
    <div class="w-full max-w-md flex flex-col gap-4">
      <form @submit.prevent="appliquerSolde" class="flex flex-col gap-4 mb-4">
        <label class="text-white font-bold">Employé</label>
        <select v-model="idEmployeChoisi" required class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg font-bold">
          <option value="">Sélectionner un employé</option>
          <option v-for="e in listeEmployes" :key="e.id_employe" :value="e.id_employe">{{ e.nom }} {{ e.prenom }}</option>
        </select>
        <label class="text-white font-bold">Montant (+ ou -)</label>
        <input v-model="ajustement" type="text" inputmode="text" placeholder="Montant (+ ou -)" class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg font-bold">
        <button type="submit" class="bg-blue-400 text-slate-900 w-full p-4 rounded-lg text-2xl font-bold">Appliquer au solde</button>
      </form>
      <div class="w-full max-w-md mt-2">
        <h2 class="text-xl font-bold text-white mb-2">Employés ({{ listeEmployes.length }})</h2>
        <ul class="bg-slate-800 rounded-lg divide-y divide-slate-600">
          <div v-for="employe in listeEmployes" :key="employe.id_employe" class="p-4 text-white flex justify-between items-center gap-2">
            <span>{{ employe.nom }} {{ employe.prenom }}</span>
            <span class="flex items-center gap-3 shrink-0">
              <span class="text-slate-400 text-sm" :title="'Repas pris au total'">{{ employe.nb_repas ?? 0 }} repas</span>
              <button type="button" @click="ouvrirCarte(employe)" :class="(soldePositif(employe.solde) ? 'text-green-400' : 'text-red-400') + ' underline decoration-dotted'" :title="'Ouvrir la carte de fidélité de ' + employe.nom + ' ' + employe.prenom">{{ formatSolde(employe.solde) }}</button>
            </span>
          </div>
        </ul>
      </div>
      <div v-if="employeCarte" class="w-full bg-slate-800 rounded-lg p-4 text-white">
        <h3 class="text-lg font-bold mb-2">Carte de Fidélité - {{ employeCarte.nom }} {{ employeCarte.prenom }}</h3>
        <p class="text-slate-200">Progression: {{ progressionCarte(employeCarte) }} / 10 repas payés</p>
        <p class="text-slate-200">Avant prochain repas offert: {{ avantGratuite(employeCarte) }}</p>
        <p class="text-slate-200">Repas offerts cumulés: {{ employeCarte.nb_repas_offerts ?? 0 }}</p>
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
var idEmployeChoisi = ref('')
var ajustement = ref('')
var liste = ref([])
var employeCarte = ref(null)

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
  model.listerEmployesAvecSolde().then(function (resultat) {
    if (resultat && resultat.length >= 0) liste.value = resultat
    else liste.value = []
  })
}

// --- Utilitaires ---
function formatSolde(s) {
  var n = Number(s)
  if (isNaN(n)) return '0,00 €'
  if (n >= 0) return n.toFixed(2) + ' €'
  return '- ' + Math.abs(n).toFixed(2) + ' €'
}

function soldePositif(s) {
  var n = Number(s)
  if (isNaN(n)) return true
  return n >= 0
}

function ouvrirCarte(employe) {
  employeCarte.value = employe
}

function progressionCarte(employe) {
  var c = Number(employe && employe.compteur_fidelite)
  if (isNaN(c) || c < 0) c = 0
  if (c > 10) c = 10
  return c
}

function avantGratuite(employe) {
  var reste = 10 - progressionCarte(employe)
  if (reste <= 0) return 'Repas gratuit au prochain passage'
  return String(reste)
}

// --- Actions ---
function appliquerSolde() {
  var id = idEmployeChoisi.value
  var montantStr = String(ajustement.value).trim()
  var i = montantStr.indexOf(',')
  if (i >= 0) montantStr = montantStr.substring(0, i) + '.' + montantStr.substring(i + 1)
  var montant = Number(montantStr)
  if (!id || montantStr === '' || isNaN(montant)) return
  model.ajouterAjustementSolde(id, montant).then(function () {
    ajustement.value = ''
    employeCarte.value = null
    charger()
  })
}

// --- Lifecycle ---
onMounted(function () {
  init()
})
</script>

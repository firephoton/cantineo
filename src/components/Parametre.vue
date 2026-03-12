<template>
  <div class="w-full min-h-full overflow-y-auto flex flex-col items-center p-4 box-border">
    <div class="w-full max-w-md flex flex-col gap-4">
      <h2 class="text-xl font-bold text-white mb-2">Paramètre</h2>
      <form @submit.prevent="enregistrerPrix" class="flex flex-col gap-2">
        <label class="text-white font-bold">Prix du repas (€)</label>
        <input v-model="prixRepas" type="number" step="0.01" min="0" class="bg-slate-700 text-white border border-slate-600 rounded-lg w-full p-4 text-lg font-bold">
        <button type="submit" class="bg-blue-400 text-slate-900 w-full p-4 rounded-lg text-xl font-bold">Enregistrer</button>
      </form>
      <div class="flex flex-col gap-2 mt-4">
        <router-link to="/gestionnaires" class="bg-slate-600 text-white w-full p-4 rounded-lg text-lg font-bold text-center">Gérer les gestionnaires</router-link>
        <button type="button" @click="deconnexion" class="bg-red-600 text-white w-full p-4 rounded-lg text-lg font-bold">Déconnexion</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// --- Imports ---
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDatabase } from './sqlite.js'
import { useAuth } from '../auth.js'

// --- Router, base de données et auth ---
var router = useRouter()
var model = useDatabase()
var auth = useAuth()

// --- Données (formulaire) ---
var prixRepas = ref('5')

// --- Initialisation et chargement ---
function init() {
  model.ouvrirBase().then(function () {
    model.creerTables().then(function () {
      charger()
    })
  })
}

function charger() {
  model.getPrixRepas().then(function (prix) {
    prixRepas.value = String(prix)
  })
}

// --- Actions ---
function enregistrerPrix() {
  var p = Number(prixRepas.value)
  if (isNaN(p)) p = 5
  model.definirPrixRepas(p).then(function () {
    charger()
  })
}

function deconnexion() {
  auth.logout()
  router.push('/login')
}

// --- Lifecycle ---
onMounted(function () {
  init()
})
</script>

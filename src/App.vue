<template>
  <div class="relative bg-slate-900 w-full min-h-screen overflow-auto pb-24">
    <router-view />
    <Navbar v-if="afficherNavbar" />
  </div>
</template>

<script setup>
// --- Imports ---
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'

// --- Router ---
var route = useRoute()

// --- Données dérivées ---
var afficherNavbar = computed(function () {
  return route.path !== '/login'
})
</script>

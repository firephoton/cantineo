<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-slate-700/20 bg-linear-to-t from-slate-900 to-slate-800 p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.25)]">
    <div class="mx-auto flex max-w-lg items-stretch justify-center gap-2">
      <RouterLink to="/solde" custom v-slot="{ navigate, isActive }">
        <button type="button" @click="navigate" :class="[ 'flex min-h-13 flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0', isActive ? 'border-blue-500/50 bg-blue-600/80 text-white' : 'border-slate-500/20 bg-slate-800/80 text-slate-200 hover:border-slate-400/35 hover:bg-slate-700/90' ]">
          <span class="text-xl leading-none">💰</span>
          <span class="leading-tight">Solde</span>
        </button>
      </RouterLink>
      <RouterLink to="/add" custom v-slot="{ navigate, isActive }">
        <button type="button" @click="navigate" :class="[ 'flex min-h-13 flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0', isActive ? 'border-blue-500/50 bg-blue-600/80 text-white' : 'border-slate-500/20 bg-slate-800/80 text-slate-200 hover:border-slate-400/35 hover:bg-slate-700/90' ]">
          <span class="text-xl leading-none">+</span>
          <span class="leading-tight">Add</span>
        </button>
      </RouterLink>
      <RouterLink to="/repas" custom v-slot="{ navigate, isActive }">
        <button type="button" @click="navigate" :class="[ 'flex min-h-13 flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0', isActive ? 'border-blue-500/50 bg-blue-600/80 text-white' : 'border-slate-500/20 bg-slate-800/80 text-slate-200 hover:border-slate-400/35 hover:bg-slate-700/90' ]">
          <span class="text-xl leading-none">🍽️</span>
          <span class="leading-tight">Repas</span>
        </button>
      </RouterLink>
      <RouterLink to="/parametre" custom v-slot="{ navigate, isActive }">
        <button type="button" @click="navigate" :class="[ 'flex min-h-13 flex-1 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0', isActive ? 'border-blue-500/50 bg-blue-600/80 text-white' : 'border-slate-500/20 bg-slate-800/80 text-slate-200 hover:border-slate-400/35 hover:bg-slate-700/90' ]">
          <span class="text-xl leading-none">⚙️</span>
          <span class="leading-tight">Paramètre</span>
        </button>
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
// --- Imports ---
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="app">
    <RaceSelect v-if="!gameStarted" @start="startGame" />
    <div v-else class="game-wrapper">
      <GameCanvas
        :game-state="gameStore.state"
        :engine="gameStore.getEngine()"
        @end="endGame"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Race } from './game/types'
import { useGameStore } from './stores/gameStore'
import RaceSelect from './components/RaceSelect.vue'
import GameCanvas from './components/GameCanvas.vue'

const gameStore = useGameStore()
const gameStarted = ref(false)

function startGame(race: Race) {
  gameStore.startGame(race)
  gameStarted.value = true
}

function endGame() {
  gameStore.stopGame()
  gameStarted.value = false
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; overflow: hidden; }
.app { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
.game-wrapper { display: flex; flex-direction: column; align-items: center; }
</style>

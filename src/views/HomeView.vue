<script setup lang="ts">
import { ref } from 'vue';

const welcomeMessage = ref("Welcome to Campus Connect!");
</script>

<template>
  <main class="home">
    <h1>{{ welcomeMessage }}</h1>
    <p>Start connecting with your campus community today!</p>
  </main>
</template>

<style scoped>
/* Centramos el contenido */
.home {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 80px); 
  text-align: center;
  margin: 0;
}

h1 {
  color: #4caf50;
  font-size: 2.5rem;
  margin-bottom: 20px;
}

p {
  font-size: 1.2rem;
  color: #666;
}
</style>

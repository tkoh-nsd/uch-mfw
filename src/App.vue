<script setup>
import Toast from 'primevue/toast'
</script>

<template>
  <Toast />
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: var(--app-surface);
  color: var(--app-text-main);
}

#app {
  min-height: 100vh;
  background-color: var(--app-surface);
}
</style>

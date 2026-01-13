<script setup lang="ts">
import iconUrl from '../assets/icon.png'

function openGitHub() {
  window.electronAPI.openExternal('https://github.com/Sakhnovkrg/InstaHex')
}

function closeWindow() {
  window.electronAPI.closeAbout()
}
</script>

<template>
  <div class="about">
    <img :src="iconUrl" alt="InstaHex" class="logo" />

    <h1 class="title">InstaHex</h1>
    <p class="version">v0.1.4</p>

    <p class="description">
      Simple color picker for grabbing colors from screen
    </p>

    <a class="link" @click="openGitHub">github.com/Sakhnovkrg/InstaHex</a>

    <button class="close-btn" @click="closeWindow">Close</button>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  user-select: none;
  height: 100vh;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  margin-bottom: 15px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.version {
  margin: 4px 0 15px;
  color: #999;
  font-size: 13px;
}

.description {
  text-align: center;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 15px;
}

.link {
  color: #0066cc;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
  margin-bottom: 20px;
}

.link:hover {
  text-decoration: underline;
}

.close-btn {
  background: #f0f0f0;
  border: none;
  color: #333;
  font-size: 13px;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}
</style>

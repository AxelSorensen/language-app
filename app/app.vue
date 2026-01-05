<template>
  <div class="bg-white">
    <NuxtPage />
  </div>
</template>

<script setup>
// This is the root app component
useHead({
  link: [{ rel: "manifest", href: "/manifest.json" }],
});
</script>

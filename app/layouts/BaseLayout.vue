<template>
  <div class="min-h-dvh flex flex-col">
    <!-- Header Section -->
    <header class="flex items-center p-4 shrink-0">
      <slot name="header" />
    </header>

    <!-- Content Section -->
    <main class="flex-1 flex items-center justify-center">
      <slot name="content" />
    </main>

    <!-- Keyboard Section -->
    <footer class="shrink-0">
      <slot name="keyboard" />
    </footer>
  </div>
</template>

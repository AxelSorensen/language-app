<template>
  <div class="h-screen grid grid-rows-[auto_1fr_auto]">
    <!-- Header Section -->
    <header class="flex items-center p-4">
      <slot name="header" />
    </header>

    <!-- Content Section -->
    <main class="overflow-hidden">
      <slot name="content" />
    </main>

    <!-- Keyboard Section -->
    <footer class="shrink-0 sm:hidden">
      <slot name="keyboard" />
    </footer>
  </div>
</template>

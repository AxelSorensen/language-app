<template>
  <div class="flex flex-col h-dvh overflow-hidden">
    <!-- Header Section -->
    <header class="flex p-4 items-center">
      <slot name="header" />
    </header>

    <!-- Content Section -->
    <main class="flex-1 p-4 overflow-auto">
      <slot name="content" />
    </main>

    <!-- Keyboard Section -->
    <footer>
      <slot name="keyboard" />
    </footer>
  </div>
</template>

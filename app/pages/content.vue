<template>
  <div class="flex w-screen h-screen items-center justify-center">
    <div
      ref="editor"
      contenteditable="true"
      class="border p-3 rounded whitespace-pre-wrap"
    ></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from "vue";

const editor = ref(null);
const tokens = reactive([]);
const tooltip = ref(null);

onMounted(async () => {
  await nextTick();

  const el = editor.value;
  if (!el) return;

  // Create tooltip div
  const t = document.createElement("div");
  t.className =
    "absolute left-1/2 -translate-x-1/2 -top-10 px-3 py-2 text-sm rounded-xl z-50 whitespace-nowrap border border-gray-300 duration-200 tooltip-bubble bg-white opacity-0 transition-opacity pointer-events-none flex items-center gap-2";
  t.style.color = "blue";
  t.style.fontWeight = "bold";

  // Create button inside tooltip
  const btn = document.createElement("button");
  btn.textContent = "Click me";
  btn.className =
    "bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs";
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent editor focus loss
    if (tooltip.value.currentToken) {
      alert(
        `Button clicked on token: "${tooltip.value.currentToken.textContent}"`
      );
    }
  });
  t.appendChild(btn);

  document.body.appendChild(t);
  tooltip.value = t;

  // Handle space key
  el.addEventListener("keydown", (e) => {
    if (e.key === " ") {
      e.preventDefault();
      handleSpace(el);
    }
  });

  let isTooltipHovered = false;
  let isTokenHovered = false;

  el.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (target.classList.contains("token")) {
      isTokenHovered = true;
      showTooltip(target);
    }
  });

  el.addEventListener("mouseout", (e) => {
    const target = e.target;
    if (target.classList.contains("token")) {
      isTokenHovered = false;
      setTimeout(() => {
        if (!isTooltipHovered && !isTokenHovered) hideTooltip();
      }, 50); // small delay to allow mouse to reach tooltip
    }
  });

  // Tooltip hover events
  tooltip.value.addEventListener("mouseenter", () => {
    isTooltipHovered = true;
  });

  tooltip.value.addEventListener("mouseleave", () => {
    isTooltipHovered = false;
    setTimeout(() => {
      if (!isTooltipHovered && !isTokenHovered) hideTooltip();
    }, 50);
  });

  // Show/hide functions
  function showTooltip(token) {
    tooltip.value.currentToken = token;
    tooltip.value.style.opacity = "1";
    tooltip.value.style.pointerEvents = "auto";

    const rect = token.getBoundingClientRect();
    tooltip.value.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.value.style.top = `${rect.top - 35}px`;
  }

  function hideTooltip() {
    tooltip.value.currentToken = null;
    tooltip.value.style.opacity = "0";
    tooltip.value.style.pointerEvents = "none";
  }

  // Tooltip hover events
  el.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (target.classList.contains("token")) {
      tooltip.value.currentToken = target; // store current token
      tooltip.value.style.opacity = "1";
      tooltip.value.style.pointerEvents = "auto";

      const rect = target.getBoundingClientRect();
      tooltip.value.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.value.style.top = `${rect.top - 35}px`;
    }
  });

  el.addEventListener("mouseout", (e) => {
    if (e.target.classList.contains("token")) {
      tooltip.value.currentToken = null;
      tooltip.value.style.opacity = "0";
      tooltip.value.style.pointerEvents = "none";
    }
  });
});

// --- Token Handling Functions (same as before) ---
function handleSpace(el) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  const offset = range.startOffset;

  if (
    node.nodeType === Node.TEXT_NODE &&
    node.parentNode.classList.contains("token")
  ) {
    const span = node.parentNode;
    const text = node.nodeValue;
    const index = Array.from(el.children).indexOf(span);

    if (offset === 0) {
      const newSpan = document.createElement("span");
      newSpan.className = "token relative group";
      newSpan.textContent = "";

      const space = document.createTextNode(" ");
      span.before(newSpan, space);

      tokens.splice(index, 0, { text: "", type: "correction" });
      placeCursor(newSpan, 0);
    } else if (offset < text.length) {
      const beforeText = text.slice(0, offset);
      const afterText = text.slice(offset);

      const spanBefore = document.createElement("span");
      spanBefore.className = "token relative group";
      spanBefore.textContent = beforeText;

      const spanAfter = document.createElement("span");
      spanAfter.className = "token relative group";
      spanAfter.textContent = afterText;

      const space = document.createTextNode(" ");

      span.replaceWith(spanBefore, space, spanAfter);
      tokens.splice(
        index,
        1,
        { text: beforeText, type: "correction" },
        { text: afterText, type: "correction" }
      );

      nextTick(() => placeCursor(space, 0));
    } else {
      const space = document.createTextNode(" ");
      span.after(space);
      placeCursor(space, 1);
    }
  } else {
    wrapLastWord(el);
  }
}

function wrapLastWord(el) {
  const lastChild = el.lastChild;
  if (!lastChild) return;

  let word = "";
  if (lastChild.nodeType === Node.TEXT_NODE) {
    const text = lastChild.nodeValue;
    const match = text.match(/(\S+)$/);
    if (match) {
      word = match[1];
      lastChild.nodeValue = text.slice(0, text.length - word.length);
    }
  }

  if (!word) return;

  const span = document.createElement("span");
  span.className = "token relative group";
  span.textContent = word;

  const spaceNode = document.createTextNode(" ");
  el.appendChild(span);
  el.appendChild(spaceNode);

  tokens.push({ text: word, type: "correction" });

  placeCursor(spaceNode, 1);
}

function placeCursor(node, offset) {
  const sel = window.getSelection();
  const range = document.createRange();
  range.setStart(node, offset);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}
</script>

<style>
.token {
  background: #eee;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: default;
  position: relative;
  line-height: 1.5;
}

[contenteditable]:focus {
  outline: none;
}

/* Tooltip arrow */
.tooltip-bubble::before {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid #d1d5db;
  z-index: 9;
}

.tooltip-bubble::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
  z-index: 10;
}
</style>

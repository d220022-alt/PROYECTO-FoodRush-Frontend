<!--
  Guia rápida para presentar:
  Boton flotante global de accesibilidad. Abre ajustes visuales sin tocar el diseno base.
  Buscar en VS Code: boton accesibilidad, panel accesibilidad, alto contraste.
  Mantener estos comentarios actualizados si cambia el flujo.
-->
<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAccessibility } from '../services/accessibility';

defineProps({
  raised: {
    type: Boolean,
    default: false,
  },
  supportRaised: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const isOpen = ref(false);
const {
  settings,
  isDefaultAccessibility,
  setFontSize,
  toggleHighContrast,
  toggleUnderlineLinks,
  toggleReduceMotion,
  resetAccessibility,
} = useAccessibility();

const closePanel = () => {
  isOpen.value = false;
};

const handleEscape = (event) => {
  if (event.key === 'Escape') {
    closePanel();
  }
};

watch(() => route.fullPath, closePanel);

onMounted(() => {
  window.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <div
    class="foodrush-accessibility-widget"
    :class="{
      'foodrush-accessibility-widget--open': isOpen,
      'foodrush-accessibility-widget--raised': raised,
      'foodrush-accessibility-widget--support': supportRaised,
    }"
  >
    <div
      v-if="isOpen"
      id="foodrush-accessibility-panel"
      class="foodrush-accessibility-panel"
      role="dialog"
      aria-label="Opciones de accesibilidad"
    >
      <div class="foodrush-accessibility-panel__header">
        <div>
          <p>Accesibilidad</p>
          <span>Ajustes visuales</span>
        </div>
        <button type="button" class="foodrush-accessibility-close" aria-label="Cerrar accesibilidad" @click="closePanel">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <div class="foodrush-accessibility-group" aria-label="Tamaño de texto">
        <span class="foodrush-accessibility-label">Texto</span>
        <div class="foodrush-accessibility-size-options">
          <button
            type="button"
            :class="{ active: settings.fontSize === 'normal' }"
            :aria-pressed="settings.fontSize === 'normal'"
            @click="setFontSize('normal')"
          >
            A
          </button>
          <button
            type="button"
            :class="{ active: settings.fontSize === 'large' }"
            :aria-pressed="settings.fontSize === 'large'"
            @click="setFontSize('large')"
          >
            A+
          </button>
          <button
            type="button"
            :class="{ active: settings.fontSize === 'extra' }"
            :aria-pressed="settings.fontSize === 'extra'"
            @click="setFontSize('extra')"
          >
            A++
          </button>
        </div>
      </div>

      <button
        type="button"
        class="foodrush-accessibility-option"
        :class="{ active: settings.highContrast }"
        :aria-pressed="settings.highContrast"
        @click="toggleHighContrast"
      >
        <i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i>
        <span>Alto contraste</span>
      </button>

      <button
        type="button"
        class="foodrush-accessibility-option"
        :class="{ active: settings.underlineLinks }"
        :aria-pressed="settings.underlineLinks"
        @click="toggleUnderlineLinks"
      >
        <i class="fa-solid fa-link" aria-hidden="true"></i>
        <span>Subrayar enlaces</span>
      </button>

      <button
        type="button"
        class="foodrush-accessibility-option"
        :class="{ active: settings.reduceMotion }"
        :aria-pressed="settings.reduceMotion"
        @click="toggleReduceMotion"
      >
        <i class="fa-solid fa-person-walking-arrow-right" aria-hidden="true"></i>
        <span>Reducir movimiento</span>
      </button>

      <button
        type="button"
        class="foodrush-accessibility-reset"
        :disabled="isDefaultAccessibility"
        @click="resetAccessibility"
      >
        Restablecer
      </button>
    </div>

    <button
      type="button"
      class="foodrush-accessibility-button"
      aria-controls="foodrush-accessibility-panel"
      :aria-expanded="isOpen"
      aria-label="Abrir opciones de accesibilidad"
      title="Accesibilidad"
      @click="isOpen = !isOpen"
    >
      <i class="fa-solid fa-universal-access" aria-hidden="true"></i>
    </button>
  </div>
</template>

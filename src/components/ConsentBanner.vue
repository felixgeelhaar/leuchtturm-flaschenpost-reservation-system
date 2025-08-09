<template>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-y-full"
    enter-to-class="translate-y-0"
    leave-active-class="transition-transform duration-300 ease-in"
    leave-from-class="translate-y-0"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="isVisible && !hasConsent"
      class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-200 shadow-lg"
      role="dialog"
      aria-labelledby="consent-banner-title"
      aria-describedby="consent-banner-description"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
        >
          <!-- Content -->
          <div class="flex-1">
            <h3
              id="consent-banner-title"
              class="text-lg font-semibold text-neutral-900 mb-2"
            >
              Datenschutzhinweis
            </h3>
            <p
              id="consent-banner-description"
              class="text-sm text-neutral-600 mb-4 lg:mb-0"
            >
              Diese Webseite speichert nur die für die Reservierung notwendigen
              Daten (Name, E-Mail). Es werden keine Tracking-Cookies oder
              Analysetools verwendet. Die Daten werden nur für die
              Magazine-Reservierung genutzt und nach der Ausgabe gelöscht.
            </p>
          </div>

          <!-- Actions -->
          <div class="flex flex-shrink-0">
            <button
              @click="acceptEssentialOnly"
              class="btn-primary text-sm px-6 py-2"
            >
              Verstanden
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

// State
const isVisible = ref(false);
const hasConsent = ref(false);

// Check if user has already given consent
onMounted(() => {
  const consent = localStorage.getItem("gdpr-consent");
  if (consent) {
    hasConsent.value = true;
  } else {
    // Show banner after a short delay
    setTimeout(() => {
      isVisible.value = true;
    }, 1000);
  }
});

// Accept essential data processing only
const acceptEssentialOnly = () => {
  const consentData = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };

  localStorage.setItem("gdpr-consent", JSON.stringify(consentData));
  hasConsent.value = true;
  isVisible.value = false;

  // Emit event for parent components
  window.dispatchEvent(
    new CustomEvent("consent-updated", { detail: consentData }),
  );
};
</script>

<style scoped>
/* Additional component-specific styles if needed */
</style>

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
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <!-- Content -->
          <div class="flex-1">
            <h3 id="consent-banner-title" class="text-lg font-semibold text-neutral-900 mb-2">
              Cookies und Datenschutz
            </h3>
            <p id="consent-banner-description" class="text-sm text-neutral-600 mb-4 lg:mb-0">
              Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Erfahrung auf unserer Website zu bieten. 
              Sie können Ihre Einstellungen jederzeit anpassen.
              <a 
                href="/privacy" 
                class="text-primary-600 hover:text-primary-700 underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mehr erfahren
              </a>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 lg:flex-shrink-0">
            <button
              @click="showDetailedSettings = true"
              class="btn-outline text-sm px-4 py-2"
              aria-describedby="consent-banner-description"
            >
              Einstellungen
            </button>
            <button
              @click="acceptNecessaryOnly"
              class="btn-secondary text-sm px-4 py-2"
            >
              Nur notwendige
            </button>
            <button
              @click="acceptAll"
              class="btn-primary text-sm px-4 py-2"
            >
              Alle akzeptieren
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Detailed Settings Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDetailedSettings"
        class="fixed inset-0 z-50 overflow-y-auto"
        role="dialog"
        aria-labelledby="consent-modal-title"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          @click="showDetailedSettings = false"
        ></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-neutral-200">
              <div class="flex items-center justify-between">
                <h2 id="consent-modal-title" class="text-xl font-semibold text-neutral-900">
                  Cookie-Einstellungen
                </h2>
                <button
                  @click="showDetailedSettings = false"
                  class="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
                  aria-label="Schließen"
                >
                  <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- Modal Body -->
            <div class="px-6 py-4 max-h-96 overflow-y-auto">
              <p class="text-sm text-neutral-600 mb-6">
                Wählen Sie, welche Arten von Cookies Sie zulassen möchten. 
                Diese Einstellungen gelten nur für diese Website.
              </p>

              <div class="space-y-6">
                <!-- Essential Cookies -->
                <div class="flex items-start space-x-3">
                  <input
                    id="modal-essential"
                    type="checkbox"
                    :checked="true"
                    disabled
                    class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded bg-neutral-100 cursor-not-allowed"
                  />
                  <div class="flex-1">
                    <label for="modal-essential" class="text-sm font-medium text-neutral-900">
                      Notwendige Cookies
                      <span class="text-xs text-neutral-500 font-normal ml-2">(Immer aktiv)</span>
                    </label>
                    <p class="text-xs text-neutral-600 mt-1">
                      Diese Cookies sind für das Funktionieren der Website erforderlich und können nicht deaktiviert werden. 
                      Sie werden normalerweise nur als Reaktion auf Ihre Aktionen gesetzt, die einer Anfrage nach Diensten entsprechen.
                    </p>
                  </div>
                </div>

                <!-- Functional Cookies -->
                <div class="flex items-start space-x-3">
                  <input
                    id="modal-functional"
                    v-model="detailedConsents.functional"
                    type="checkbox"
                    class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <div class="flex-1">
                    <label for="modal-functional" class="text-sm font-medium text-neutral-900">
                      Funktionale Cookies
                    </label>
                    <p class="text-xs text-neutral-600 mt-1">
                      Diese Cookies ermöglichen verbesserte Funktionalität und Personalisierung. 
                      Sie können von uns oder von Drittanbietern gesetzt werden, deren Dienste wir auf unseren Seiten verwenden.
                    </p>
                  </div>
                </div>

                <!-- Analytics Cookies -->
                <div class="flex items-start space-x-3">
                  <input
                    id="modal-analytics"
                    v-model="detailedConsents.analytics"
                    type="checkbox"
                    class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <div class="flex-1">
                    <label for="modal-analytics" class="text-sm font-medium text-neutral-900">
                      Analyse-Cookies
                    </label>
                    <p class="text-xs text-neutral-600 mt-1">
                      Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, 
                      indem sie Informationen anonym sammeln und melden. Alle Daten werden anonymisiert.
                    </p>
                  </div>
                </div>

                <!-- Marketing Cookies -->
                <div class="flex items-start space-x-3">
                  <input
                    id="modal-marketing"
                    v-model="detailedConsents.marketing"
                    type="checkbox"
                    class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <div class="flex-1">
                    <label for="modal-marketing" class="text-sm font-medium text-neutral-900">
                      Marketing-Cookies
                    </label>
                    <p class="text-xs text-neutral-600 mt-1">
                      Diese Cookies werden verwendet, um Ihnen relevante Werbung zu zeigen. 
                      Sie können auch verwendet werden, um die Anzahl der Anzeigen zu begrenzen und die Wirksamkeit von Werbekampagnen zu messen.
                    </p>
                  </div>
                </div>
              </div>

              <!-- Additional Information -->
              <div class="mt-6 p-4 bg-neutral-50 rounded-lg">
                <h4 class="text-sm font-medium text-neutral-900 mb-2">
                  Weitere Informationen
                </h4>
                <p class="text-xs text-neutral-600 mb-2">
                  Sie können Ihre Cookie-Einstellungen jederzeit ändern, indem Sie auf "Cookie-Einstellungen" 
                  am unteren Rand der Seite klicken.
                </p>
                <p class="text-xs text-neutral-600">
                  Für weitere Details lesen Sie unsere 
                  <a 
                    href="/privacy" 
                    class="text-primary-600 hover:text-primary-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Datenschutzerklärung
                  </a> und 
                  <a 
                    href="/cookies" 
                    class="text-primary-600 hover:text-primary-700 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cookie-Richtlinie
                  </a>.
                </p>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="px-6 py-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                @click="showDetailedSettings = false"
                class="btn-secondary text-sm px-4 py-2"
              >
                Abbrechen
              </button>
              <button
                @click="saveDetailedSettings"
                class="btn-primary text-sm px-4 py-2"
              >
                Einstellungen speichern
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Cookie Settings Link (always visible after consent is given) -->
  <button
    v-if="hasConsent"
    @click="showDetailedSettings = true"
    class="fixed bottom-4 left-4 text-xs text-neutral-500 hover:text-neutral-700 underline bg-white px-2 py-1 rounded shadow-sm border border-neutral-200 z-40"
    aria-label="Cookie-Einstellungen öffnen"
  >
    Cookie-Einstellungen
  </button>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import type { ConsentData } from '@/types';

interface Props {
  isVisible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isVisible: true
});

// Emits
const emit = defineEmits<{
  accept: [consents: ConsentData];
  decline: [];
}>();

// State
const hasConsent = ref(false);
const showDetailedSettings = ref(false);

const detailedConsents = reactive<ConsentData>({
  essential: true,   // Always true, cannot be disabled
  functional: false,
  analytics: false,
  marketing: false
});

// Methods
const acceptAll = () => {
  const consents: ConsentData = {
    essential: true,
    functional: true,
    analytics: true,
    marketing: true
  };
  
  saveConsent(consents);
  emit('accept', consents);
};

const acceptNecessaryOnly = () => {
  const consents: ConsentData = {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  };
  
  saveConsent(consents);
  emit('accept', consents);
};

const saveDetailedSettings = () => {
  const consents: ConsentData = {
    essential: true, // Always true
    functional: detailedConsents.functional,
    analytics: detailedConsents.analytics,
    marketing: detailedConsents.marketing
  };
  
  saveConsent(consents);
  showDetailedSettings.value = false;
  emit('accept', consents);
};

const saveConsent = (consents: ConsentData) => {
  try {
    // Save to localStorage
    localStorage.setItem('cookie-consent', JSON.stringify({
      consents,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }));
    
    // Save to server (non-blocking)
    saveConsentToServer(consents).catch(error => {
      console.error('Failed to save consent to server:', error);
    });
    
    hasConsent.value = true;
    
    // Apply consent settings
    applyConsentSettings(consents);
    
  } catch (error) {
    console.error('Failed to save consent:', error);
  }
};

const saveConsentToServer = async (consents: ConsentData) => {
  const response = await fetch('/api/consent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      consents,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to save consent to server');
  }
};

const loadSavedConsent = (): ConsentData | null => {
  try {
    const saved = localStorage.getItem('cookie-consent');
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Check if consent is still valid (not older than 1 year)
    const consentDate = new Date(parsed.timestamp);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    if (consentDate < oneYearAgo) {
      localStorage.removeItem('cookie-consent');
      return null;
    }
    
    return parsed.consents;
    
  } catch (error) {
    console.error('Failed to load saved consent:', error);
    return null;
  }
};

const applyConsentSettings = (consents: ConsentData) => {
  // Apply functional cookies
  if (consents.functional) {
    // Enable enhanced functionality
    document.body.classList.add('functional-cookies-enabled');
  } else {
    document.body.classList.remove('functional-cookies-enabled');
  }
  
  // Apply analytics cookies
  if (consents.analytics) {
    // Initialize analytics (Google Analytics, etc.)
    initializeAnalytics();
  } else {
    // Disable analytics
    disableAnalytics();
  }
  
  // Apply marketing cookies
  if (consents.marketing) {
    // Enable marketing tools
    initializeMarketing();
  } else {
    // Disable marketing tools
    disableMarketing();
  }
};

const initializeAnalytics = () => {
  // Initialize Google Analytics or other analytics tools
  if (typeof gtag !== 'undefined') {
    gtag('consent', 'update', {
      analytics_storage: 'granted'
    });
  }
};

const disableAnalytics = () => {
  // Disable analytics
  if (typeof gtag !== 'undefined') {
    gtag('consent', 'update', {
      analytics_storage: 'denied'
    });
  }
};

const initializeMarketing = () => {
  // Initialize marketing tools
  if (typeof gtag !== 'undefined') {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    });
  }
};

const disableMarketing = () => {
  // Disable marketing tools
  if (typeof gtag !== 'undefined') {
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
  }
};

const revokeConsent = () => {
  localStorage.removeItem('cookie-consent');
  hasConsent.value = false;
  
  // Reset to default settings
  Object.assign(detailedConsents, {
    essential: true,
    functional: false,
    analytics: false,
    marketing: false
  });
  
  // Apply default settings (only essential)
  applyConsentSettings(detailedConsents);
  
  emit('decline');
};

// Lifecycle
onMounted(() => {
  const savedConsent = loadSavedConsent();
  
  if (savedConsent) {
    hasConsent.value = true;
    Object.assign(detailedConsents, savedConsent);
    applyConsentSettings(savedConsent);
  } else {
    // Default: deny all non-essential cookies until consent is given
    applyConsentSettings({
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    });
  }
});

// Watch for changes to detailed consents to update UI
watch(detailedConsents, (newConsents) => {
  if (hasConsent.value) {
    // If user already has consent and is changing settings, save immediately
    // This allows for real-time updates
    applyConsentSettings(newConsents);
  }
});

// Expose methods for external use
defineExpose({
  revokeConsent,
  hasConsent,
  showSettings: () => { showDetailedSettings.value = true; }
});
</script>

<style scoped>
/* Custom scrollbar for modal */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Ensure proper z-index stacking */
.fixed {
  z-index: 40;
}

.fixed[role="dialog"] {
  z-index: 50;
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .transition-transform,
  .transition-opacity {
    transition: none;
  }
}

/* Focus management */
button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .bg-white {
    border: 1px solid #000;
  }
  
  .text-neutral-600 {
    color: #000;
  }
  
  .text-neutral-500 {
    color: #000;
  }
}
</style>
<template>
  <div class="error-boundary">
    <div v-if="error" class="error-boundary-container">
      <div class="error-boundary-content">
        <div class="error-icon">
          <svg
            class="h-12 w-12 text-error-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clip-rule="evenodd"
            />
          </svg>
        </div>

        <div class="error-details">
          <h2 class="error-title">Ein unerwarteter Fehler ist aufgetreten</h2>
          <p class="error-description">
            Es tut uns leid, aber etwas ist schiefgelaufen. Bitte versuchen Sie
            es erneut oder kontaktieren Sie uns, wenn das Problem weiterhin
            besteht.
          </p>

          <div v-if="isDevelopment && errorDetails" class="error-debug">
            <details class="error-stack">
              <summary class="error-stack-summary">
                Technische Details (Entwicklung)
              </summary>
              <div class="error-stack-content">
                <p><strong>Fehler:</strong> {{ errorDetails.message }}</p>
                <p>
                  <strong>Komponente:</strong> {{ errorDetails.componentName }}
                </p>
                <pre v-if="errorDetails.stack" class="error-stack-trace">{{
                  errorDetails.stack
                }}</pre>
              </div>
            </details>
          </div>

          <div class="error-actions">
            <button @click="retry" class="btn-primary" :disabled="retrying">
              <span v-if="retrying" class="loading-spinner mr-2"></span>
              {{ retrying ? "Wird wiederholt..." : "Erneut versuchen" }}
            </button>

            <button @click="goHome" class="btn-secondary ml-4">
              Zur Startseite
            </button>
          </div>

          <div class="error-contact">
            <p class="text-sm text-neutral-600 mt-4">
              Bei anhaltenden Problemen kontaktieren Sie uns unter:
              <a
                href="mailto:leuchtturm.elternbeirat@gmail.com"
                class="text-primary-600 hover:text-primary-800"
              >
                leuchtturm.elternbeirat@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>

    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onErrorCaptured, nextTick } from "vue";
// Removed heroicons import - using inline SVG for performance

// Props
interface Props {
  fallback?: () => void;
  onError?: (error: Error, errorInfo: any) => void;
  resetOnPropsChange?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  resetOnPropsChange: true,
});

// State
const error = ref<Error | null>(null);
const errorDetails = ref<{
  message: string;
  componentName?: string;
  stack?: string;
} | null>(null);
const retrying = ref(false);
const isDevelopment = import.meta.env.DEV;

// Error handling
onErrorCaptured((err: Error, errorInfo: any) => {
  console.error("ErrorBoundary caught error:", err);
  console.error("Error info:", errorInfo);

  error.value = err;
  errorDetails.value = {
    message: err.message,
    componentName: errorInfo?.componentName || "Unknown",
    stack: isDevelopment ? err.stack : undefined,
  };

  // Call custom error handler if provided
  if (props.onError) {
    props.onError(err, errorInfo);
  }

  // Report to monitoring service
  reportError(err, errorInfo);

  return false; // Prevent error from propagating
});

// Actions
const retry = async () => {
  retrying.value = true;

  try {
    // Clear error state
    error.value = null;
    errorDetails.value = null;

    // Wait for next tick to ensure cleanup
    await nextTick();

    // If custom fallback is provided, call it
    if (props.fallback) {
      props.fallback();
    }

    // Force component re-render
    await nextTick();
  } catch (err) {
    console.error("Error during retry:", err);
    // Don't set error state again to avoid infinite loop
  } finally {
    retrying.value = false;
  }
};

const goHome = () => {
  window.location.href = "/";
};

// Error reporting
const reportError = (err: Error, errorInfo?: any) => {
  // In production, report to error tracking service
  if (!isDevelopment && typeof window !== "undefined") {
    // Example: Sentry, LogRocket, etc.
    if (window.gtag) {
      window.gtag("event", "exception", {
        description: err.message,
        fatal: false,
        custom_map: {
          component: errorInfo?.componentName || "Unknown",
        },
      });
    }

    // You could also send to your own error logging endpoint
    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: err.message,
        stack: err.stack,
        componentName: errorInfo?.componentName,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error); // Fail silently for error reporting
  }
};

// Reset error state when props change (if enabled)
if (props.resetOnPropsChange) {
  onMounted(() => {
    // Watch for prop changes and reset error state
    // This is a simple implementation - you might want more sophisticated logic
    const resetError = () => {
      if (error.value) {
        error.value = null;
        errorDetails.value = null;
      }
    };

    // Reset on navigation or other significant changes
    window.addEventListener("popstate", resetError);

    return () => {
      window.removeEventListener("popstate", resetError);
    };
  });
}
</script>

<style scoped>
.error-boundary-container {
  @apply min-h-screen flex items-center justify-center px-4 py-12 bg-neutral-50;
}

.error-boundary-content {
  @apply max-w-md w-full text-center;
}

.error-icon {
  @apply flex justify-center mb-6;
}

.error-title {
  @apply text-2xl font-bold text-neutral-900 mb-4;
}

.error-description {
  @apply text-neutral-600 mb-6 leading-relaxed;
}

.error-debug {
  @apply mb-6 text-left;
}

.error-stack {
  @apply bg-neutral-100 border border-neutral-200 rounded-md p-4;
}

.error-stack-summary {
  @apply cursor-pointer text-sm font-medium text-neutral-700 hover:text-neutral-900;
}

.error-stack-content {
  @apply mt-3 text-xs;
}

.error-stack-content p {
  @apply mb-2 text-neutral-600;
}

.error-stack-trace {
  @apply bg-neutral-800 text-neutral-100 p-3 rounded text-xs overflow-x-auto font-mono;
}

.error-actions {
  @apply flex justify-center items-center mb-6;
}

.error-contact {
  @apply border-t border-neutral-200 pt-4;
}

.loading-spinner {
  @apply inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
}

/* Responsive design */
@media (max-width: 640px) {
  .error-boundary-content {
    @apply px-4;
  }

  .error-actions {
    @apply flex-col space-y-3;
  }

  .error-actions .ml-4 {
    @apply ml-0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .error-boundary-container {
    @apply bg-neutral-900;
  }

  .error-title {
    @apply text-neutral-100;
  }

  .error-description {
    @apply text-neutral-300;
  }

  .error-stack {
    @apply bg-neutral-800 border-neutral-700;
  }

  .error-stack-summary {
    @apply text-neutral-300 hover:text-neutral-100;
  }

  .error-stack-content p {
    @apply text-neutral-400;
  }

  .error-contact {
    @apply border-neutral-700;
  }
}
</style>

<template>
  <div 
    v-if="error" 
    :class="[
      'form-error',
      'flex items-start space-x-2',
      className
    ]"
    role="alert"
    :aria-live="ariaLive"
  >
    <ExclamationCircleIcon 
      class="h-4 w-4 text-error-500 mt-0.5 flex-shrink-0" 
      aria-hidden="true" 
    />
    <span class="text-sm">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleIcon } from '@heroicons/vue/24/solid';

interface Props {
  error?: string;
  className?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

withDefaults(defineProps<Props>(), {
  error: '',
  className: '',
  ariaLive: 'polite'
});
</script>
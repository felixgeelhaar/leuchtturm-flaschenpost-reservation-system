<template>
  <div class="form-container py-8">
    <div class="card">
      <div class="card-header">
        <h2 class="text-2xl font-bold text-neutral-900">
          {{ forms.reservation.title }}
        </h2>
        <p class="mt-2 text-neutral-600">
          {{ forms.reservation.subtitle }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="card-body space-y-6">
        <div v-if="serverError" class="alert-error">
          <div class="flex">
            <div class="flex-shrink-0">
              <ExclamationTriangleIcon class="h-5 w-5 text-error-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-error-800">
                {{ forms.reservation.errorTitle }}
              </h3>
              <div class="mt-2 text-sm text-error-700">
                {{ serverError }}
              </div>
            </div>
          </div>
        </div>

        <!-- Magazine Selection -->
        <div class="space-y-2">
          <label for="magazineId" class="form-label form-label-required">
            Magazin Ausgabe wählen
          </label>
          <select
            id="magazineId"
            v-model="formData.magazineId"
            :class="getFieldClass('magazineId')"
            required
            @change="updateQuantityOptions"
          >
            <option value="">Bitte wählen Sie eine Ausgabe...</option>
            <option
              v-for="magazine in availableMagazines"
              :key="magazine.id"
              :value="magazine.id"
            >
              {{ magazine.title }} - {{ magazine.issueNumber }} 
              ({{ magazine.availableCopies }} verfügbar)
            </option>
          </select>
          <ErrorMessage :error="formErrors.magazineId" />
          <div v-if="selectedMagazine" class="mt-3 p-4 bg-neutral-50 rounded-form">
            <h4 class="text-sm font-medium text-neutral-900">{{ selectedMagazine.title }}</h4>
            <p class="text-sm text-neutral-600 mt-1">{{ selectedMagazine.description }}</p>
            <p class="text-xs text-neutral-500 mt-2">
              Erscheinungsdatum: {{ formatDate(selectedMagazine.publishDate) }}
            </p>
          </div>
        </div>

        <!-- Personal Information -->
        <fieldset class="space-y-4">
          <legend class="text-lg font-medium text-neutral-900 mb-4">
            Persönliche Angaben
          </legend>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="firstName" class="form-label form-label-required">
                Vorname
              </label>
              <input
                id="firstName"
                v-model="formData.firstName"
                type="text"
                :class="getFieldClass('firstName')"
                placeholder="Ihr Vorname"
                required
                minlength="2"
                maxlength="100"
                autocomplete="given-name"
              />
              <ErrorMessage :error="formErrors.firstName" />
            </div>

            <div>
              <label for="lastName" class="form-label form-label-required">
                Nachname
              </label>
              <input
                id="lastName"
                v-model="formData.lastName"
                type="text"
                :class="getFieldClass('lastName')"
                placeholder="Ihr Nachname"
                required
                minlength="2"
                maxlength="100"
                autocomplete="family-name"
              />
              <ErrorMessage :error="formErrors.lastName" />
            </div>
          </div>

          <div>
            <label for="email" class="form-label form-label-required">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              :class="getFieldClass('email')"
              placeholder="ihre.email@beispiel.de"
              required
              maxlength="254"
              autocomplete="email"
            />
            <ErrorMessage :error="formErrors.email" />
            <p class="form-help">
              Wir verwenden Ihre E-Mail-Adresse nur für die Reservierungsbestätigung.
            </p>
          </div>

        </fieldset>

        <!-- Reservation Details -->
        <fieldset class="space-y-4">
          <legend class="text-lg font-medium text-neutral-900 mb-4">
            Reservierungsdetails
          </legend>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="quantity" class="form-label">
                Anzahl Exemplare
              </label>
              <input
                id="quantity"
                type="text"
                value="1 Exemplar"
                class="form-field bg-neutral-100"
                disabled
                readonly
              />
              <p class="form-help">
                Pro Familie kann 1 Exemplar reserviert werden.
              </p>
            </div>

            <div>
              <label for="deliveryMethod" class="form-label form-label-required">
                Erhalt
              </label>
              <select
                id="deliveryMethod"
                v-model="formData.deliveryMethod"
                :class="getFieldClass('deliveryMethod')"
                required
                @change="onDeliveryMethodChange"
              >
                <option value="pickup">Abholung vor Ort</option>
                <option value="shipping">Versand nach Hause</option>
              </select>
              <ErrorMessage :error="formErrors.deliveryMethod" />
              <p class="form-help">
                {{ formData.deliveryMethod === 'pickup' ? 'Kostenlose Abholung vor Ort.' : `Versandkostenpauschale: ${formatCurrency(shippingCost)} (Vorauszahlung erforderlich)` }}
              </p>
            </div>
          </div>

          <!-- Pickup Location (only shown for pickup) -->
          <div v-if="formData.deliveryMethod === 'pickup'">
            <label for="pickupLocation" class="form-label form-label-required">
              Abholort
            </label>
            <input
              id="pickupLocation"
              type="text"
              value="BRK Haus für Kinder - Leuchtturm"
              class="form-field bg-neutral-100"
              disabled
              readonly
            />
            <ErrorMessage :error="formErrors.pickupLocation" />
          </div>

          <!-- Cost Summary -->
          <div class="p-4 bg-primary-50 border border-primary-200 rounded-form">
            <h4 class="text-lg font-medium text-primary-900 mb-3">Kostenübersicht</h4>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Magazin (1 Exemplar):</span>
                <span class="font-medium">{{ formatCurrency(magazinePrice) }}</span>
              </div>
              <div v-if="formData.deliveryMethod === 'shipping'" class="flex justify-between text-sm">
                <span>Versandkostenpauschale:</span>
                <span class="font-medium">{{ formatCurrency(shippingCost) }}</span>
              </div>
              <div class="pt-2 mt-2 border-t border-primary-200">
                <div class="flex justify-between">
                  <span class="font-medium">Gesamtbetrag:</span>
                  <span class="text-lg font-bold text-primary-900">{{ formatCurrency(totalCost) }}</span>
                </div>
              </div>
            </div>
            <div v-if="formData.deliveryMethod === 'shipping'" class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <p class="text-xs text-amber-800">
                <strong>Hinweis:</strong> Der Gesamtbetrag muss vor dem Versand bezahlt werden.
                Sie erhalten nach der Reservierung eine E-Mail mit den Zahlungsinformationen.
              </p>
            </div>
            <div v-else class="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p class="text-xs text-green-800">
                <strong>Abholung:</strong> Barzahlung bei Abholung möglich.
              </p>
            </div>
          </div>

          <!-- Payment Method Selection (only shown for shipping) -->
          <div v-if="formData.deliveryMethod === 'shipping'">
            <label for="paymentMethod" class="form-label form-label-required">
              Gewünschte Zahlungsart
            </label>
            <select
              id="paymentMethod"
              v-model="formData.paymentMethod"
              :class="getFieldClass('paymentMethod')"
              required
            >
              <option value="">Bitte wählen...</option>
              <option value="paypal">PayPal</option>
            </select>
            <ErrorMessage :error="formErrors.paymentMethod" />
            <p class="form-help">
              Sie erhalten einen PayPal-Zahlungslink per E-Mail nach der Reservierung.
            </p>
          </div>

          <!-- Shipping Address (only shown for shipping) -->
          <fieldset v-if="formData.deliveryMethod === 'shipping'" class="space-y-4 p-4 border border-neutral-200 rounded-form bg-neutral-50">
            <legend class="text-lg font-medium text-neutral-900 mb-4 px-2">
              Lieferadresse
            </legend>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-2">
                <label for="street" class="form-label form-label-required">
                  Straße
                </label>
                <input
                  id="street"
                  v-model="formData.address.street"
                  type="text"
                  :class="getFieldClass('address.street')"
                  placeholder="Musterstraße"
                  required
                  maxlength="200"
                  autocomplete="street-address"
                />
                <ErrorMessage :error="formErrors['address.street']" />
              </div>
              
              <div>
                <label for="houseNumber" class="form-label form-label-required">
                  Hausnummer
                </label>
                <input
                  id="houseNumber"
                  v-model="formData.address.houseNumber"
                  type="text"
                  :class="getFieldClass('address.houseNumber')"
                  placeholder="123"
                  required
                  maxlength="20"
                />
                <ErrorMessage :error="formErrors['address.houseNumber']" />
              </div>
            </div>
            
            <div>
              <label for="addressLine2" class="form-label">
                Adresszusatz (optional)
              </label>
              <input
                id="addressLine2"
                v-model="formData.address.addressLine2"
                type="text"
                :class="getFieldClass('address.addressLine2')"
                placeholder="Wohnung, Stockwerk, etc."
                maxlength="200"
              />
              <ErrorMessage :error="formErrors['address.addressLine2']" />
              <p class="form-help">
                Ergänzende Angaben wie Apartment, Stockwerk oder besondere Hinweise.
              </p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="postalCode" class="form-label form-label-required">
                  Postleitzahl
                </label>
                <input
                  id="postalCode"
                  v-model="formData.address.postalCode"
                  type="text"
                  :class="getFieldClass('address.postalCode')"
                  placeholder="12345"
                  required
                  maxlength="20"
                  autocomplete="postal-code"
                />
                <ErrorMessage :error="formErrors['address.postalCode']" />
              </div>
              
              <div>
                <label for="city" class="form-label form-label-required">
                  Stadt
                </label>
                <input
                  id="city"
                  v-model="formData.address.city"
                  type="text"
                  :class="getFieldClass('address.city')"
                  placeholder="Berlin"
                  required
                  maxlength="100"
                  autocomplete="address-level2"
                />
                <ErrorMessage :error="formErrors['address.city']" />
              </div>
            </div>
            
            <div>
              <label for="country" class="form-label form-label-required">
                Land
              </label>
              <select
                id="country"
                v-model="formData.address.country"
                :class="getFieldClass('address.country')"
                required
              >
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
              </select>
              <ErrorMessage :error="formErrors['address.country']" />
              <p class="form-help">
                Aktuell liefern wir nur nach Deutschland, Österreich und in die Schweiz.
              </p>
            </div>
          </fieldset>

          <div>
            <label for="notes" class="form-label">
              Anmerkungen (optional)
            </label>
            <textarea
              id="notes"
              v-model="formData.notes"
              :class="getFieldClass('notes')"
              rows="3"
              maxlength="500"
              placeholder="Besondere Wünsche oder Anmerkungen..."
            />
            <ErrorMessage :error="formErrors.notes" />
            <div class="text-xs text-neutral-500 mt-1">
              {{ (formData.notes || '').length }}/500 Zeichen
            </div>
          </div>
        </fieldset>

        <!-- GDPR Consent -->
        <fieldset class="space-y-4 p-4 border border-neutral-200 rounded-form bg-neutral-50">
          <legend class="text-lg font-medium text-neutral-900 mb-4 px-2">
            Datenschutz
          </legend>

          <div class="space-y-3">
            <div class="flex items-start">
              <input
                id="consent-essential"
                v-model="formData.consents.essential"
                type="checkbox"
                class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                required
              />
              <label for="consent-essential" class="ml-3 text-sm text-neutral-700">
                <span class="font-medium">Datenverarbeitung für die Reservierung *</span><br>
                Ich stimme der Verarbeitung meiner Daten (Name, E-Mail, Telefonnummer) für die Reservierung zu.
              </label>
            </div>
          </div>

          <div class="text-xs text-neutral-600 mt-4">
            <p>
              Weitere Informationen finden Sie in unserer 
              <a href="/privacy" class="text-primary-600 hover:text-primary-700 underline">
                Datenschutzerklärung
              </a>.
              Ihre Daten werden nur für die Reservierung verwendet und anschließend gelöscht.
            </p>
          </div>

          <ErrorMessage :error="formErrors.consents" />
        </fieldset>

        <!-- Submit Button -->
        <div class="flex flex-col sm:flex-row sm:justify-end sm:space-x-4 space-y-4 sm:space-y-0 pt-6">
          <button
            type="button"
            @click="resetForm"
            class="btn-secondary order-2 sm:order-1"
            :disabled="isSubmitting"
          >
            Zurücksetzen
          </button>
          <button
            type="submit"
            class="btn-primary order-1 sm:order-2"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting" class="flex items-center">
              <div class="loading-sm mr-2"></div>
              Wird verarbeitet...
            </span>
            <span v-else>
              Reservierung absenden
            </span>
          </button>
        </div>

        <!-- Success Message -->
        <div
          v-if="showSuccess"
          class="alert-success"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <CheckCircleIcon class="h-5 w-5 text-success-400" aria-hidden="true" />
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-success-800">
                {{ forms.reservation.successTitle }}
              </h3>
              <div class="mt-2 text-sm text-success-700">
                <p>
                  {{ forms.reservation.successMessage }}
                </p>
                <p class="mt-2 font-medium">
                  Reservierungs-ID: {{ reservationId }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { z } from 'zod';
import type { Magazine, ReservationFormData, ConsentData, FormErrors } from '@/types';
import ErrorMessage from './ErrorMessage.vue';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { paymentConfig, formatCurrency, calculateTotalCost } from '@/config/payment';
import { forms, magazine } from '@/config/content';

// Props
interface Props {
  magazines?: Magazine[];
  initialData?: Partial<ReservationFormData>;
}

const props = withDefaults(defineProps<Props>(), {
  magazines: () => [],
  initialData: () => ({})
});

// Reactive state
const isSubmitting = ref(false);
const showSuccess = ref(false);
const serverError = ref('');
const reservationId = ref('');
const availableMagazines = ref<Magazine[]>(props.magazines || []);

// Pricing configuration
const magazinePrice = ref(paymentConfig.magazinePrice);
const shippingCost = ref(paymentConfig.shippingCost);

// Form data
const formData = reactive<ReservationFormData>({
  firstName: '',
  lastName: '',
  email: '',
  magazineId: '',
  quantity: 1,
  deliveryMethod: 'pickup',  // Default to pickup (cheaper option)
  pickupLocation: '',  // Used for pickup
  pickupDate: '',  // Used for pickup  
  paymentMethod: '',  // Required for shipping only
  address: {
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: 'DE',
    addressLine2: ''
  },
  notes: '',
  consents: {
    essential: false,
    functional: false,
    analytics: false,
    marketing: false
  }
});

// Form errors
const formErrors = reactive<FormErrors>({});

// Validation schema
const addressSchema = z.object({
  street: z.string().min(1, 'Straße ist erforderlich').max(200, 'Straße ist zu lang'),
  houseNumber: z.string().min(1, 'Hausnummer ist erforderlich').max(20, 'Hausnummer ist zu lang'),
  postalCode: z.string().min(4, 'Postleitzahl muss mindestens 4 Zeichen lang sein').max(20, 'Postleitzahl ist zu lang'),
  city: z.string().min(1, 'Stadt ist erforderlich').max(100, 'Stadt ist zu lang'),
  country: z.string().length(2, 'Ungültiger Ländercode'),
  addressLine2: z.string().max(200, 'Adresszusatz ist zu lang').optional()
}).optional();

const reservationSchema = z.object({
  firstName: z.string()
    .min(2, 'Vorname muss mindestens 2 Zeichen lang sein')
    .max(100, 'Vorname darf maximal 100 Zeichen lang sein'),
  lastName: z.string()
    .min(2, 'Nachname muss mindestens 2 Zeichen lang sein')
    .max(100, 'Nachname darf maximal 100 Zeichen lang sein'),
  email: z.string()
    .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
    .max(254, 'E-Mail-Adresse ist zu lang'),
  magazineId: z.string().min(1, 'Bitte wählen Sie eine Magazin-Ausgabe'),
  quantity: z.number()
    .min(1, 'Mindestens 1 Exemplar erforderlich')
    .max(1, 'Maximal 1 Exemplar pro Familie'),  // Fixed to 1 magazine per family
  deliveryMethod: z.enum(['pickup', 'shipping']),  // Both pickup and shipping supported
  pickupLocation: z.string().optional(),  // Used for pickup
  pickupDate: z.string().optional(),  // Used for pickup
  paymentMethod: z.string().optional(),  // Required only for shipping
  address: addressSchema,
  notes: z.string().max(500, 'Anmerkungen dürfen maximal 500 Zeichen lang sein').optional(),
  consents: z.object({
    essential: z.boolean().refine(val => val === true, 'Erforderliche Einwilligung muss erteilt werden'),
    functional: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean()
  })
}).refine((data) => {
  // If shipping method, address is required
  if (data.deliveryMethod === 'shipping') {
    return data.address && 
           data.address.street && 
           data.address.houseNumber && 
           data.address.postalCode && 
           data.address.city &&
           data.address.country &&
           data.paymentMethod && data.paymentMethod.length > 0;
  }
  return true;
}, {
  message: 'Lieferadresse ist bei Versand erforderlich',
  path: ['address']
});

// Computed properties
const selectedMagazine = computed(() => 
  availableMagazines.value?.find?.(m => m.id === formData.magazineId)
);

const maxQuantity = computed(() => 1);  // Fixed to 1 magazine per family

const minPickupDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
});

const maxPickupDate = computed(() => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
  return maxDate.toISOString().split('T')[0];
});

const isFormValid = computed(() => {
  const result = reservationSchema.safeParse(formData);
  return result.success;
});

const totalCost = computed(() => {
  const isShipping = formData.deliveryMethod === 'shipping';
  return calculateTotalCost(isShipping);
});

// Methods
const getFieldClass = (fieldName: string) => {
  const baseClass = 'form-field';
  const errorClass = 'form-field-error';
  
  return formErrors[fieldName] ? `${baseClass} ${errorClass}` : baseClass;
};

const validateForm = (): boolean => {
  // Clear previous errors
  Object.keys(formErrors).forEach(key => delete formErrors[key]);
  
  try {
    reservationSchema.parse(formData);
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        const path = err.path.join('.');
        formErrors[path] = err.message;
      });
    }
    return false;
  }
};

const updateQuantityOptions = () => {
  // Quantity is fixed to 1
  formData.quantity = 1;
};

// Handle delivery method changes
const onDeliveryMethodChange = () => {
  // Clear pickup location when switching to shipping
  if (formData.deliveryMethod === 'shipping') {
    formData.pickupLocation = '';
    formData.pickupDate = '';
  }
  
  // Clear address when switching to pickup
  if (formData.deliveryMethod === 'pickup') {
    formData.address = {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      country: 'DE',
      addressLine2: ''
    };
    formData.paymentMethod = '';
  }
  
  // Clear validation errors for switched fields
  if (formData.deliveryMethod === 'shipping') {
    delete formErrors.pickupLocation;
    delete formErrors.pickupDate;
  } else {
    delete formErrors['address.street'];
    delete formErrors['address.houseNumber'];
    delete formErrors['address.postalCode'];
    delete formErrors['address.city'];
    delete formErrors.paymentMethod;
  }
};

const handleSubmit = async () => {
  if (!validateForm()) {
    // Scroll to first error
    const firstErrorElement = document.querySelector('.form-field-error');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  isSubmitting.value = true;
  serverError.value = '';
  
  try {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Fehler beim Absenden der Reservierung');
    }
    
    // Success
    reservationId.value = result.data?.id || '';
    showSuccess.value = true;
    
    // Reset form after success
    setTimeout(() => {
      resetForm();
      showSuccess.value = false;
    }, 10000); // Hide success message after 10 seconds
    
    // Scroll to success message
    setTimeout(() => {
      const successElement = document.querySelector('.alert-success');
      if (successElement) {
        successElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
  } catch (error) {
    console.error('Reservation submission error:', error);
    serverError.value = error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten.';
    
    // Scroll to error message
    setTimeout(() => {
      const errorElement = document.querySelector('.alert-error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  Object.keys(formData).forEach(key => {
    if (key === 'quantity') {
      (formData as any)[key] = 1;
    } else if (key === 'deliveryMethod') {
      formData.deliveryMethod = 'pickup';
    } else if (key === 'address') {
      formData.address = {
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: 'DE',
        addressLine2: ''
      };
    } else if (key === 'consents') {
      formData.consents = {
        essential: false,
        functional: false,
        analytics: false,
        marketing: false
      };
    } else {
      (formData as any)[key] = '';
    }
  });
  
  Object.keys(formErrors).forEach(key => delete formErrors[key]);
  serverError.value = '';
  showSuccess.value = false;
  reservationId.value = '';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Initialize form with data
onMounted(() => {
  availableMagazines.value = props.magazines || [];
  
  // Apply initial data if provided
  if (props.initialData) {
    Object.entries(props.initialData).forEach(([key, value]) => {
      if (key in formData && value !== undefined) {
        (formData as any)[key] = value;
      }
    });
  }
  
  // Load magazines if not provided as props
  if (availableMagazines.value.length === 0) {
    fetchMagazines();
  }
});

const fetchMagazines = async () => {
  try {
    const response = await fetch('/api/magazines');
    if (response.ok) {
      const result = await response.json();
      availableMagazines.value = result.data || [];
    }
  } catch (error) {
    console.error('Failed to fetch magazines:', error);
  }
};
</script>

<style scoped>
/* Additional component-specific styles */
.form-container {
  min-height: 100vh;
}

@media (max-width: 640px) {
  .card-body {
    @apply px-4 py-6;
  }
  
  .form-field {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* Focus management for better accessibility */
button:focus,
input:focus,
select:focus,
textarea:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* Loading animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-sm {
  animation: spin 1s linear infinite;
}
</style>
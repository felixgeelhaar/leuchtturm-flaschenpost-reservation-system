<template>
  <div class="form-container py-8">
    <div class="card">
      <div class="card-header">
        <h2 class="text-2xl font-bold text-neutral-900">
          Flaschenpost Magazin reservieren
        </h2>
        <p class="mt-2 text-neutral-600">
          Reservieren Sie Ihr Exemplar des Flaschenpost Magazins. Alle Felder mit * sind Pflichtfelder.
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
                Fehler beim Absenden
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

          <div>
            <label for="phone" class="form-label">
              Telefonnummer (optional)
            </label>
            <input
              id="phone"
              v-model="formData.phone"
              type="tel"
              :class="getFieldClass('phone')"
              placeholder="+49 123 456789"
              maxlength="20"
              autocomplete="tel"
            />
            <ErrorMessage :error="formErrors.phone" />
            <p class="form-help">
              Nur für Rückfragen zur Abholung.
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
              <label for="quantity" class="form-label form-label-required">
                Anzahl Exemplare
              </label>
              <select
                id="quantity"
                v-model.number="formData.quantity"
                :class="getFieldClass('quantity')"
                required
              >
                <option
                  v-for="n in maxQuantity"
                  :key="n"
                  :value="n"
                >
                  {{ n }} {{ n === 1 ? 'Exemplar' : 'Exemplare' }}
                </option>
              </select>
              <ErrorMessage :error="formErrors.quantity" />
              <p class="form-help">
                Maximal 5 Exemplare pro Reservierung.
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
                {{ formData.deliveryMethod === 'pickup' ? 'Kostenlose Abholung an einem unserer Standorte.' : 'Wir senden Ihnen das Magazin kostenfrei zu.' }}
              </p>
            </div>
          </div>

          <!-- Pickup Location (only shown for pickup) -->
          <div v-if="formData.deliveryMethod === 'pickup'">
            <label for="pickupLocation" class="form-label form-label-required">
              Abholort
            </label>
            <select
              id="pickupLocation"
              v-model="formData.pickupLocation"
              :class="getFieldClass('pickupLocation')"
              :required="formData.deliveryMethod === 'pickup'"
            >
              <option value="">Bitte wählen...</option>
              <option value="Berlin Mitte">Berlin Mitte</option>
              <option value="Hamburg Zentrum">Hamburg Zentrum</option>
              <option value="München Innenstadt">München Innenstadt</option>
              <option value="Köln Zentrum">Köln Zentrum</option>
              <option value="Frankfurt Zentrum">Frankfurt Zentrum</option>
            </select>
            <ErrorMessage :error="formErrors.pickupLocation" />
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
                  :required="formData.deliveryMethod === 'shipping'"
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
                  :required="formData.deliveryMethod === 'shipping'"
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
                  :required="formData.deliveryMethod === 'shipping'"
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
                  :required="formData.deliveryMethod === 'shipping'"
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
                :required="formData.deliveryMethod === 'shipping'"
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
            <label for="pickupDate" class="form-label">
              Gewünschtes Abholdatum (optional)
            </label>
            <input
              id="pickupDate"
              v-model="formData.pickupDate"
              type="date"
              :class="getFieldClass('pickupDate')"
              :min="minPickupDate"
              :max="maxPickupDate"
            />
            <ErrorMessage :error="formErrors.pickupDate" />
            <p class="form-help">
              Falls Sie ein bestimmtes Datum bevorzugen. Standard: 7 Tage nach Reservierung.
            </p>
          </div>

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
            Datenschutz und Einverständniserklärung
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
                <span class="font-medium">Erforderliche Datenverarbeitung *</span><br>
                Ich stimme der Verarbeitung meiner Daten für die Reservierungsabwicklung zu.
                Dies ist notwendig für die Erfüllung des Vertrags.
              </label>
            </div>

            <div class="flex items-start">
              <input
                id="consent-functional"
                v-model="formData.consents.functional"
                type="checkbox"
                class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label for="consent-functional" class="ml-3 text-sm text-neutral-700">
                <span class="font-medium">Funktionale Verbesserungen</span><br>
                Ich erlaube die Nutzung von Cookies für eine verbesserte Website-Funktionalität.
              </label>
            </div>

            <div class="flex items-start">
              <input
                id="consent-analytics"
                v-model="formData.consents.analytics"
                type="checkbox"
                class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label for="consent-analytics" class="ml-3 text-sm text-neutral-700">
                <span class="font-medium">Nutzungsanalyse</span><br>
                Ich erlaube anonyme Nutzungsstatistiken zur Verbesserung der Website.
              </label>
            </div>

            <div class="flex items-start">
              <input
                id="consent-marketing"
                v-model="formData.consents.marketing"
                type="checkbox"
                class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label for="consent-marketing" class="ml-3 text-sm text-neutral-700">
                <span class="font-medium">Marketing-Kommunikation</span><br>
                Ich möchte Informationen über neue Ausgaben und Veranstaltungen erhalten.
              </label>
            </div>
          </div>

          <div class="text-xs text-neutral-600 mt-4 space-y-2">
            <p>
              Weitere Informationen finden Sie in unserer 
              <a href="/privacy" class="text-primary-600 hover:text-primary-700 underline">
                Datenschutzerklärung
              </a>.
            </p>
            <p>
              Sie können Ihre Einwilligung jederzeit widerrufen. Ihre Daten werden nach 
              einem Jahr automatisch gelöscht, sofern keine gesetzlichen Aufbewahrungsfristen bestehen.
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
                Reservierung erfolgreich!
              </h3>
              <div class="mt-2 text-sm text-success-700">
                <p>
                  Ihre Reservierung wurde erfolgreich übermittelt. 
                  Sie erhalten in Kürze eine Bestätigungs-E-Mail mit allen Details.
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

// Form data
const formData = reactive<ReservationFormData>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  magazineId: '',
  quantity: 1,
  deliveryMethod: 'pickup',
  pickupLocation: '',
  pickupDate: '',
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
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Bitte geben Sie eine gültige Telefonnummer ein')
    .optional()
    .or(z.literal('')),
  magazineId: z.string().min(1, 'Bitte wählen Sie eine Magazin-Ausgabe'),
  quantity: z.number()
    .min(1, 'Mindestens 1 Exemplar erforderlich')
    .max(5, 'Maximal 5 Exemplare pro Reservierung'),
  deliveryMethod: z.enum(['pickup', 'shipping']),
  pickupLocation: z.string().optional(),
  pickupDate: z.string().optional(),
  address: addressSchema,
  notes: z.string().max(500, 'Anmerkungen dürfen maximal 500 Zeichen lang sein').optional(),
  consents: z.object({
    essential: z.boolean().refine(val => val === true, 'Erforderliche Einwilligung muss erteilt werden'),
    functional: z.boolean(),
    analytics: z.boolean(),
    marketing: z.boolean()
  })
}).refine((data) => {
  // If pickup method, pickupLocation is required
  if (data.deliveryMethod === 'pickup') {
    return data.pickupLocation && data.pickupLocation.length > 0;
  }
  return true;
}, {
  message: 'Bitte wählen Sie einen Abholort',
  path: ['pickupLocation']
}).refine((data) => {
  // If shipping method, address is required
  if (data.deliveryMethod === 'shipping') {
    return data.address && 
           data.address.street && 
           data.address.houseNumber && 
           data.address.postalCode && 
           data.address.city && 
           data.address.country;
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

const maxQuantity = computed(() => 
  Math.min(selectedMagazine.value?.availableCopies || 1, 5)
);

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
  if (formData.quantity > maxQuantity.value) {
    formData.quantity = maxQuantity.value;
  }
};

const onDeliveryMethodChange = () => {
  // Clear pickup location when switching to shipping
  if (formData.deliveryMethod === 'shipping') {
    formData.pickupLocation = '';
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
  }
  
  // Clear related validation errors
  Object.keys(formErrors).forEach(key => {
    if (key.startsWith('address.') || key === 'pickupLocation') {
      delete formErrors[key];
    }
  });
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
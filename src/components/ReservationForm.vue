<template>
  <div class="form-container py-8">
    <div class="nautical-card ship-rock">
      <div class="card-header bg-gradient-to-r from-primary-50 to-secondary-50">
        <h2 class="text-2xl font-bold text-primary-800 flex items-center gap-2">
          <svg class="w-8 h-8" viewBox="0 0 100 100">
            <use href="/images/nautical-icons.svg#anchor"></use>
          </svg>
          {{ forms.reservation.title }}
        </h2>
        <p class="mt-2 text-primary-600">
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
          <div v-if="selectedMagazine" class="mt-3 p-4 bg-gradient-to-br from-secondary-50 to-primary-50 rounded-form border-2 border-primary-200 relative">
            <div class="absolute top-2 right-2 text-2xl opacity-30">🐚</div>
            <h4 class="text-sm font-medium text-neutral-900">{{ selectedMagazine.title }}</h4>
            <p class="text-sm text-neutral-600 mt-1">{{ selectedMagazine.description }}</p>
            <p class="text-xs text-neutral-500 mt-2">
              Erscheinungsdatum: {{ formatDate(selectedMagazine.publishDate) }}
            </p>
          </div>
        </div>

        <!-- Personal Information with nautical decoration -->
        <fieldset class="space-y-4 relative">
          <legend class="text-lg font-medium text-primary-800 mb-4 flex items-center gap-2">
            <svg class="w-6 h-6" viewBox="0 0 100 100">
              <use href="/images/nautical-icons.svg#ship-wheel"></use>
            </svg>
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

        <!-- Reservation Details with compass theme -->
        <fieldset class="space-y-4 relative">
          <legend class="text-lg font-medium text-primary-800 mb-4 flex items-center gap-2">
            <svg class="w-6 h-6" viewBox="0 0 100 100">
              <use href="/images/nautical-icons.svg#compass"></use>
            </svg>
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
                v-model="deliveryMethod"
                :class="getFieldClass('deliveryMethod')"
                required
              >
                <option value="pickup">Abholung vor Ort</option>
                <option value="shipping">Versand nach Hause</option>
              </select>
              <ErrorMessage :error="formErrors.deliveryMethod" />
              <p class="form-help">
                {{ deliveryMethod === 'pickup' ? 'Kostenlose Abholung vor Ort.' : `Versandkostenpauschale: ${formatCurrency(shippingCost)} (Vorauszahlung erforderlich)` }}
              </p>
            </div>
          </div>

          <!-- Pickup Location (only shown for pickup) -->
          <div v-show="deliveryMethod === 'pickup'">
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
              <div v-show="deliveryMethod === 'shipping'" class="flex justify-between text-sm">
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
            <div v-show="deliveryMethod === 'shipping'" class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
              <p class="text-xs text-amber-800">
                <strong>Hinweis:</strong> Der Gesamtbetrag muss vor dem Versand bezahlt werden.
                Sie erhalten nach der Reservierung eine E-Mail mit den Zahlungsinformationen.
              </p>
            </div>
            <div v-show="deliveryMethod === 'pickup'" class="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p class="text-xs text-green-800">
                <strong>Abholung:</strong> Barzahlung bei Abholung möglich.
              </p>
            </div>
          </div>
        </fieldset>

        <!-- Payment Method Selection (only shown for shipping) -->
        <div v-show="deliveryMethod === 'shipping'" class="space-y-2">
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

        <!-- Shipping Address with sailing ship theme -->
        <fieldset v-show="deliveryMethod === 'shipping'" class="space-y-4 p-4 border-2 border-primary-300 rounded bg-gradient-to-br from-primary-50 to-white">
            <legend class="text-lg font-medium text-primary-800 mb-4 px-2 flex items-center gap-2">
              <svg class="w-6 h-6" viewBox="0 0 100 100">
                <use href="/images/nautical-icons.svg#sailing-ship"></use>
              </svg>
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

        <!-- Picture Orders Section -->
        <fieldset class="space-y-4 p-4 border-2 border-amber-300 rounded-form bg-gradient-to-br from-amber-50 to-white">
          <legend class="text-lg font-medium text-amber-800 mb-4 px-2 flex items-center gap-2">
            <svg class="w-6 h-6" viewBox="0 0 100 100">
              <use href="/images/nautical-icons.svg#treasure-chest"></use>
            </svg>
            Kostenlose Bilder bestellen
          </legend>
          
          <div class="p-3 bg-amber-50 border border-amber-200 rounded">
            <p class="text-sm text-amber-800">
              <strong>Hinweis:</strong> Pro Familie kann maximal 1 Gruppenbild und (falls zutreffend) 1 Vorschüler-Bild kostenlos bestellt werden.
            </p>
          </div>

          <!-- Child Name (required for picture orders) -->
          <div v-if="formData.orderGroupPicture || formData.orderVorschulPicture">
            <label for="childName" class="form-label form-label-required">
              Name des Kindes
            </label>
            <input
              id="childName"
              v-model="formData.childName"
              type="text"
              :class="getFieldClass('childName')"
              placeholder="Vor- und Nachname des Kindes"
              :required="formData.orderGroupPicture || formData.orderVorschulPicture"
              maxlength="200"
            />
            <ErrorMessage :error="formErrors.childName" />
            <p class="form-help">
              Zur Verifizierung der Bestellung benötigen wir den Namen Ihres Kindes.
            </p>
          </div>

          <!-- Group Picture Order -->
          <div class="space-y-3">
            <div class="flex items-start">
              <input
                id="order-group-picture"
                v-model="formData.orderGroupPicture"
                type="checkbox"
                class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label for="order-group-picture" class="ml-3 text-sm text-neutral-700">
                <span class="font-medium">Gruppenbild bestellen (kostenlos)</span><br>
                Ich möchte das Gruppenbild meines Kindes erhalten.
              </label>
            </div>

            <!-- Group Selection (shown when group picture is selected) -->
            <div v-if="formData.orderGroupPicture" class="ml-7">
              <label for="childGroupName" class="form-label form-label-required">
                Kindergarten-Gruppe
              </label>
              <select
                id="childGroupName"
                v-model="formData.childGroupName"
                :class="getFieldClass('childGroupName')"
                :required="formData.orderGroupPicture"
              >
                <option value="">Bitte wählen...</option>
                <option value="seesterne">Seesterne</option>
                <option value="seepferdchen">Seepferdchen</option>
                <option value="seeigel">Seeigel</option>
                <option value="schatzsucher">Schatzsucher</option>
                <option value="lachmoewen">Lachmöwen</option>
              </select>
              <ErrorMessage :error="formErrors.childGroupName" />
            </div>
          </div>

          <!-- Vorschüler Picture Order -->
          <div class="space-y-3">
            <div class="flex items-start">
              <input
                id="child-is-vorschueler"
                v-model="formData.childIsVorschueler"
                type="checkbox"
                class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label for="child-is-vorschueler" class="ml-3 text-sm text-neutral-700">
                <span class="font-medium">Mein Kind ist ein Vorschüler</span><br>
                Mein Kind kommt dieses Jahr in die Schule.
              </label>
            </div>

            <!-- Vorschüler Picture Checkbox (shown when child is Vorschüler) -->
            <div v-if="formData.childIsVorschueler" class="ml-7">
              <div class="flex items-start">
                <input
                  id="order-vorschul-picture"
                  v-model="formData.orderVorschulPicture"
                  type="checkbox"
                  class="mt-1 h-4 w-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                />
                <label for="order-vorschul-picture" class="ml-3 text-sm text-neutral-700">
                  <span class="font-medium">Vorschüler-Bild bestellen (kostenlos)</span><br>
                  Ich möchte das Vorschüler-Gruppenbild erhalten.
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Notes field -->
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

        <!-- GDPR Consent with life preserver theme -->
        <fieldset class="space-y-4 p-4 border-2 border-seafoam-300 rounded-form bg-gradient-to-br from-seafoam-50 to-white relative">
          <legend class="text-lg font-medium text-seafoam-700 mb-4 px-2 flex items-center gap-2">
            <svg class="w-6 h-6" viewBox="0 0 100 100">
              <use href="/images/nautical-icons.svg#life-preserver"></use>
            </svg>
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
              Ihre Daten werden ausschließlich für die Reservierung verwendet und nach der Magazine-Ausgabe wieder gelöscht. 
              Es erfolgt keine Weitergabe an Dritte.
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
            <svg class="w-5 h-5" viewBox="0 0 100 100">
              <use href="/images/nautical-icons.svg#wave"></use>
            </svg>
            Zurücksetzen
          </button>
          <button
            type="submit"
            class="btn-nautical btn-lighthouse order-1 sm:order-2 flex items-center justify-center gap-2"
            :disabled="isSubmitting || !isFormValid"
          >
            <span v-if="isSubmitting" class="flex items-center">
              <div class="ship-wheel-loader mr-2"></div>
              Wird verarbeitet...
            </span>
            <span v-else class="flex items-center gap-2">
              <svg class="w-5 h-5" viewBox="0 0 100 100">
                <use href="/images/nautical-icons.svg#lighthouse"></use>
              </svg>
              Reservierung absenden
            </span>
          </button>
        </div>

        <!-- Success Message with treasure chest theme -->
        <div
          v-if="showSuccess"
          class="alert-success nautical-card relative overflow-hidden"
        >
          <div class="absolute top-2 right-2 text-4xl opacity-30">🏝️</div>
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-8 w-8 text-success-600" viewBox="0 0 100 100">
                <use href="/images/nautical-icons.svg#treasure-chest"></use>
              </svg>
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
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
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

// Separate ref for delivery method to ensure reactivity
const deliveryMethod = ref('pickup');

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
  },
  // Picture order fields
  orderGroupPicture: false,
  childGroupName: '',
  orderVorschulPicture: false,
  childIsVorschueler: false,
  childName: ''
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
  // Picture order fields
  orderGroupPicture: z.boolean().optional(),
  childGroupName: z.string().optional(),
  orderVorschulPicture: z.boolean().optional(),
  childIsVorschueler: z.boolean().optional(),
  childName: z.string().max(200, 'Name ist zu lang').optional(),
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
}).refine((data) => {
  // If ordering group picture, group name and child name are required
  if (data.orderGroupPicture) {
    return data.childGroupName && data.childGroupName.length > 0 && 
           data.childName && data.childName.length > 0;
  }
  return true;
}, {
  message: 'Gruppenname und Kindername sind für die Bildbestellung erforderlich',
  path: ['childGroupName']
}).refine((data) => {
  // If ordering Vorschüler picture, child must be marked as Vorschüler and name is required
  if (data.orderVorschulPicture) {
    return data.childIsVorschueler === true && 
           data.childName && data.childName.length > 0;
  }
  return true;
}, {
  message: 'Für die Vorschüler-Bildbestellung muss das Kind als Vorschüler markiert sein',
  path: ['orderVorschulPicture']
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
  const isShipping = deliveryMethod.value === 'shipping';
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

// Watch for delivery method changes
watch(deliveryMethod, async (newValue) => {
  // Sync with formData
  formData.deliveryMethod = newValue;
  
  // Force DOM update
  await nextTick();
  
  // Clear pickup location when switching to shipping
  if (newValue === 'shipping') {
    formData.pickupLocation = '';
    formData.pickupDate = '';
  }
  
  // Clear address when switching to pickup
  if (newValue === 'pickup') {
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
  if (newValue === 'shipping') {
    delete formErrors.pickupLocation;
    delete formErrors.pickupDate;
  } else {
    delete formErrors['address.street'];
    delete formErrors['address.houseNumber'];
    delete formErrors['address.postalCode'];
    delete formErrors['address.city'];
    delete formErrors.paymentMethod;
  }
});

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
  deliveryMethod.value = 'pickup';
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
    } else if (key === 'orderGroupPicture' || key === 'orderVorschulPicture' || key === 'childIsVorschueler') {
      (formData as any)[key] = false;
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
    // Silently fail - the form will handle the empty state
  }
};
</script>

<style scoped>
/* Additional component-specific styles */
.form-container {
  /* Remove min-height to prevent layout conflicts - parent layout handles this */
  position: static !important;
  transform: none !important;
  will-change: auto !important;
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
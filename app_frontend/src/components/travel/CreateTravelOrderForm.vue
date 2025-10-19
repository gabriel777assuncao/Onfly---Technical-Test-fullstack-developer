<template>
  <q-dialog v-model="visible" persistent>
    <q-card class="min-w-[360px] w-[520px]">
      <q-card-section class="text-h6">
        Novo pedido de viagem
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form ref="formRef" @submit.prevent="handleSubmit">
          <div class="q-gutter-md">
            <q-input
              v-model="requesterName"
              label="Solicitante"
              dense
              outlined
              readonly
              :disable="true"
              :rules="[v => !!v || 'Obrigatório', v => String(v).length <= 255 || 'Máx. 255']"
            />

            <q-input
              v-model="destination"
              label="Destino"
              dense
              outlined
              :rules="[v => !!v || 'Obrigatório', v => String(v).length <= 255 || 'Máx. 255']"
              :disable="isSubmitting"
            />

            <!-- Data de ida -->
            <q-input
              v-model="departureDate"
              :display-value="toBr(departureDate)"
              label="Data de ida"
              dense
              outlined
              readonly
              :rules="[
                v => !!v || 'Obrigatório',
                v => !v || v >= today || 'Data mínima: hoje'
              ]"
              :disable="isSubmitting"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="departureDate"
                      mask="YYYY-MM-DD"
                      :locale="dateLocale"
                      :options="allowDeparture"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <!-- Data de volta -->
            <q-input
              v-model="returnDate"
              :display-value="toBr(returnDate)"
              label="Data de volta"
              dense
              outlined
              readonly
              :rules="[
                v => !!v || 'Obrigatório',
                v => !v || v > departureDate || 'Deve ser após a ida'
              ]"
              :disable="isSubmitting"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="returnDate"
                      mask="YYYY-MM-DD"
                      :locale="dateLocale"
                      :options="allowReturn"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn
          flat
          label="Cancelar"
          color="grey-8"
          :disable="isSubmitting"
          @click="close"
        />
        <q-btn
          color="primary"
          label="Criar"
          :loading="isSubmitting"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue';
import { Notify } from 'quasar';
import { api } from 'src/boot/axios';
import type { AxiosError } from 'axios';
import ptBR from 'quasar/lang/pt-BR';

interface Props {
  modelValue: boolean;
  presetRequesterName?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'created'): void;
}>();

const { modelValue, presetRequesterName } = toRefs(props);

const visible = ref<boolean>(modelValue.value);
watch(modelValue, v => { visible.value = v ?? false; });
watch(visible, v => emit('update:modelValue', v));

const formRef = ref();
const requesterName = ref<string>(presetRequesterName?.value ?? '');
const destination = ref<string>('');
const departureDate = ref<string>('');
const returnDate = ref<string>('');
const isSubmitting = ref<boolean>(false);

// QDate requer objeto de locale
const dateLocale = ptBR.date;

// Hoje em ISO
const today = computed(() => new Date().toISOString().slice(0, 10));

// Helpers -------------------------------------------------------------
function toBr(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

// QDate passa 'YYYY/MM/DD' em :options → normalizamos
function normalize(dateStr: string): string {
  return dateStr.replaceAll('/', '-');
}

function allowDeparture(dateStr: string): boolean {
  return normalize(dateStr) >= today.value;
}

function allowReturn(dateStr: string): boolean {
  if (!departureDate.value) return false;
  return normalize(dateStr) > departureDate.value;
}
// --------------------------------------------------------------------

function resetFields(): void {
  requesterName.value = presetRequesterName?.value ?? '';
  destination.value = '';
  departureDate.value = '';
  returnDate.value = '';
}

function close(): void {
  if (isSubmitting.value) return;
  visible.value = false;
  resetFields();
}

function extractApiMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;

  const axiosError = error as AxiosError<{ message?: string }>;
  const apiMessage = axiosError?.response?.data?.message;
  if (typeof apiMessage === 'string' && apiMessage.length > 0) return apiMessage;

  return 'Não foi possível criar o pedido.';
}

async function onSubmit(): Promise<void> {
  if (!formRef.value) return;

  const valid = await formRef.value.validate();
  if (!valid) return;

  isSubmitting.value = true;

  try {
    await api.post('/travel-orders', {
      requester_name: requesterName.value,
      destination: destination.value,
      departure_date: departureDate.value,
      return_date: returnDate.value,
    });

    Notify.create({
      type: 'positive',
      message: 'Pedido criado com sucesso!',
      position: 'top-right'
    });

    emit('created');
    close();
  } catch (e: unknown) {
    const message = extractApiMessage(e);
    Notify.create({ type: 'negative', message, position: 'top-right' });
  } finally {
    isSubmitting.value = false;
  }
}

function submit(): void {
  void onSubmit();
}

function handleSubmit(): void {
  void onSubmit();
}
</script>

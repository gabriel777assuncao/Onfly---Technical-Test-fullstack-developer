<template>
  <q-dialog v-model="dialogVisibilityProxy" persistent>
    <q-card class="min-w-[360px] w-[520px]">
      <q-card-section class="text-h6">
        Novo pedido de viagem
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form ref="formReference" @submit.prevent="onSubmit">
          <div class="q-gutter-md">
            <q-input
              v-model="requesterFullName"
              label="Solicitante"
              dense
              outlined
              readonly
              :disable="isSubmittingRequest"
              :rules="[
                value => !!value || 'Obrigatório',
                value => String(value).length <= 255 || 'Máx. 255'
              ]"
            />

            <q-input
              v-model="destinationCityName"
              label="Destino"
              dense
              outlined
              :disable="isSubmittingRequest"
              :rules="[
                value => !!value || 'Obrigatório',
                value => String(value).length <= 255 || 'Máx. 255'
              ]"
            />

            <q-input
              v-model="departureDateIsoText"
              :display-value="formatIsoToBrazilianDate(departureDateIsoText)"
              label="Data de ida"
              dense
              outlined
              readonly
              :disable="isSubmittingRequest"
              :rules="[
                value => !!value || 'Obrigatório',
                value => !value || value >= currentDateIsoText || 'Data mínima: hoje'
              ]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="departureDateIsoText"
                      mask="YYYY-MM-DD"
                      :locale="quasarDateLocale"
                      :options="isDepartureDateAllowed"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input
              v-model="returnDateIsoText"
              :display-value="formatIsoToBrazilianDate(returnDateIsoText)"
              label="Data de volta"
              dense
              outlined
              readonly
              :disable="isSubmittingRequest"
              :rules="[
                value => !!value || 'Obrigatório',
                value => !value || value > departureDateIsoText || 'Deve ser após a ida'
              ]"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="returnDateIsoText"
                      mask="YYYY-MM-DD"
                      :locale="quasarDateLocale"
                      :options="isReturnDateAllowed"
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
          :disable="isSubmittingRequest"
          @click="closeDialog"
        />
        <q-btn
          color="primary"
          label="Criar"
          :loading="isSubmittingRequest"
          @click="onSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from "vue";
import { Notify } from "quasar";
import { api } from "boot/requests/httpClient";
import type { AxiosError } from "axios";
import quasarLanguage from "quasar/lang/pt-BR";
import type {
  CreateTravelOrderPayload,
} from "src/types/travelOrder.types";

interface Props {
  modelValue: boolean;
  presetRequesterName?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (eventName: "update:modelValue", value: boolean): void,
  (eventName: "created"): void,
}>();

const { modelValue, presetRequesterName } = toRefs(props);

const dialogVisibilityProxy = computed<boolean>({
  get: () => Boolean(modelValue.value),
  set: (newVisibilityValue: boolean) => emit("update:modelValue", newVisibilityValue),
});

const formReference = ref();
const requesterFullName = ref<string>(presetRequesterName?.value ?? "");
const destinationCityName = ref<string>("");
const departureDateIsoText = ref<string>("");
const returnDateIsoText = ref<string>("");
const isSubmittingRequest = ref<boolean>(false);

const quasarDateLocale = quasarLanguage.date;

const currentDateIsoText = computed<string>(() => {
  return new Date().toISOString().slice(0, 10);
});

function formatIsoToBrazilianDate(isoDateText: string): string {
  if (!isoDateText) {
    return "";
  }

  const datePartList = isoDateText.split("-");
  if (datePartList.length !== 3) {
    return isoDateText;
  }

  const formattedBrazilianDateText = `${datePartList[2]}/${datePartList[1]}/${datePartList[0]}`;

  return formattedBrazilianDateText;
}

function normalizeDateToIsoMask(inputDateText: string): string {
  return inputDateText.replaceAll("/", "-");
}

function isDepartureDateAllowed(inputDateText: string): boolean {
  return normalizeDateToIsoMask(inputDateText) >= currentDateIsoText.value;
}

function isReturnDateAllowed(inputDateText: string): boolean {
  if (!departureDateIsoText.value) {
    return false;
  }
  return normalizeDateToIsoMask(inputDateText) > departureDateIsoText.value;
}

function resetAllFields(): void {
  requesterFullName.value = presetRequesterName?.value ?? "";
  destinationCityName.value = "";
  departureDateIsoText.value = "";
  returnDateIsoText.value = "";
}

function closeDialog(): void {
  if (isSubmittingRequest.value) {
    return;
  }
  dialogVisibilityProxy.value = false;
  resetAllFields();
}

function extractApplicationMessageFromUnknownError(unknownError: unknown): string {
  if (typeof unknownError === "string") {
    return unknownError;
  }

  if (unknownError instanceof Error && unknownError.message) {
    return unknownError.message;
  }

  const axiosErrorInstance = unknownError as AxiosError<{ message?: string }>;
  const serverMessageText = axiosErrorInstance?.response?.data?.message;

  if (typeof serverMessageText === "string" && serverMessageText.length > 0) {
    return serverMessageText;
  }

  return "Não foi possível criar o pedido.";
}

async function onSubmit(): Promise<void> {
  if (!formReference.value) {
    return;
  }

  const isFormValid = await formReference.value.validate();
  if (!isFormValid) {
    return;
  }

  isSubmittingRequest.value = true;

  try {
    const requestPayload: CreateTravelOrderPayload = {
      requester_name: requesterFullName.value,
      destination: destinationCityName.value,
      departure_date: departureDateIsoText.value,
      return_date: returnDateIsoText.value,
    };

    await api.post("/travel-orders", requestPayload);

    Notify.create({
      type: "positive",
      message: "Pedido criado com sucesso!",
      position: "top-right",
    });

    emit("created");
    closeDialog();
  } catch (unknownError) {
    const messageText = extractApplicationMessageFromUnknownError(unknownError);
    Notify.create({ type: "negative", message: messageText, position: "top-right" });
  }
    finally {
    isSubmittingRequest.value = false;
  }
}
</script>

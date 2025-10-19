<template>
  <div class="landing">
    <TheHeader />

    <section class="hero">
      <div class="container row items-center">
        <div class="col-12 col-md-6 q-pr-lg q-mb-lg q-mb-md-none">
          <h1 class="hero-title">
            Viagens corporativas com leveza e controle. Bem-vindo à <span class="highlight">Onfly</span>.
          </h1>

          <p class="hero-subtitle">
            Centralize pedidos, aprovações e notificações em um só lugar. Tenha visibilidade do que acontece e tranquilidade para focar no que importa.
          </p>

          <div class="row q-gutter-sm q-mt-md">
            <template v-if="isAuthenticated">
              <q-btn color="primary" unelevated size="lg" label="Ir para o dashboard" @click="goToDashboard" />
              <q-btn flat color="primary" size="lg" label="Sair" @click="logout" />
            </template>
            <template v-else>
              <q-btn color="primary" unelevated size="lg" label="Começar agora" @click="goToRegister" />
              <q-btn flat color="primary" size="lg" label="Entrar" @click="goToLogin" />
            </template>
          </div>

          <div class="row q-col-gutter-md q-mt-lg">
            <div class="col-12 col-sm-4">
              <div class="pill">
                <q-icon name="verified_user" size="20px" />
                <span>Autenticação segura</span>
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="pill">
                <q-icon name="approval" size="20px" />
                <span>Aprovação simples</span>
              </div>
            </div>
            <div class="col-12 col-sm-4">
              <div class="pill">
                <q-icon name="insights" size="20px" />
                <span>Dashboard claro</span>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <q-card flat bordered class="shadow-1">
            <q-carousel
              v-model="carouselSlide"
              animated
              arrows
              infinite
              height="360px"
              control-color="white"
              navigation
              class="carousel"
            >
              <q-carousel-slide
                v-for="img in carouselImages"
                :key="img.name"
                :name="img.name"
                :img-src="img.src"
                :img-alt="img.alt"
              />
            </q-carousel>
          </q-card>
        </div>
      </div>
    </section>

    <section id="about" class="container q-my-xl">
      <div class="text-h5 text-center q-mb-lg">Por que escolher a Onfly?</div>
      <div class="row q-col-gutter-lg">
        <q-card flat bordered class="col-12 col-md-4 card">
          <div class="row no-wrap items-start">
            <q-avatar size="40px" color="primary" text-color="white" icon="table_view" class="q-mr-md" />
            <div>
              <div class="text-subtitle1 text-weight-medium">Visão única</div>
              <div class="text-body2 text-grey-7">
                Enxergue todos os pedidos em poucos cliques. Filtre por status, período e destino para decisões mais rápidas.
              </div>
            </div>
          </div>
        </q-card>

        <q-card flat bordered class="col-12 col-md-4 card">
          <div class="row no-wrap items-start">
            <q-avatar size="40px" color="primary" text-color="white" icon="rule" class="q-mr-md" />
            <div>
              <div class="text-subtitle1 text-weight-medium">Fluxo sem atritos</div>
              <div class="text-body2 text-grey-7">
                Regras claras de aprovação e cancelamento reduzem ruídos e garantem previsibilidade ao time.
              </div>
            </div>
          </div>
        </q-card>

        <q-card flat bordered class="col-12 col-md-4 card">
          <div class="row no-wrap items-start">
            <q-avatar size="40px" color="primary" text-color="white" icon="notifications_active" class="q-mr-md" />
            <div>
              <div class="text-subtitle1 text-weight-medium">Notificações úteis</div>
              <div class="text-body2 text-grey-7">
                O solicitante é avisado quando o pedido é aprovado ou cancelado. Sem surpresas, sem retrabalhos.
              </div>
            </div>
          </div>
        </q-card>
      </div>
    </section>

    <section class="how q-py-xl">
      <div class="container">
        <div class="text-h5 text-center q-mb-lg">Como funciona</div>
        <div class="row q-col-gutter-lg">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="step">
              <div class="step-index">1</div>
              <div class="text-subtitle1 q-mt-sm">Crie sua conta</div>
              <div class="text-body2 text-grey-7">Acesse a Onfly com segurança e personalize sua experiência.</div>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="step">
              <div class="step-index">2</div>
              <div class="text-subtitle1 q-mt-sm">Cadastre pedidos</div>
              <div class="text-body2 text-grey-7">Informe destino, ida e volta. Acompanhe tudo no painel.</div>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="step">
              <div class="step-index">3</div>
              <div class="text-subtitle1 q-mt-sm">Aprove com confiança</div>
              <div class="text-body2 text-grey-7">Administrações simples e notificações automáticas mantêm todos alinhados.</div>
            </q-card>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="container q-my-xl">
      <div class="text-h5 text-center q-mb-lg">Quem usa, recomenda</div>
      <div class="row q-col-gutter-lg">
        <q-card flat bordered class="col-12 col-md-6">
          <q-card-section>
            <q-icon name="format_quote" size="28px" color="primary" />
            <div class="text-body1 q-mt-sm">
              “Com a Onfly, aprovar viagens ficou leve. O time sabe o status de tudo e a gente ganha tempo.”
            </div>
            <div class="text-caption text-grey-7 q-mt-md">— Carol, People Ops</div>
          </q-card-section>
        </q-card>
        <q-card flat bordered class="col-12 col-md-6">
          <q-card-section>
            <q-icon name="format_quote" size="28px" color="primary" />
            <div class="text-body1 q-mt-sm">
              “Integração simples, Docker pronto e API clara. Subimos o ambiente sem dor de cabeça.”
            </div>
            <div class="text-caption text-grey-7 q-mt-md">— Diego, Tech Lead</div>
          </q-card-section>
        </q-card>
      </div>
    </section>

    <section class="cta q-py-xl">
      <div class="container text-center">
        <div class="text-h5 q-mb-sm">Pronto para uma gestão mais humana e eficiente?</div>
        <div class="text-body2 text-grey-7 q-mb-md">
          Experimente a Onfly. Você cuida das pessoas, a gente cuida do fluxo.
        </div>

        <div class="row justify-center q-gutter-sm">
          <template v-if="isAuthenticated">
            <q-btn color="primary" size="lg" unelevated label="Ir para o dashboard" @click="goToDashboard" />
            <q-btn flat color="primary" size="lg" label="Sair" @click="logout" />
          </template>
          <template v-else>
            <q-btn color="primary" size="lg" unelevated label="Criar conta" @click="goToRegister" />
            <q-btn flat color="primary" size="lg" label="Entrar" @click="goToLogin" />
          </template>
        </div>
      </div>
    </section>

    <TheFooter />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import TheHeader from 'src/components/TheHeader.vue';
import TheFooter from 'src/components/TheFooter.vue';
import { useAuthStore } from 'src/stores/auth';
import slide1 from 'src/assets/pexels-olly-838413.jpg';
import slide2 from 'src/assets/pexels-pixabay-46148.jpg';
import slide3 from 'src/assets/pexels-pixabay-265087.jpg';

const carouselImages = [
  { name: 's1', src: slide1, alt: 'Profissional com mala em aeroporto, viagem corporativa com conforto.' },
  { name: 's2', src: slide2, alt: 'Encontro de equipe, decisões ágeis e aprovações objetivas.' },
  { name: 's3', src: slide3, alt: 'Avião decolando, símbolo de movimento e produtividade.' }
];

const router = useRouter();
const carouselSlide = ref<'s1' | 's2' | 's3'>('s1');
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);

async function goToLogin(): Promise<void> {
  await router.push('/login');
}

async function goToRegister(): Promise<void> {
  await router.push('/register');
}

async function goToDashboard(): Promise<void> {
  await router.push('/');
}

async function logout(): Promise<void> {
  await authStore.logoutUser();
  await router.push('/login');
}
</script>

<style scoped>
.landing {
  background: radial-gradient(1200px 800px at 80% -100px, #e8f2ff 0%, transparent 60%), linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1120px;
  margin: 0 auto;
  padding-left: 16px;
  padding-right: 16px;
}

.hero {
  padding: 24px 0 48px;
}

.hero-title {
  font-size: clamp(28px, 4vw, 44px);
  line-height: 1.15;
  margin: 0;
  color: #1b263b;
}

.hero-subtitle {
  margin: 12px 0 0;
  font-size: 16px;
  color: #5f6b7a;
}

.highlight {
  color: #1e88e5;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  height: 38px;
  border: 1px solid #e6eef8;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: #315375;
  background: #f3f8ff;
  white-space: nowrap;
}

.carousel :deep(.q-carousel__slide) {
  background-color: transparent;
}

.carousel :deep(.q-carousel__control) {
  background: none;
}

.carousel :deep(.q-carousel__slides-container) {
  border-radius: 12px;
  overflow: hidden;
}

.carousel :deep(img) {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.card {
  padding: 16px;
  transition: transform .15s ease, box-shadow .15s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, .06);
}

.how {
  background: #f6f9fe;
}

.step {
  padding: 16px;
  position: relative;
}

.step-index {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1e88e5;
  color: white;
  display: grid;
  place-content: center;
  font-weight: 600;
}

.cta {
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
}

@media (max-width: 1024px) {
  .hero {
    padding-top: 8px;
  }
}
</style>

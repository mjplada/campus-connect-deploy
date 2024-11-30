<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';
import { fetchInitialUser, user } from '@/lib/userServices';

interface LoginForm {
  email: string;
  password: string;
}

const form = ref<LoginForm>({
  email: '',
  password: '',
});

const magicLinkEmail = ref<string>('');

const error = ref<string | null>(null);
const success = ref<string | null>(null);
const isCooldown = ref(false);
const router = useRouter();

const login = async () => {
  error.value = null;

  try {
    const { error: supabaseError } = await supabase.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password,
    });

    if (supabaseError) {
      error.value = supabaseError.message;
    } else {
      await fetchInitialUser();
      if (user?.value) {
        router.push('/');
      }
    }
  } catch (err) {
    console.error('Error en el login:', err);
    error.value = 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  }
};

const sendMagicLink = async () => {
  if (isCooldown.value) {
    error.value = 'Espera unos segundos antes de intentar de nuevo.';
    return;
  }

  error.value = null;
  success.value = null;
  isCooldown.value = true;

  try {
    const { error: supabaseError } = await supabase.auth.signInWithOtp({
      email: magicLinkEmail.value,
    });

    if (supabaseError) {
      error.value = supabaseError.message;
    } else {
      success.value = 'Magic Link enviado. Por favor revisa tu correo.';
      setTimeout(() => {
        isCooldown.value = false;
      }, 60000);
    }
  } catch (err) {
    console.error('Error enviando Magic Link:', err);
    error.value = 'Error enviando el Magic Link. Inténtalo nuevamente.';
    isCooldown.value = false;
  }
};
</script>

<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <input
        type="email"
        v-model="form.email"
        placeholder="Email"
        required
      />
      <input
        type="password"
        v-model="form.password"
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>

    <p>
      ¿Olvidaste tu contraseña?
      <router-link to="/forgot-password">Recupérala aquí</router-link>
    </p>

    <h3>O Inicia sesión con Magic Link</h3>
    <form @submit.prevent="sendMagicLink">
      <input
        type="email"
        v-model="magicLinkEmail"
        placeholder="Correo electrónico para Magic Link"
        required
      />
      <button :disabled="isCooldown" type="submit">
        {{ isCooldown ? 'Espera...' : 'Enviar Magic Link' }}
      </button>
    </form>

    <p v-if="success" style="color: green">{{ success }}</p>
    <p v-if="error" style="color: red">{{ error }}</p>
    <p>¿No tienes cuenta? <router-link to="/register">Regístrate aquí</router-link></p>
  </div>
</template>


<style scoped>
input {
  margin-bottom: 10px;
  padding: 10px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
}

button {
  background-color: #4caf50;
  color: white;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #45a049;
}

h3 {
  margin-top: 20px;
}
</style>

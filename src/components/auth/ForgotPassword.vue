<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';

const resetPasswordEmail = ref<string>('');
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const router = useRouter();

const resetPassword = async () => {
  error.value = null;
  success.value = null;

  try {
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail.value, {
      redirectTo: `${window.location.origin}/update-password`, 
    });

    if (supabaseError) {
      error.value = supabaseError.message;
    } else {
      success.value = 'Correo de recuperación enviado. Por favor revisa tu bandeja de entrada.';
    }
  } catch (err) {
    console.error('Error enviando correo de recuperación:', err);
    error.value = 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  }
};
</script>

<template>
  <div>
    <h2>Recuperar contraseña</h2>
    <p>Ingresa tu correo electrónico para recibir un enlace de recuperación de contraseña.</p>
    <form @submit.prevent="resetPassword">
      <input
        type="email"
        v-model="resetPasswordEmail"
        placeholder="Correo electrónico"
        required
      />
      <button type="submit">Enviar enlace de recuperación</button>
    </form>
    <p v-if="success" style="color: green">{{ success }}</p>
    <p v-if="error" style="color: red">{{ error }}</p>
    <p>¿Recordaste tu contraseña? <router-link to="/login">Inicia sesión aquí</router-link></p>
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

button:hover {
  background-color: #45a049;
}

p {
  margin-top: 10px;
}
</style>

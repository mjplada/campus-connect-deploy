<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';

const password = ref('');
const confirmPassword = ref('');
const success = ref<string | null>(null);
const error = ref<string | null>(null);
const router = useRouter();

const updatePassword = async () => {
  error.value = null;
  success.value = null;

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.';
    return;
  }

  try {
    const { error: supabaseError } = await supabase.auth.updateUser({
      password: password.value,
    });

    if (supabaseError) {
      error.value = supabaseError.message;
    } else {
      success.value = 'Contraseña actualizada exitosamente. Redirigiendo al login...';
      setTimeout(() => {
        router.push('/login');
      }, 3000); 
    }
  } catch (err) {
    console.error('Error actualizando contraseña:', err);
    error.value = 'Ocurrió un error inesperado. Inténtalo nuevamente.';
  }
};
</script>

<template>
  <div>
    <h2>Actualizar Contraseña</h2>
    <p>Por favor ingresa tu nueva contraseña.</p>
    <form @submit.prevent="updatePassword">
      <input
        type="password"
        v-model="password"
        placeholder="Nueva contraseña"
        required
      />
      <input
        type="password"
        v-model="confirmPassword"
        placeholder="Confirmar nueva contraseña"
        required
      />
      <button type="submit">Actualizar Contraseña</button>
    </form>

    <p v-if="success" style="color: green">{{ success }}</p>
    <p v-if="error" style="color: red">{{ error }}</p>
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

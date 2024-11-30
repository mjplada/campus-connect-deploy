<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { registerUser } from '@/lib/userServices';

interface RegisterForm {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  profilePicture: File | null;
}

const form = ref<RegisterForm>({
  username: '',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  profilePicture: null,
});

const error = ref<string | null>(null);
const success = ref<string | null>(null);
const router = useRouter();

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0] || null;
  form.value.profilePicture = file;
};

const register = async () => {
  error.value = null;
  success.value = null;

  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Las contraseñas no coinciden.';
    return;
  }

  try {
    await registerUser({
      username: form.value.username,
      fullName: form.value.fullName,
      email: form.value.email,
      password: form.value.password,
      profilePicture: form.value.profilePicture,
    });

    success.value = '¡Registro exitoso! Por favor verifica tu correo para confirmar tu cuenta.';
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Ocurrió un error inesperado.';
  }
};

</script>

<template>
  <div>
    <h2>Registro</h2>
    <form @submit.prevent="register">
      <input
        type="text"
        v-model="form.username"
        placeholder="Nombre de usuario"
        required
      />
      <input
        type="text"
        v-model="form.fullName"
        placeholder="Nombre completo"
        required
      />
      <input
        type="email"
        v-model="form.email"
        placeholder="Correo electrónico"
        required
      />
      <input
        type="password"
        v-model="form.password"
        placeholder="Contraseña"
        required
      />
      <input
        type="password"
        v-model="form.confirmPassword"
        placeholder="Confirmar contraseña"
        required
      />
      <input
        type="file"
        accept="image/*"
        @change="handleFileChange"
      />
      <button type="submit">Registrarse</button>
    </form>

    <p v-if="error" style="color: red">{{ error }}</p>
    <p v-if="success" style="color: green">{{ success }}</p>

    <p>¿Ya tienes una cuenta? <router-link to="/login">Inicia sesión aquí</router-link></p>
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

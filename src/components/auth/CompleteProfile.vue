<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabaseClient';

interface ProfileForm {
  username: string;
  fullName: string;
  profilePicture: File | null;
}

const form = ref<ProfileForm>({
  username: '',
  fullName: '',
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

const saveProfile = async () => {
  error.value = null;
  success.value = null;

  try {
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error('No estás autenticado.');

    const userId = user.id;

    let profilePictureUrl = null;

    if (form.value.profilePicture) {
      const fileName = `${userId}-${form.value.profilePicture.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, form.value.profilePicture);

      if (uploadError) throw uploadError;

      profilePictureUrl = `${import.meta.env.VITE_SUPABASE_STORAGE_URL}/profiles/${fileName}`;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: form.value.username,
        full_name: form.value.fullName,
        profile_picture: profilePictureUrl,
      });

    if (profileError) throw profileError;

    success.value = '¡Perfil actualizado con éxito!';
    setTimeout(() => {
      router.push('/');
    }, 3000);
  } catch (err: any) {
    error.value = err.message || 'Ocurrió un error inesperado.';
  }
};

onMounted(async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user) {
    router.push('/login');
  }
});
</script>

<template>
  <div>
    <h2>Completa tu perfil</h2>
    <form @submit.prevent="saveProfile">
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
        type="file"
        accept="image/*"
        @change="handleFileChange"
      />
      <button type="submit">Guardar</button>
    </form>

    <p v-if="error" style="color: red">{{ error }}</p>
    <p v-if="success" style="color: green">{{ success }}</p>
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
</style>

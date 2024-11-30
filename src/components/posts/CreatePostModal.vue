<template>
  <div class="create-post-modal">
    <form @submit.prevent="createPost" class="create-post-form">
      <textarea
        v-model="post.description"
        placeholder="Que estas pensando?..."
        rows="4"
        required
        class="description-field"
      ></textarea>

      <div class="form-actions">
        <button type="button" class="image-upload-button" @click="triggerFileInput">
          <font-awesome-icon icon="image" />
        </button>
        <input
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          ref="fileInput"
          class="hidden-file-input"
        />

        <span v-if="post.image" class="image-name">{{ post.image.name }}</span>

        <button :disabled="loading" type="submit" class="create-button">
          {{ loading ? 'Creando...' : 'Crear' }}
        </button>
      </div>
    </form>
  </div>
</template>


<script setup>
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { user } from '@/lib/userServices';

const emit = defineEmits(['post-created']);

const post = ref({
  description: '',
  image: null,
});

const loading = ref(false);

const fileInput = ref(null);

const triggerFileInput = () => {
  fileInput.value.click();
};

const resetForm = () => {
  post.value = {
    description: '',
    image: null,
  };

  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  post.value.image = file;
};

const createPost = async () => {
  loading.value = true;

  try {
    let imageUrl = null;

    if (post.value.image) {
      const fileName = `${Date.now()}-${post.value.image.name}`;
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, post.value.image);

      if (error) throw error;

      const { data: publicUrlData } = await supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      imageUrl = publicUrlData.publicUrl;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session?.user) {
      throw new Error('No se pudo obtener el usuario logueado.');
    }

    const userId = sessionData.session.user.id;

    const { error: postError } = await supabase
      .from('posts')
      .insert({
        description: post.value.description,
        image_url: imageUrl,
        user_id: userId,
        username: user.value.username,
      });

    if (postError) throw postError;

    console.log('Post creado exitosamente.');

    resetForm();

    emit('post-created');

  } catch (error) {
    console.error('Error creando el post:', error);
  } finally {
    loading.value = false;
  }
};

</script>

<style scoped>
.create-post-modal {
  background-color: #1e1e1e;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  margin: 0 auto 20px;
}

.create-post-modal h2 {
  color: white;
  text-align: center;
  margin-bottom: 20px;
}

.create-post-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.description-field {
  width: 100%;
  resize: none;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #444;
  border-radius: 5px;
  background-color: #2e2e2e;
  color: white;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.file-label {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: white;
}

.file-label svg {
  fill: white;
}

.file-input {
  display: none;
}

.create-button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.3s;
}

.create-button:hover {
  background-color: #45a049;
}

.create-button:disabled {
  background-color: #3e8e41;
  cursor: not-allowed;
}

.image-upload-button {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2e2e2e;
  border: 1px solid #444;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.image-upload-button svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.image-upload-button:hover {
  background-color: #3a3a3a;
}

.hidden-file-input {
  display: none;
}

.image-upload-button .fa-image,
.like-button .fa-heart {
  color: gray;
  font-size: 20px;
}

.liked .fa-heart {
  color: #e74c3c;
}

.image-name {
  color: white;
  font-size: 14px;
  margin-left: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
</style>

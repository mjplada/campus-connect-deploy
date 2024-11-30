<template>
  <div class="post-details post-item">
    <div class="post-image-container">
      <img v-if="post.image_url" :src="post.image_url" alt="Post Image" class="post-image" />
    </div>

    <div class="post-content">
      <p class="post-description">{{ post.description }}</p>
    </div>

    <div class="post-meta-row">
      <p class="post-meta">
        <strong>Creado por:</strong> {{ post.username || "Usuario desconocido" }}
      </p>
      <p class="post-meta">
        <strong>Fecha:</strong> {{ new Date(post.created_at).toLocaleString() }}
      </p>
    </div>

    <div class="post-actions">

      <button
        class="like-button"
        @click="toggleLike"
        :class="{ liked: userLiked }"
      >
        <font-awesome-icon :icon="[userLiked ? 'fas' : 'far', 'heart']" />
        {{ likeCount }}
      </button>

      <button class="comment-button">
        <font-awesome-icon :icon="['far', 'comment']" class="comment-icon" />
        {{ comments.length }}
      </button>
    </div>

    <p v-if="likeCount > 0" class="liked-by" @click="openLikedByPopup">
      <template v-if="likeCount === 1 && userLiked">
        Te gusta
      </template>
      <template v-else-if="userLiked && likeCount > 1">
        Te gusta a ti y a {{ likeCount - 1 }} más.
      </template>
      <template v-else>
        Le gusta a {{ likeCount }} personas.
      </template>
    </p>

    <div v-if="isPopupVisible" class="popup">
      <div class="popup-content">
        <h3>Usuarios a los que les gusta este post</h3>
        <ul>
          <li v-for="user in usersLikesDetails" :key="user.id">{{ user.username }}</li>
        </ul>
        <button @click="closePopup">Cerrar</button>
      </div>
    </div>

    <div class="comments-section">
      <h3>Comentarios</h3>
      <ul>
        <li v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-header">
            <strong class="comment-username">{{ comment.username }}</strong>
            <span class="comment-date">{{ new Date(comment.created_at).toLocaleString() }}</span>
          </div>
          <p class="comment-content">{{ comment.content }}</p>
        </li>
      </ul>
      <textarea
        v-model="newComment"
        placeholder="Escribe un comentario"
        class="comment-input"
      ></textarea>
      <div class="comment-actions">
        <button @click="addComment" class="add-comment-button">Comentar</button>
        <button v-if="isCreator" @click="deletePost" class="delete-button">Borrar Post</button>
      </div>
    </div>
  </div>
</template>

  
<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const postId = route.params.id;

const post = ref({});
const comments = ref([]);
const likeCount = ref(0);
const userLiked = ref(false);
const newComment = ref('');
const isCreator = ref(false);
const isPopupVisible = ref(false);
const usersLikesDetails = ref([]);

const openLikedByPopup = () => {
  isPopupVisible.value = true;
};

const closePopup = () => {
  isPopupVisible.value = false;
};


const fetchPostDetails = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        description,
        image_url,
        created_at,
        user_id,
        profiles (username)
      `)
      .eq('id', postId)
      .single();

    if (postError) throw postError;

    post.value = {
      ...postData,
      username: postData.profiles?.username || 'Usuario desconocido',
    };

    isCreator.value = userId === postData.user_id;

    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('profiles (id, username)')
      .eq('post_id', postId);

    if (likesError) throw likesError;    

    usersLikesDetails.value = likesData.map(like => ({
      id: like.profiles.id,
      username: like.profiles.username || 'Usuario desconocido',
    }));

    userLiked.value = usersLikesDetails.value.some(user => user.id === userId);
    likeCount.value = usersLikesDetails.value.length;

    const { data: commentData, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id, content, created_at, profiles (username)')
      .eq('post_id', postId);

    if (commentError) throw commentError;

    comments.value = commentData.map(comment => ({  
      ...comment,
      username: comment.profiles?.username || 'Usuario desconocido'
    }));
  } catch (error) {
    console.error('Error al obtener los detalles del post:', error);
  }
};

const deletePost = async () => {
  const confirmation = confirm('¿Estás seguro de que deseas borrar este post?');
  if (!confirmation) return;

  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    alert('Post eliminado exitosamente.');
    router.push('/'); 
  } catch (error) {
    console.error('Error al borrar el post:', error);
    alert('Ocurrió un error al intentar borrar el post.');
  }
};


const toggleLike = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      alert('Debes iniciar sesión para interactuar con el post.');
      return;
    }

    if (userLiked.value) {

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (error) throw error;

      userLiked.value = false;
      likeCount.value--;
    } else {
      const { error } = await supabase
        .from('likes')
        .insert({ post_id: postId, user_id: userId });

      if (error) throw error;

      userLiked.value = true;
      likeCount.value++;
    }
  } catch (error) {
    console.error('Error al alternar like:', error);
  }
};

const addComment = async () => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!newComment.value.trim()) return;

    await supabase.from('comments').insert({
      post_id: postId,
      user_id: userId,
      content: newComment.value.trim(),
    });

    newComment.value = '';
    await fetchPostDetails();
  } catch (error) {
    console.error('Error al agregar comentario:', error);
  }
};

onMounted(fetchPostDetails);
</script>

<style scoped>
.post-details {
  width: 800px;
  min-width: 800px;
  margin: 0 auto;
  background-color: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  padding: 20px;
}

.post-image-container {
  width: 100%;
  height: 400px;
  background-color: #2a2a2a;
  display: flex;
  justify-content: center;
  align-items: center;
}

.post-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}


.post-content {
  padding: 15px;
  text-align: center;
}

.post-description {
  font-size: 14px;
  color: #e0e0e0;
}

.post-meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #aaa;
  padding: 0 10px;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  padding: 10px 0;
  border-top: 1px solid #444;
}

.like-button,
.comment-button {
  background: none !important;
  border: none;
  cursor: pointer;
  color: #aaa;
  display: flex;
  align-items: center;
  transition: color 0.2s ease-in-out;
  font-size: 16px;
}

.like-button svg {
  margin-right: 5px;
  font-size: 20px;
}

.comment-button .comment-icon {
  margin-right: 5px;
  font-size: 18px;
}

.like-button:hover,
.comment-button:hover {
  color: #4caf50;
}

.like-button.liked {
  color: #e74c3c;
}

.liked-by {
  font-size: 14px;
  color: #aaa;
  margin-top: 10px;
  cursor: pointer;
}

.liked-by:hover {
  color: #4caf50;
}

.comments-section {
  margin-top: 20px;
}

.comments-section ul {
  list-style: none;
  padding: 0;
}

.comment-item {
  background-color: #2a2a2a;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.comment-username {
  font-weight: bold;
  color: #4caf50;
}

.comment-date {
  font-size: 12px;
  color: #aaa;
  text-align: right;
}

.comment-content {
  margin-top: 5px;
  font-size: 14px;
  line-height: 1.5;
  color: #ccc;
}

.comment-input {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  border: 1px solid #444;
  background-color: #1e1e1e;
  color: #fff;
}

.comment-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.add-comment-button {
  background-color: #4caf50;
  color: #fff;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.add-comment-button:hover {
  background-color: #45a049;
}

.delete-button {
  background-color: #e74c3c;
  color: #fff;
  padding: 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.delete-button:hover {
  background-color: #c0392b;
}

.popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background: #2a2a2a;
  color: #e0e0e0;
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  text-align: center;
}

.popup-content h3 {
  margin-bottom: 20px;
  font-size: 18px;
  color: #ffffff;
}

.popup-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.popup-content ul li {
  margin-bottom: 10px;
  font-size: 14px;
  color: #ccc;
}

.popup-content button {
  margin-top: 20px;
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.popup-content button:hover {
  background: #45a049;
}

</style>

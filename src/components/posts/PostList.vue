<template>
  <div class="post-list-container">
    <div class="create-post-container">
      <CreatePostModal @post-created="fetchPosts" />
    </div>

    <div class="content-container">
      <div v-if="loading" class="skeleton-container">
        <div v-for="n in 3" :key="n" class="skeleton-item">
          <div class="skeleton-image"></div>
          <div class="skeleton-text skeleton-title"></div>
          <div class="skeleton-text skeleton-meta"></div>
          <div class="skeleton-text skeleton-meta"></div>
        </div>
      </div>

      <span v-if="totalPosts === 0">No hay posts disponibles.</span>

      <div v-else class="post-list">
        <div v-for="post in posts" :key="post.id" class="post-item">
          <div class="post-image-container">
            <img
              v-if="post.image_url"
              :src="post.image_url"
              alt="Post Image"
              class="post-image"
            />
          </div>

          <div class="post-content">
            <p class="post-description">{{ post.description }}</p>

            <div class="post-meta-row">
              <p class="post-meta">
                <strong>Creado por:</strong>
                {{ post.username || "Usuario desconocido" }}
              </p>
              <p class="post-meta">
                <strong>Fecha:</strong>
                {{ new Date(post.created_at).toLocaleString() }}
              </p>
            </div>
          </div>

          <div class="post-actions">
            <button class="like-button" @click.stop="toggleLike(post)">
              <font-awesome-icon
                :icon="[post.isLiked ? 'fas' : 'far', 'heart']"
                :class="{ liked: post.isLiked, outline: !post.isLiked }"
              />
              {{ post.likes_count || 0 }}
            </button>

            <button @click.stop="openPostDetails(post.id)" class="comment-button">
              <font-awesome-icon :icon="['far', 'comment']" class="comment-icon" />
              {{ post.comments_count || 0 }}
            </button>
          </div>
        </div>
        <div class="pagination">
          <button @click="goToPreviousPage" :disabled="currentPage === 1">Anterior</button>
          <span>Página {{ currentPage }} de {{ totalPages }}</span>
          <button @click="goToNextPage" :disabled="currentPage === totalPages">Siguiente</button>
        </div>



      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { supabase } from "@/lib/supabaseClient";
import CreatePostModal from "./CreatePostModal.vue";
import { useRouter } from "vue-router";

const posts = ref([]);
const loading = ref(false);
const showCreatePostModal = ref(false);
const router = useRouter();
const currentPage = ref(1);
const postsPerPage = ref(5);
const totalPosts = ref(0);
const totalPages = computed(() => Math.ceil(totalPosts.value / postsPerPage.value));


const toggleLike = async (post) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      alert("Debes iniciar sesión para interactuar con los posts.");
      return;
    }

    const userId = session.session.user.id;

    if (post.isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);

      if (error) throw error;

      post.isLiked = false;
      post.likes_count = Math.max((post.likes_count || 1) - 1, 0);
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ post_id: post.id, user_id: userId });

      if (error) throw error;

      post.isLiked = true;
      post.likes_count = (post.likes_count || 0) + 1;
    }
  } catch (error) {
    console.error("Error al alternar like:", error);
  }
};

const openPostDetails = (postId) => {
  router.push({ path: `/posts/${postId}` });
};

const fetchPosts = async () => {
  loading.value = true;

  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    const start = (currentPage.value - 1) * postsPerPage.value;
    const end = start + postsPerPage.value - 1;

    const { data, count, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        description,
        image_url,
        created_at,
        user_id,
        likes_count,
        comments_count,
        profiles (username),
        likes (user_id)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(start, end);

    if (error) throw error;

    totalPosts.value = count;
    posts.value = data.map((post) => ({
      ...post,
      username: post.profiles?.username || "Usuario desconocido",
      isLiked: post.likes.some((like) => like.user_id === userId),
    }));
  } catch (error) {
    console.error("Error al obtener los posts:", error);
  } finally {
    loading.value = false;
  }
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1;
    fetchPosts();
  }
};

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
    fetchPosts();
  }
};




onMounted(fetchPosts);
</script>

<style scoped>
.post-list-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.post-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 0;
  width: 100%;
}

.post-item {
  background-color: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 10px;
  border: 1px solid #333;
  margin: 0 auto;
}

.post-clickable {
  cursor: pointer;
  transition: background-color 0.2s;
}

.post-clickable:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.post-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  border-bottom: 1px solid #444;
  height: auto;
}

.post-description {
  margin: 15px 10px 5px;
  font-size: 14px;
  color: #e0e0e0;
}

.post-content {
  width: 100%;
  padding: 15px;
  box-sizing: border-box;
}

.post-meta-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
}

.post-meta {
  font-size: 12px;
  color: #aaa;
  margin: 0;
}

.post-creator {
  text-align: left;
}

.post-date {
  text-align: right;
}

.post-actions {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  padding: 10px 15px;
  border-top: 1px solid #444;
}

.like-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  color: #aaa;
  transition: color 0.2s ease-in-out;
}

.like-button:hover {
  color: #4caf50;
}

.like-button .liked {
  color: #e74c3c;
}

.like-button .outline {
  color: #aaa;
}

.like-button > svg {
  margin-right: 5px;
  font-size: 20px;
}

.comment-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #aaa;
  display: flex;
  align-items: center;
  font-size: 16px;
  transition: color 0.3s ease-in-out;
}

.comment-button .comment-icon {
  margin-right: 5px;
  font-size: 18px;
}

.comment-button:hover {
  color: #4caf50;
}

.comment-button:focus {
  outline: none;
}

.comment-button > svg {
  margin-right: 5px;
}

.create-post-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: 1px solid white;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s, color 0.3s;
  margin-bottom: 20px;
}

.create-post-btn:hover {
  background-color: #45a049;
}

.create-post-btn:focus {
  outline: none;
}

.no-posts,
.loading {
  font-size: 16px;
  color: #ccc;
  text-align: center;
  margin-top: 20px;
}
.create-post-container {
  background-color: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.skeleton-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 600px;
}

.skeleton-item {
  width: 100%;
  max-width: 600px;
  background-color: #1e1e1e;
  border-radius: 10px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-image {
  width: 100%;
  height: 200px;
  background: linear-gradient(90deg, #2e2e2e 25%, #3a3a3a 50%, #2e2e2e 75%);
  background-size: 400% 100%;
  border-radius: 8px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-text {
  width: 100%;
  height: 20px;
  background: linear-gradient(90deg, #2e2e2e 25%, #3a3a3a 50%, #2e2e2e 75%);
  background-size: 400% 100%;
  border-radius: 4px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-title {
  width: 80%;
  height: 24px;
}

.skeleton-meta {
  width: 50%;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.pagination button {
  padding: 10px 15px;
  border: none;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  border-radius: 5px;
  transition: background-color 0.3s;
}

.pagination button:disabled {
  background-color: #888;
  cursor: not-allowed;
}

.pagination button:hover:not(:disabled) {
  background-color: #45a049;
}

@keyframes skeleton-loading {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 0%;
  }
}
</style>

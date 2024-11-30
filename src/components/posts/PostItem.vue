<template>
    <div class="post-item">
      <h3>{{ post.title }}</h3>
      <p>{{ post.content }}</p>
      <p><strong>Likes:</strong> {{ post.like_count }} | <strong>Comentarios:</strong> {{ post.comment_count }}</p>
      <button @click="toggleLike">{{ userLiked ? 'Unlike' : 'Like' }}</button>
      <button @click="$emit('view-details', post.id)">Ver Detalles</button>
    </div>
  </template>
  
  <script setup>
  import { ref, watchEffect } from 'vue';
  import { supabase } from '@/lib/supabaseClient';
  
  const props = defineProps({
    post: Object,
  });
  
  const userLiked = ref(false);
  
  const fetchLikes = async () => {
    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', props.post.id)
      .eq('user_id', supabase.auth.user()?.id);
  
    userLiked.value = !!data?.length;
  };
  
  const toggleLike = async () => {
    if (userLiked.value) {
      // Eliminar like
      await supabase
        .from('likes')
        .delete()
        .eq('post_id', props.post.id)
        .eq('user_id', supabase.auth.user()?.id);
  
      userLiked.value = false;
    } else {
      // Dar like
      await supabase
        .from('likes')
        .insert({ post_id: props.post.id, user_id: supabase.auth.user()?.id });
  
      userLiked.value = true;
    }
  };
  
  onMounted(fetchLikes);
  </script>
  
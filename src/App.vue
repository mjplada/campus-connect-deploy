<script setup lang="ts">
import { onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { fetchInitialUser, handleLogout, user, userProfile, searchUsers  } from '@/lib/userServices';
import { defineProps } from "vue";

defineProps({
  userId: {
    type: String,
    required: true,
  },
});

const isMenuOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const router = useRouter();

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleSearch = async () => {
  try {
    if (searchQuery.value.trim()) {
      searchResults.value = await searchUsers(searchQuery.value);
    } else {
      searchResults.value = [];
    }
  } catch (error) {
    console.error('Error during search:', error);
    searchResults.value = [];
  }
};

const goToProfile = (userId: string) => {
  searchQuery.value = "";
  searchResults.value = [];
  router.push(`/profile/${userId}`);
};

onMounted(async () => {
  await fetchInitialUser();
  if (!user.value) {
    router.push('/login');
  }
});
const userName = computed(() => userProfile.value.firstName || 'Usuario');
</script>

<template>
  <header class="navbar">
    <div class="navbar-left">
      <img
        class="logo"
        src="@/assets/logo.svg"
        alt="Campus Connect Logo"
        @click="router.push('/')"
      />
      <button class="nav-button" @click="router.push('/')">Home</button>
    </div>


    <div class="navbar-center search-wrapper">
      <input
        class="search-bar"
        type="text"
        placeholder="Search users..."
        v-model="searchQuery"
        @input="handleSearch"
      />
      <ul v-if="searchResults.length" class="search-dropdown">
        <li
          v-for="user in searchResults"
          :key="user.id"
          class="search-result-card"
          @click="goToProfile(user.id)"
        >
          <img
            :src="user.profile_picture || 'default-image.jpg'"
            alt="Profile Picture"
            class="profile-picture-large"
          />
          <div class="user-details">
            <h2 class="full-name">{{ user.full_name }}</h2>
            <p class="username">@{{ user.username }}</p>
            <p class="email">{{ user.email }}</p>
          </div>
        </li>
      </ul>
    </div>


    <div class="navbar-right">
      <div v-if="user" class="profile-section">
        <div class="profile-dropdown" @click="toggleMenu">
          <img
            v-if="userProfile.profile_picture"
            :src="userProfile.profile_picture"
            alt="Profile Picture"
            class="profile-picture"
          />
          <span class="user-first-name">{{ userProfile.firstName }}</span>
          <div v-if="isMenuOpen" class="dropdown-menu">
            <button class="menu-item" @click="goToProfile(user.id)">Mi perfil</button>
            <button class="menu-item" @click="handleLogout(router)">Logout</button>
          </div>
        </div>
      </div>
      <div v-else>
        <router-link class="auth-link" to="/login">Iniciar sesión</router-link>
      </div>
    </div>
  </header>

  <main class="main-content">
    <RouterView />
  </main>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #333;
  color: white;
  padding: 10px 20px;
  z-index: 1000;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.navbar-left,
.navbar-right {
  display: flex;
  align-items: center;
}

.navbar-center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  position: relative;
}

.logo {
  width: 40px;
  height: auto;
  cursor: pointer;
}

.nav-button {
  margin-left: 10px;
  background: none;
  color: white;
  border: 1px solid white;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.nav-button:hover {
  background-color: #4caf50;
}

.search-bar {
  padding: 5px 10px;
  width: 100%;
  border: none;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
}

.profile-section {
  display: flex;
  align-items: center;
}

.profile-dropdown {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
}

.profile-picture {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
}

.user-first-name {
  font-weight: bold;
  margin-right: 5px;
}

.dropdown-menu {
  position: absolute;
  top: 40px;
  right: 0;
  background-color: white;
  color: black;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.menu-item {
  padding: 10px 15px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background-color: #f0f0f0;
}

.auth-link {
  color: #4caf50;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s ease;
}

.auth-link:hover {
  color: #45a049;
}

.main-content {
  margin-top: 70px;
  padding-top: 70px;
  width: 100%;
  max-width: 800px;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.search-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #2c2c2c;
  border: 1px solid #444;
  border-radius: 10px;
  margin-top: 5px;
  padding: 10px 0;
  z-index: 2000;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.search-result-card {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  background: #333;
}

.search-result-card:hover {
  background-color: #444;
}

.profile-picture-large {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  border: 1px solid #555;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.full-name {
  font-size: 16px;
  font-weight: bold;
  margin: 0;
  color: #41B883;
}

.username {
  font-size: 13px;
  color: #ccc;
  margin: 0;
}

.email {
  font-size: 12px;
  color: #aaa;
  margin: 0;
}
</style>

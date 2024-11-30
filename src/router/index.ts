import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import Login from '../views/LoginView.vue';
import Register from '@/components/auth/Register.vue';
import CompleteProfile from '@/components/auth/CompleteProfile.vue';
import ForgotPassword from '@/components/auth/ForgotPassword.vue';
import UpdatePassword from '@/components/auth/UpdatePassword.vue';
import { fetchInitialUser, user } from '@/lib/userServices';
import PostList from '@/components/posts/PostList.vue';
import PostDetail from '@/components/posts/PostDetail.vue';
import ProfilePosts from '@/components/posts/ProfilePosts.vue';


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/forgot-password', component: ForgotPassword },
    { path: '/update-password', component: UpdatePassword },
    {
      path: '/complete-profile',
      name: 'CompleteProfile',
      component: CompleteProfile,
    },
    {
      path: '/',
      name: 'home',
      component: PostList,
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: PostDetail,
    },
    {
      path: '/profile/:userId',
      name: 'profile',
      component: ProfilePosts,
      props: true,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  try {
    const publicPaths = ['/login', '/register', '/forgot-password'];

    if (!user.value) {
      await fetchInitialUser();

      if (!user?.value && !publicPaths.includes(to.path)) {
        console.log('No hay sesión activa. Redirigiendo al login.');
        return next('/login');
      }
    }

    if (user.value && publicPaths.includes(to.path)) {
      console.log('Usuario autenticado. Redirigiendo al home.');
      return next('/');
    }

    if (user.value) {
      const { username, fullName } = user.value;
      const isProfileComplete = username && fullName;

      if (!isProfileComplete && to.path !== '/complete-profile') {
        console.log('Perfil incompleto. Redirigiendo a completar perfil.');
        return next('/complete-profile');
      }

      if (isProfileComplete && to.path === '/complete-profile') {
        console.log('Perfil completo. Redirigiendo al home.');
        return next('/');
      }
    }

    next();
  } catch (error) {
    console.error('Error en el beforeEach:', error);
    return next('/login');
  }
});




export default router;

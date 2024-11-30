import { ref } from 'vue';
import { supabase } from './supabaseClient';
import { useRouter, type Router } from 'vue-router';

export const user = ref<User | null>(null);
export const userProfile = ref({
  firstName: '',
  profile_picture: '',
});

const router = useRouter();

export const fetchInitialUser = async () => {
  if (user.value && userProfile.value.firstName && userProfile.value.profile_picture) {
    console.log('Usuario ya cargado en memoria, no se realiza nueva consulta.');
    return;
  }

  try {
    const { data: session, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (session?.session?.user) {
      const { id, email } = session.session.user;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, profile_picture')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      const [firstName] = profile.full_name.split(' ');
      user.value = {
        id: id,
        email: email ?? "email-desconocido@example.com",
        username: profile.username,
        full_name: profile.full_name ?? "Nombre desconocido",
        profile_picture: profile.profile_picture ?? "sin foto",
      };
      userProfile.value = { firstName, profile_picture: '' };

      if (profile.profile_picture) {
        await downloadProfilePicture(profile.profile_picture);
      }
    }
  } catch (err) {
    console.error('Error al cargar el usuario inicial:', err);
    resetUserState();
  }
};

const downloadProfilePicture = async (fileName: string) => {
  try {
    const { data, error } = await supabase.storage.from('profiles').download(fileName);
    if (error) throw error;

    const blobUrl = URL.createObjectURL(data);
    userProfile.value.profile_picture = blobUrl;
  } catch (err) {
    console.error('Error al descargar la imagen de perfil:', err);
    userProfile.value.profile_picture = '';
  }
};

const downloadProfilesPictures = async (fileName: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage.from('profiles').download(fileName);
    if (error) throw error;

    const blobUrl = URL.createObjectURL(data);
    return blobUrl;
  } catch (err) {
    console.error('Error al descargar la imagen de perfil:', err);
    return '';
  }
};


export const handleLogout = async (router: Router) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    resetUserState();
    router.push('/login');
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
  }
};

export async function searchUsers(query: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, profile_picture, email')
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`);

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  const results = await Promise.all(
    data.map(async (profile) => {
      if (profile.profile_picture) {
        const pictureUrl = await downloadProfilesPictures(profile.profile_picture);
        return { ...profile, profile_picture: pictureUrl };
      }
      return profile;
    })
  );

  return results;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, full_name, profile_picture, email")
    .eq("id", userId)
    .single();

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  const pictureUrl = await downloadProfilesPictures(data.profile_picture);
  const results = { ...data, profile_picture: pictureUrl };

  return results;
}

const resetUserState = () => {
  user.value = null;
  userProfile.value = { firstName: '', profile_picture: '' };
};

export const registerUser = async ({
  username,
  fullName,
  email,
  password,
  profilePicture,
}: {
  username: string;
  fullName: string;
  email: string;
  password: string;
  profilePicture: File | null;
}) => {
  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) throw signUpError;

  const userId = data.user?.id;
  if (!userId) throw new Error('No se pudo obtener el ID del usuario.');

  let profilePictureUrl = null;

  if (profilePicture) {
    const fileName = `${userId}-${profilePicture.name}`;
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(fileName, profilePicture);

    if (uploadError) throw uploadError;

    profilePictureUrl = fileName;
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    username,
    full_name: fullName,
    profile_picture: profilePictureUrl,
    email: email,
  });

  if (profileError) throw profileError;

  return true;
};

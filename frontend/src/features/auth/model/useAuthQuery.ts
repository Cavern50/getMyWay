import { authApi } from '@/features/auth/api/authApi'
import { useAuthStore } from './useAuthStore'
import { useMutation } from 'vue-query'
import { useRouter } from 'vue-router'

export function useLoginMutation() {
  const authStore = useAuthStore();
  const router = useRouter();

  return useMutation(authApi.login, {
    onSuccess: (data) => {
      authStore.login(data.name, data.token);
      router.push('/map');
    },
  })
}

export function useRegisterMutation() {
  const authStore = useAuthStore()
  const router = useRouter()

  return useMutation(authApi.register, {
    onSuccess: (data) => {
      authStore.login(data.name, data.token);
      router.push('/map');
    },
    onError: (err) => console.error(err)
  })
}
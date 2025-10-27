<script setup lang="ts">
import { ref } from 'vue'
import { useLoginMutation } from '../model/useAuthQuery';
import { Alert } from '@/shared/ui';
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'

defineProps<{ msg: string }>()

const errorMessage = ref('');

const schema = yup.object({
  email: yup.string().email('Некорректный формат email').required('Введите email'),
  password: yup.string().min(3).required('Введите пароль')
})

const { handleSubmit } = useForm({ validationSchema: schema })

const { value: email, errorMessage: emailError } = useField('email')
const { value: password, errorMessage: passwordError } = useField('password')


const showAlert = (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    setTimeout(() => errorMessage.value = '', 300) // После анимации скрытия
  }, 3000) // 3 секунды
}

const loginMutation = useLoginMutation();

const onSubmit = handleSubmit(values => {
  loginMutation.mutate(
    { email: values.email, password: values.password },
    {
      onError: (error: any) => {
        showAlert(error?.response?.data?.message || 'Ошибка авторизации')
      }
    }
  )
})

</script>

<template>
  <div class="relative">
    <Alert :message="errorMessage" type="error" :show="Boolean(errorMessage)" />

    <form @submit.prevent="onSubmit" class="flex flex-col gap-2 items-center justify-center h-screen">
      <h1 class="text-3xl font-bold">Авторизация</h1>

      <div class="w-full max-w-xs">
        <input type="email" v-model="email" placeholder="Введите вашу электронную почту"
          :class="['input input-bordered w-full', emailError ? 'input-error' : '']">
        <span v-if="emailError" class="text-error text-sm mt-1 block">{{ emailError }}</span>
      </div>

      <div class="w-full max-w-xs">
        <input type="password" v-model="password" placeholder="Введите ваш пароль"
          :class="['input input-bordered w-full', passwordError ? 'input-error' : '']">
        <span v-if="passwordError" class="text-error text-sm mt-1 block">{{ passwordError }}</span>
      </div>

      <button class="btn btn-primary" :disabled="loginMutation.isPending || emailError || passwordError">
        <span v-if="loginMutation.isPending" class="loading loading-spinner loading-sm"></span>
        <span v-else>Войти</span>
      </button>
      <p>Нет аккаунта? <RouterLink to="/register" class="link">Зарегистрироваться</RouterLink>
      </p>
    </form>
  </div>
</template>

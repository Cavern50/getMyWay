<script setup lang="ts">
import { ref } from 'vue'
import { useRegisterMutation } from '../model/useAuthQuery'
import * as yup from 'yup'
import { useForm, useField } from 'vee-validate'
import { Alert } from '@/shared/ui';

const errorMessage = ref('');

const schema = yup.object({
  name: yup.string().max(50).required('Введите имя пользователя'),
  email: yup.string().email('Некорректный формат email').required('Введите email'),
  password: yup.string().min(3).required('Введите пароль')
})

const { handleSubmit } = useForm({ validationSchema: schema })

const { value: name, errorMessage: nameError } = useField('name')
const { value: email, errorMessage: emailError } = useField('email')
const { value: password, errorMessage: passwordError } = useField('password')



const registerMutation = useRegisterMutation();

const showAlert = (message: string) => {
  errorMessage.value = message
  setTimeout(() => {
    setTimeout(() => errorMessage.value = '', 300) // После анимации скрытия
  }, 3000) // 3 секунды
}

const onSubmit = handleSubmit((values) => {
  registerMutation.mutate({ name: values.name, email: values.email, password: values.password }, {
    onError: (error: any) => {
      showAlert(error?.response?.data?.message || 'Ошибка авторизации')
    }
  })
})


</script>

<template>
  <Alert :message="errorMessage" type="error" :show="Boolean(errorMessage)" />
  <form @submit.prevent="onSubmit" class="flex flex-col gap-2 items-center justify-center h-screen">
    <h1 class="text-3xl font-bold">Регистрация</h1>
    <div class="w-full max-w-xs">
      <input type="text" v-model="name" placeholder="Введите ваше имя"
        :class="['input input-bordered w-full', nameError ? 'input-error' : '']">
      <span v-if="emailError" class="text-error text-sm mt-1 block">{{ nameError }}</span>
    </div>
    <div class="w-full max-w-xs">
      <input type="email" v-model="email" placeholder="Введите вашу электронную почту"
        :class="['input input-bordered w-full', emailError ? 'input-error' : '']">
      <span v-if="emailError" class="text-error text-sm mt-1 block">{{ emailError }}</span>
    </div>
    <div class="w-full max-w-xs">
      <input type="password" v-model="password" placeholder="Введите ваш пароль"
        :class="['input input-bordered w-full', passwordError ? 'input-error' : '']">
      <span v-if="emailError" class="text-error text-sm mt-1 block">{{ passwordError }}</span>
    </div>
    <button class="btn btn-primary">Зарегистрироваться</button>
    <p>Уже зарегистрированы? <RouterLink to="/login" class="link">Войти</RouterLink>
    </p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RegisterForm from '@/features/auth/components/RegisterForm.vue';
defineProps<{ msg: string }>()

const count = ref(0)  
</script>
<template>
    <RegisterForm msg="s" />
</template>
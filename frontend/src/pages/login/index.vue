<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from '@/features/auth/components/LoginForm.vue'
defineProps<{ msg: string }>()

const count = ref(0)  
</script>
<template>
    <LoginForm msg="s"/>
</template>
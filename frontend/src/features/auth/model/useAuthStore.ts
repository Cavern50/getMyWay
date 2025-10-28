import { defineStore } from 'pinia'

export const useAuthStore = defineStore('user', {
  state: () => ({
    userName: '',
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    login(name: string, token: string) {
      this.userName = name;
      this.token = token;
      localStorage.setItem('token', token);
    },
    logout() {
      this.userName = '';
      this.token = '';
      localStorage.removeItem('token');
    }
  }
})
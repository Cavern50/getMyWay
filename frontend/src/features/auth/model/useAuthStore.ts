import { defineStore } from 'pinia'

export const useAuthStore = defineStore('user', {
  state: () => ({
    userName: localStorage.getItem('userName') || '',
    token: localStorage.getItem('token') || '',
  }),
  actions: {
    login(name: string, token: string) {
      this.userName = name;
      this.token = token;
      localStorage.setItem('token', token);
      localStorage.setItem('userName', name);
    },
    logout() {
      this.userName = '';
      this.token = '';
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
    }
  }
})
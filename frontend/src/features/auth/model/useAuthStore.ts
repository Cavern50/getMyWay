import { defineStore } from 'pinia'

export const useAuthStore = defineStore('user', {
  state: () => ({
    userName: localStorage.getItem('userName') || '',
    token: localStorage.getItem('token') || '',
    userId: localStorage.getItem('userId') || ''
  }),
  actions: {
    login(name: string, token: string, id: string) {
      this.userName = name;
      this.token = token;
      this.userId = id;
      localStorage.setItem('token', token);
      localStorage.setItem('userName', name);
      localStorage.setItem('userId', id)
    },
    logout() {
      this.userName = '';
      this.token = '';
      this.userId = '';
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
    }
  }
})
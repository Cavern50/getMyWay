import { defineStore } from 'pinia'

export const useAuthStore = defineStore('user', {
  state: () => ({
    userName: '',
    token: ''
  }),
  actions: {
    login(name: string, token: string) {
      this.userName = name;
      this.token = token;
    },
    logout() {
      this.userName = '';
      this.token = '';
    }
  }
})
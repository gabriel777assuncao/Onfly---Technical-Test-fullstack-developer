import { store } from 'quasar/wrappers'
import { createPinia } from 'pinia'

export const pinia = createPinia();

export default store(() => {
  return pinia;
});

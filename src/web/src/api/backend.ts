import { ApiClient } from '@defikarte/shared';

// todo: use values from app-configuration
export default new ApiClient({
  baseUrl:
    import.meta.env.VITE_BACKEND_API ?? 'https://defikarte-backend-staging.azurewebsites.net/api/',
  apiKey: import.meta.env.VITE_BACKEND_API_KEY ?? '',
});

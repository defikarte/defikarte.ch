import { ApiClient } from '@defikarte/shared';
import AppConfiguration from '../configuration/app.configuration';

export default new ApiClient({
  baseUrl: AppConfiguration.baseUrl,
  apiKey: AppConfiguration.backendApiKey,
});

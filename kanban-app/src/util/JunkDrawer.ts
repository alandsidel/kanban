import { consts } from '../consts';
import axios from 'axios';

// Helper function to create axios client
export function createAxiosAPIClient() {
  return axios.create({
    withCredentials: true,
    baseURL: consts.API_URL,
    validateStatus: () => true
  });
}

export function appendErrorDetail(msg: string, error: unknown): string {
  if (error instanceof Error) {
    return msg + ': ' + error.message;
  } else {
    return msg;
  }
}

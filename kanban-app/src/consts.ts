const env = import.meta.env;

const _consts = {
  DEVMODE   : env.DEVMODE            || false,
  API_URL   : env.API_URL            || env.PROD ? '/api/' : env.VITE_API_URL,
}

export const consts = Object.freeze(_consts);

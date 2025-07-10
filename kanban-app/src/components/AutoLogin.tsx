import { useEffect } from 'react';
import axios from 'axios';
import { consts } from '../consts';
import { useDispatch } from 'react-redux';
import { assignUserState } from '../lib/redux/UserStateSlice';

function AutoLogin(props: { setFirstLoad: (arg0: boolean) => void; }) {
  const dispatch = useDispatch();

  useEffect(() => {
    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAuth() {
    const client = axios.create({withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const resp = await client.get('/authcheck/');
    if (resp.status == 200) {
      dispatch(assignUserState(resp.data));
    }
    props.setFirstLoad(false);
  }

  return (<></>);
}

export default AutoLogin;

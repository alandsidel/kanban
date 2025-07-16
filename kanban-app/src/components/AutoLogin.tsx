import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../lib/redux/UserStateSlice';
import { AppDispatch } from '../lib/redux/redux-store';

function AutoLogin(props: { setFirstLoad: (arg0: boolean) => void; }) {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const performAuthCheck = async () => {
      await dispatch(checkAuth());
      props.setFirstLoad(false);
    };

    performAuthCheck();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (<></>);
}

export default AutoLogin;

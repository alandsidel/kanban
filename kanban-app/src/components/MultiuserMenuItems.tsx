import { consts } from '../consts.ts';
import { faPersonWalkingDashedLineArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch } from 'react-redux';
import { clearUserState } from '../lib/redux/UserStateSlice';
import { assignProjectState } from '../lib/redux/ProjectStateSlice';
import axios from 'axios';

function MultiuserMenuItems() {
  const dispatch = useDispatch();

  async function logout() {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    await client.get('/logout');

    // There may be an error response, but we don't care.  We're trying to log out so assume it worked.
    // What's the alternative?  To force the user to stay logged in?  The next login should overwrite
    // their cookie and session if the logout somehow failed.
    dispatch(clearUserState());
    dispatch(assignProjectState([]));
    // window.location.reload();
  }

  return(
    <>
      <FontAwesomeIcon onClick={logout} icon={faPersonWalkingDashedLineArrowRight} />
    </>
  );
}

export default MultiuserMenuItems;

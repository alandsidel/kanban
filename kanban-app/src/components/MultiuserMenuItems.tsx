import { consts } from '../consts.ts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../lib/redux/redux-store.ts';
import { clearUserState } from '../lib/redux/UserStateSlice';
import { assignProjectState } from '../lib/redux/ProjectStateSlice';
import axios from 'axios';

import { faPersonWalkingDashedLineArrowRight } from '@fortawesome/free-solid-svg-icons';
import { faAddressBook } from '@fortawesome/free-solid-svg-icons';

function MultiuserMenuItems() {
  const user = useSelector((state: RootState) => state.userState);
  const dispatch = useDispatch();

  async function logout() {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    await client.get('/logout');
    dispatch(clearUserState());
    dispatch(assignProjectState([]));
  }

  async function manageUsers() {
  }

  return(
    <div>
      <FontAwesomeIcon title="Logout"       style={{cursor: 'pointer'}} pull="right" onClick={logout}      icon={faPersonWalkingDashedLineArrowRight} />
      {user.isAdmin ? (<FontAwesomeIcon title="Manage users" style={{cursor: 'pointer'}} pull="right" onClick={manageUsers} icon={faAddressBook} />) : ''}
    </div>
  );
}

export default MultiuserMenuItems;

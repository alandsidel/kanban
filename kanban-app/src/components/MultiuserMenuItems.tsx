import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonWalkingDashedLineArrowRight } from '@fortawesome/free-solid-svg-icons';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../lib/redux/redux-store.ts';
import { faAddressBook } from '@fortawesome/free-solid-svg-icons';
import { logoutUser } from '../lib/redux/UserStateSlice.ts';
import { clearProjectState } from '../lib/redux/ProjectStateSlice.ts';
import { useNavigate } from 'react-router';

function MultiuserMenuItems() {
  const user = useSelector((state: RootState) => state.userState);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  async function logout() {
    await dispatch(logoutUser());
    dispatch(clearProjectState());
    navigate('/');
  }

  async function manageUsers() {
    navigate('/user-manager');
  }

  return(
    <div>
      <FontAwesomeIcon
        title='Logout'
        style={{cursor: 'pointer'}}
        pull='right'
        onClick={logout}
        icon={faPersonWalkingDashedLineArrowRight} />
      {user.isAdmin ? (<FontAwesomeIcon
                         title='Manage users'
                         style={{cursor: 'pointer'}}
                         pull='right'
                         onClick={manageUsers}
                         icon={faAddressBook} />) : ''}
    </div>
  );
}

export default MultiuserMenuItems;

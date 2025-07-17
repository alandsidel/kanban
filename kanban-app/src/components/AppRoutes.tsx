import { Route, Routes } from 'react-router';
import Dash from './Dash';
import UserManager from './UserManager';

function AppRoutes() {

  return(
    <Routes>
      <Route path='/user-manager' element={<UserManager/>} />
      <Route path='/projects/:projectId' element={<Dash/>} />
      <Route path='*' element={<Dash/>} />
    </Routes>
  );

}

export default AppRoutes;

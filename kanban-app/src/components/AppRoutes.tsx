import { Route, Routes } from 'react-router';
import Dash from './Dash';

function AppRoutes() {

  return(
    <Routes>
      <Route path='/projects/:projectId' element={<Dash/>} />
      <Route path='*' element={<Dash/>} />
    </Routes>
  );

}

export default AppRoutes;

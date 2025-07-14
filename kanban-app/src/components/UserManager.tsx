import { consts } from '../consts.ts';
import { useEffect, useState } from 'react';
import { Checkbox, Group, Text } from '@mantine/core';
//import { useDispatch, useSelector } from 'react-redux';
//import { RootState } from '../lib/redux/redux-store.ts';
//import { clearUserState } from '../lib/redux/UserStateSlice';
//import { assignProjectState } from '../lib/redux/ProjectStateSlice';
import axios from 'axios';

type UserManagerRecord = {
  username: string,
  is_admin: boolean
}

function UserManager() {
  useEffect(() => {
    fetchUserDetails();
  }, []);

  const [users, setUsers] = useState<Array<UserManagerRecord>>([]);

//  const user = useSelector((state: RootState) => state.userState);
//  const dispatch = useDispatch();

  async function fetchUserDetails() {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.get('/user/details');
    if (response.status === 200) {
      setUsers(response.data);
    } else {
      setUsers([]);
      console.log('Failed to fetch user details:');
      // Handle error response
    }
  }

  return (
    <div>
        {users.map((user) => (
          <Group key={user.username}>
            <Text size='sm'>{user.username}</Text>
            <Checkbox
              checked={user.is_admin}
              label='Admin?'
            />
          </Group>
        ))}
    </div>
  );
}

export default UserManager;

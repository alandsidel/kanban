import { consts } from '../consts.ts';
import { useEffect, useState } from 'react';
import { ActionIcon, Checkbox, Group, Table } from '@mantine/core';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../lib/redux/redux-store.ts';
import { clearProjectState } from '../lib/redux/ProjectStateSlice.ts';
import { setProject } from '../lib/redux/UserStateSlice.ts';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';

type UserManagerRecord = {
  username: string,
  email: string | null,
  is_admin: boolean
}

function UserManager() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(clearProjectState());
    dispatch(setProject(null));
    fetchUserDetails();
  }, [dispatch]);

  const [users, setUsers] = useState<Array<UserManagerRecord>>([]);

  async function fetchUserDetails() {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.get('/admin/users/');
    if (response.status === 200) {
      setUsers(response.data);
    } else {
      setUsers([]);
      console.log('Failed to fetch user list - ', response.statusText);
    }
  }

  async function userToggleAdmin(username: string, isAdmin: boolean) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.post('/admin/users/set-admin/', { username: username, is_admin: !isAdmin });

    if (response.status === 200) {
      setUsers(response.data);
    } else {
      console.log('Failed to toggle admin status for user: ', username, ' - ', response.statusText);
    }
  }

  async function deleteUser(username: string) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.delete('/admin/users/delete/' + username);

    if (response.status === 200) {
      setUsers(response.data);
    } else {
      console.log('Failed to delete user ', username, ' - ', response.statusText);
    }
  }

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table verticalSpacing='sm' striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Username</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Admin?</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((user) => (
            <Table.Tr key={user.username}>
              <Table.Td>{user.username}</Table.Td>
              <Table.Td>{user.email || 'N/A'}</Table.Td>
              <Table.Td>
                <Checkbox
                  checked={user.is_admin}
                  onChange={() => userToggleAdmin(user.username, user.is_admin)}
                />
              </Table.Td>
              <Table.Td>
                <Group gap={0} justify="flex-end">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => deleteUser(user.username)}
                    >
                    <FontAwesomeIcon
                      title='Delete user'
                      style={{cursor: 'pointer'}}
                      icon={faTrashCan} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default UserManager;

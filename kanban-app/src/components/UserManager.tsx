import { consts } from '../consts.ts';
import { useEffect, useState } from 'react';
import { ActionIcon, Center, Checkbox, Table } from '@mantine/core';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../lib/redux/redux-store.ts';
import { clearProjectState } from '../lib/redux/ProjectStateSlice.ts';
import { setProject } from '../lib/redux/UserStateSlice.ts';
import { UserManagerRecord } from '../lib/UserTypes.ts';
import UserManagerUserRow from './UserManagerUserRow.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { showSuccessNotification } from '../lib/notifications.ts';

function UserManager() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(clearProjectState());
    dispatch(setProject(null));
    fetchUserDetails();
  }, [dispatch]);

  const [users, setUsers] = useState<Array<UserManagerRecord>>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [generateNewUserPassword, setGenerateNewUserPassword] = useState(false);

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

  async function setUserAdminFlag(username: string, isAdmin: boolean) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.post('/admin/users/' + username + '/set-admin/', { is_admin: !isAdmin });

    if (response.status === 200) {
      setUsers(response.data);
      return true;
    } else {
      console.log('Failed to toggle admin status for user: ', username, ' - ', response.statusText);
      return false;
    }
  }

  async function setUserEmail(username: string, email: string) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.post('/admin/users/' + username + '/set-email/', { email: email?.trim() ? email.trim() : '' });

    if (response.status === 200) {
      setUsers(response.data);
      return true;
    } else {
      console.log('Failed to save user email for ', username, ' - ', response.statusText);
      return false;
    }
  }

  async function deleteUser(username: string) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.delete('/admin/users/' + username);

    if (response.status === 200) {
      setUsers(response.data);
    } else {
      console.log('Failed to delete user ', username, ' - ', response.statusText);
    }
  }

  async function addNewUser(username: string, email: string, isAdmin: boolean) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const response = await client.put('/admin/users/' + username, {email: email ? email : '', is_admin: isAdmin, password: newUserPassword});

    if (response.status === 200) {
      setUsers(response.data);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setGenerateNewUserPassword(false);
      setNewUserIsAdmin(false);
      showSuccessNotification('User added', `User ${username} has been added successfully.`);
    } else {
      console.log('Failed to add user ', username, ' - ', response.statusText);
    }
  }

  function generateSimplePassword() {
    return Math.random().toString(36).slice(-8);
  }

  function generateNewPasswordToggle() {
    setGenerateNewUserPassword(!generateNewUserPassword);
    if (generateNewUserPassword) {
      setNewUserPassword('');
    } else {
      // Generate a random password
      const randomPassword = generateSimplePassword();
      setNewUserPassword(randomPassword);
    }
  }

  return (
    <Table.ScrollContainer minWidth={500}>
      <Table verticalSpacing='sm' striped highlightOnHover>
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '35%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>

        <Table.Thead>
          <Table.Tr>
            <Table.Th>Username</Table.Th>
            <Table.Th>Password</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Admin?</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {users.map((dbuser) => (
            <UserManagerUserRow
              key={dbuser.username}
              rowUser={dbuser}
              setUserAdminFlag={setUserAdminFlag}
              setUserEmail={setUserEmail}
              deleteUser={deleteUser}
            />
          ))}

          <Table.Tr>
            <Table.Td colSpan={4}>
            <Center><strong>Add New User</strong></Center>
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Td>
              <input
                autoFocus
                style={{ paddingLeft: '0.5em', paddingRight: '0.5em', margin: 0, border: 'none', backgroundColor: '#353560'}}
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </Table.Td>

            <Table.Td>
              <input
                style={{ paddingLeft: '0.5em', paddingRight: '0.5em', margin: 0, border: 'none', fontFamily: 'monospace', backgroundColor: '#353560'}}
                type={generateNewUserPassword ? 'text' : 'password'}
                disabled={generateNewUserPassword}
                placeholder={generateNewUserPassword ? 'Auto-generated' : 'Enter password'}
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </Table.Td>

            <Table.Td>
              <Checkbox
                label='Generate password?'
                disabled={(newUserPassword !== '') && !generateNewUserPassword}
                checked={generateNewUserPassword}
                onChange={() => {generateNewPasswordToggle()}}
              />
            </Table.Td>

            <Table.Td>
              <input
                style={{ paddingLeft: '0.5em', paddingRight: '0.5em', margin: 0, border: 'none', backgroundColor: '#353560'}}
                type='email'
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </Table.Td>

            <Table.Td>
              <Checkbox
                checked={newUserIsAdmin}
                onChange={() => setNewUserIsAdmin(!newUserIsAdmin)}
              />
            </Table.Td>

            <Table.Td>
              <ActionIcon
                variant='subtle'
                color='green'
                disabled={newUserName.trim() === '' || newUserEmail.trim() === '' || newUserPassword === ''}
                onClick={() => addNewUser(newUserName, newUserEmail, newUserIsAdmin)}
              >
                <FontAwesomeIcon icon={faPlus} />
              </ActionIcon>
            </Table.Td>
          </Table.Tr>

        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export default UserManager;

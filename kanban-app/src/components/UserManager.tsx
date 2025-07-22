import { useEffect, useState } from 'react';
import { Button, Container, Modal, Group, Table } from '@mantine/core';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../lib/redux/redux-store.ts';
import { clearProjectState } from '../lib/redux/ProjectStateSlice.ts';
import { setProject } from '../lib/redux/UserStateSlice.ts';
import { UserManagerRecord } from '../lib/UserTypes.ts';
import UserManagerUserRow from './UserManagerUserRow.tsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { showFailureNotification, showSuccessNotification } from '../lib/notifications.ts';
import { createAxiosAPIClient } from '../util/JunkDrawer.ts';
import UserEditModal, { UserEditFormData } from './UserEditModal.tsx';
import { useDisclosure } from '@mantine/hooks';

function UserManager() {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    dispatch(clearProjectState());
    dispatch(setProject(null));
    fetchUserDetails();
  }, [dispatch]);

  const [users, setUsers] = useState<Array<UserManagerRecord>>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagerRecord | null>(null);
  const [confirmDeleteOpened, { open: confirmDeleteOpen, close: confirmDeleteClose }] = useDisclosure(false);

  function openCreateModal() {
    setEditingUser(null);
    setModalOpened(true);
  };

  function openEditModal(userToEdit: UserManagerRecord) {
    setEditingUser(userToEdit);
    setModalOpened(true);
  };

  function closeModal() {
    setModalOpened(false);
    setEditingUser(null);
  };

  async function handleUserSave(userData: UserEditFormData) {
    const client = createAxiosAPIClient();

    try {
      if (editingUser) {
        const response = await client.post('/admin/users/' + editingUser.username, userData);
        if (response.status === 200) {
          setUsers(response.data);
          showSuccessNotification('Success', 'User updated successfully');
          return true;
        }
      } else {
        const response = await client.put('/admin/users/' + userData.username, userData);
        if (response.status === 200) {
          setUsers(response.data);
          showSuccessNotification('Success', 'User created successfully');
          return true;
        }
      }

      showFailureNotification('Error', 'Failed to save user');
      return false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      showFailureNotification('Error', 'Unknown error occurred');
      return false;
    }
  };

  async function fetchUserDetails() {
    const client = createAxiosAPIClient();
    const response = await client.get('/admin/users/');
    if (response.status === 200) {
      setUsers(response.data);
    } else {
      setUsers([]);
      console.log('Failed to fetch user list - ', response.statusText);
    }
  }

  async function deleteUser(username: string) {
    const client = createAxiosAPIClient();
    const response = await client.delete('/admin/users/' + username);

    if (response.status === 200) {
      setUsers(response.data);
    } else {
      console.log('Failed to delete user ', username, ' - ', response.statusText);
    }
  }

  async function confirmDeleteUser(user: UserManagerRecord) {
    setEditingUser(user);
    confirmDeleteOpen();
  }

  return (
    <Container>
      <Group justify='space-between' mb='md'>
        <h2>User Management</h2>
        <Button
          leftSection={<FontAwesomeIcon icon={faPlus} />}
          onClick={openCreateModal}
        >Add User</Button>
      </Group>

      <Table.ScrollContainer minWidth={500}>
        <Table verticalSpacing='sm' striped highlightOnHover>
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '40%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>

          <Table.Thead>
            <Table.Tr>
              <Table.Th>Username</Table.Th>
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
                editUser={openEditModal}
                deleteUser={confirmDeleteUser}
              />
            ))}

          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <UserEditModal
        opened={modalOpened}
        onClose={closeModal}
        onSave={handleUserSave}
        existingUser={editingUser}
      />

      <Modal
        opened={confirmDeleteOpened}
        onClose={confirmDeleteClose}
        title='Confirm Delete'
        centered
      >
        <p>Delete <span style={{fontFamily: 'monospace', backgroundColor: 'black', color: 'red'}}>{editingUser?.username}</span>?
          This action cannot be undone.</p>
        <Group justify='flex-end' mt='md'>
          <Button variant='outline' onClick={confirmDeleteClose}>Cancel</Button>
          <Button
            color='red'
            onClick={async () => {
              if (editingUser) {
                await deleteUser(editingUser.username);
                confirmDeleteClose();
                showSuccessNotification('Success', 'User deleted successfully');
              } else {
                showFailureNotification('Error', 'No user selected for deletion');
              }
            }}
          >
            Delete User
          </Button>
        </Group>
      </Modal>

    </Container>
  );
}

export default UserManager;

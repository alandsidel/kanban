import { Table, Checkbox, ActionIcon, Text } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCheck } from '@fortawesome/free-solid-svg-icons';
import { UserManagerRecord } from '../lib/UserTypes.ts';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/redux/redux-store.ts';

export type UserManagerUserRowProps = {
  rowUser: UserManagerRecord;
  setUserAdminFlag: (username: string, isAdmin: boolean) => Promise<boolean>;
  setUserEmail:     (username: string, email: string)    => Promise<boolean>;
  deleteUser:       (username: string)                   => Promise<void>;
};

function UserManagerUserRow(props: UserManagerUserRowProps) {
  const { rowUser, setUserAdminFlag, setUserEmail, deleteUser } = props;
  const user = useSelector((state: RootState) => state.userState);

  const [newEmail, setNewEmail]             = useState(rowUser.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  async function editEmailToggle() {
    setIsEditingEmail(!isEditingEmail);
  }

  async function saveUserEmail() {
    if (await setUserEmail(rowUser.username, newEmail)) {
      setNewEmail(rowUser.email || '');
      setIsEditingEmail(false);
    }
  }

  return (
    <Table.Tr>
      <Table.Td>{rowUser.username}</Table.Td>

      <Table.Td colSpan={2}>
        <Text size='sm' c='dimmed'>********</Text>
      </Table.Td>

      <Table.Td>
        {isEditingEmail ? (
        <>
          <input
            autoFocus
            style={{ padding: 0, margin: 0, border: 'none'}}
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                await saveUserEmail();
              } else if (e.key === 'Escape') {
                setNewEmail(rowUser.email || '');
                setIsEditingEmail(false);
              }
            }}
          />
          <ActionIcon
            variant="subtle"
            color="green"
            onClick={() => saveUserEmail()}
          >
            <FontAwesomeIcon icon={faCheck} />
          </ActionIcon>
        </>
        ) : (
          <div onClick={() => editEmailToggle()}>{rowUser.email || 'N/A'}</div>
        )}
      </Table.Td>

      <Table.Td>
        <Checkbox
          checked={rowUser.is_admin}
          disabled={rowUser.username === user.username} // Prevent unsetting self admin status
          onChange={() => setUserAdminFlag(rowUser.username, rowUser.is_admin)}
        />
      </Table.Td>

      <Table.Td>
        <ActionIcon
          variant="subtle"
          color="red"
          disabled={rowUser.username === user.username} // Prevent deleting self
          onClick={() => deleteUser(rowUser.username)}
        >
          <FontAwesomeIcon icon={faTrash} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}

export default UserManagerUserRow;

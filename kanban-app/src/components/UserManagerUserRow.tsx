import { Table, ActionIcon } from '@mantine/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';
import { UserManagerRecord } from '../lib/UserTypes.ts';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/redux/redux-store.ts';

export type UserManagerUserRowProps = {
  rowUser: UserManagerRecord;
  editUser:   (user: UserManagerRecord) => void;
  deleteUser: (user: UserManagerRecord) => Promise<void>;
};

function UserManagerUserRow(props: UserManagerUserRowProps) {
  const { rowUser, editUser, deleteUser } = props;
  const user = useSelector((state: RootState) => state.userState);

  return (
    <Table.Tr>
      <Table.Td>{rowUser.username}</Table.Td>

      <Table.Td>
        {rowUser.email || 'N/A'}
      </Table.Td>

      <Table.Td>
        {rowUser.is_admin ? 'Yes' : 'No'}
      </Table.Td>

      <Table.Td>
        <ActionIcon
          variant='subtle'
          color='white'
          onClick={() => editUser(rowUser)}
        >
          <FontAwesomeIcon icon={faPencil} />
        </ActionIcon>

        <ActionIcon
          variant='subtle'
          color='red'
          disabled={rowUser.username === user.username} // Prevent deleting self
          onClick={() => deleteUser(rowUser)}
        >
          <FontAwesomeIcon icon={faTrash} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  );
}

export default UserManagerUserRow;

import { Modal, Button, Checkbox, Stack, TextInput } from '@mantine/core';
import { UserManagerRecord } from '../lib/UserTypes';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/redux/redux-store';
import { isNotEmpty, matchesField, useForm } from '@mantine/form';
import { useEffect } from 'react';

export type UserEditModalProps = {
  opened: boolean;
  onClose: () => void;
  onSave: (userData: UserEditFormData) => Promise<boolean>;
  existingUser?: UserManagerRecord | null;
};

export type UserEditFormData = {
  username: string;
  email:    string | null;
  password: string;
  is_admin: boolean;
};

function UserEditModal({ opened, onClose, onSave, existingUser }: UserEditModalProps) {
  const user = useSelector((state: RootState) => state.userState);

  const form = useForm({
    mode: 'uncontrolled',
    validateInputOnChange: true,
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      is_admin: false
    },
    validate: {
      username: isNotEmpty('username is required'),
      email: validateEmail,
      password: checkPassword,
      confirmPassword: matchesField('password', 'Passwords do not match'),
    }
  });

  useEffect(() => {
    if (opened) {
      if (existingUser) {
        form.setValues({
          username: existingUser.username,
          email: existingUser.email || '',
          password: '',
          confirmPassword: '',
          is_admin: !!existingUser.is_admin
        });
      } else {
        // Reset to empty values for create mode
        form.reset();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  function closeModal() {
    onClose();
  }

  function validateEmail(value: string | null) {
    // Email is not required
    if (!value?.trim()) {
      return null;
    }

    // From https://www.regular-expressions.info/email.html
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(value) ? null : 'Invalid email address';
  }

  function checkPassword(value: string | null) {
    return !existingUser ? isNotEmpty('password is required')(value) : null
  }

  async function handleSave() {
    if (await onSave(form.getValues())) {
      closeModal();
    }
  };

  return (
    <Modal opened={opened} onClose={closeModal} title={existingUser ? 'Edit user' : 'Create user'}>
      <form onSubmit={form.onSubmit(handleSave)}>
        <Stack justify='center' gap='md'>
        <TextInput
          placeholder="Username"
          label="Username"
          disabled={!!existingUser && existingUser.username === user.username}
          key={form.key('username')}
          {...form.getInputProps('username')}
        />

        <TextInput
          placeholder="name@example.com"
          label="Email"
          key={form.key('email')}
          {...form.getInputProps('email')}
        />

        <TextInput
          placeholder="Password"
          label="Password"
          type="password"
          key={form.key('password')}
          {...form.getInputProps('password')}
        />

        <TextInput
          placeholder="Confirm password"
          label="Confirm password"
          type="password"
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />

        <Checkbox
          label="Admin"
          key={form.key('is_admin')}
          {...form.getInputProps('is_admin', { type: 'checkbox' })}
          disabled={!!existingUser && existingUser.username === user.username}
        />

        <Button
          type='submit'
          variant='filled'
          >{existingUser ? 'Save user' : 'Create user'}</Button>
        </Stack>
      </form>
    </Modal>
  );
}

export default UserEditModal;

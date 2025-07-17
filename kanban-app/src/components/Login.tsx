import { Center, Paper, TextInput, Text, Button, Stack, Loader } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../lib/redux/UserStateSlice';
import { RootState, AppDispatch } from '../lib/redux/redux-store';
import { showFailureNotification } from '../lib/notifications';
import { useEffect, useState } from 'react';

function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const { error } = useSelector((state: RootState) => state.userState);
  const [loggingIn, setLoggingIn] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      username: '',
      password: ''
    },
    validate: {
      username: isNotEmpty('username is required'),
      password: isNotEmpty('password is required')
    }
  });

  useEffect(() => {
    if (error) {
      setLoggingIn(false);
      form.reset();
      showFailureNotification('Login Failed', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  async function submitLoginForm(values: typeof form.values) {
    setLoggingIn(true);
    await dispatch(loginUser(values));
  }

  return(
    <Center mt={100}>
      <Paper withBorder shadow='xs' p='xl'>
        <Center><Text>Login</Text></Center>
        <form onSubmit={form.onSubmit(submitLoginForm)}>
          <Stack justify='center' gap='md'>
            <TextInput
              placeholder='username'
              key={form.key('username')}
              {...form.getInputProps('username')}
              disabled={loggingIn}
            />

            <TextInput
              type='password'
              placeholder='password'
              key={form.key('password')}
              {...form.getInputProps('password')}
              disabled={loggingIn}
            />

            <Center>
              <Button
                disabled={loggingIn || form.getValues().username === '' || form.getValues().password === ''}
                type='submit'
                variant='filled'
                leftSection={loggingIn ? <Loader size="xs" /> : undefined}
              >
                {loggingIn ? 'Logging in...' : 'Login'}
              </Button>
            </Center>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}

export default Login;

import { Center, Paper, TextInput, Text, Button, Stack } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import axios from 'axios';
import { consts } from '../consts.ts';
import { useDispatch } from 'react-redux';
import { assignUserState } from '../lib/redux/UserStateSlice';

function Login() {
  const dispatch = useDispatch();

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

  async function submitLoginForm(values: typeof form.values) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const resp = await client.post('/login/', values);
    if (resp.status == 200) {
      dispatch(assignUserState(resp.data));
    }
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
            />

            <TextInput
              type='password'
              placeholder='password'
              key={form.key('password')}
              {...form.getInputProps('password')}
            />

            <Center><Button
              disabled={(form.getValues().username == '') || (form.getValues().password == '')}
              type='submit'
              variant='filled'>Login</Button></Center>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}

export default Login;

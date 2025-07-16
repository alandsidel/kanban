import { useState } from 'react';
import { AppShell, Burger, Group, Flex } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { useSelector } from 'react-redux';
import { RootState, AppDispatch } from './lib/redux/redux-store.ts';
import AppRoutes from './components/AppRoutes';
import AutoLogin from './components/AutoLogin.tsx';
import Login from './components/Login.tsx';
import Navbar from './components/Navbar.tsx';
import { clearProjectState, moveTask, deleteTask } from './lib/redux/ProjectStateSlice';
import { showFailureNotification} from './lib/notifications.ts';
import { useDispatch } from 'react-redux';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonWalkingDashedLineArrowRight } from '@fortawesome/free-solid-svg-icons';
import { clearUserState } from './lib/redux/UserStateSlice';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './styles/style.css';
import axios from 'axios';
import { consts } from './consts.ts';

function App() {
  const user = useSelector((state: RootState) => state.userState);

  const [isFirstLoad, setFirstLoad] = useState(true);
  const [burgerOpened, { toggle: toggleBurger}] = useDisclosure(true);

  const dispatch = useDispatch<AppDispatch>();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
  );

  if (isFirstLoad) {
    return (
      <AutoLogin setFirstLoad={setFirstLoad} />
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const targetId = event.over?.id;

    if (targetId)
    {
      // These may be null
      if (event.active && event.active.data && event.over && event.over.data) {
        const bucketFromId = event.active.data.current?.bucketId;
        const taskId       = event.active.data.current?.taskId;
//TODO: Refactor this to use some data element indicating droptarget type.  bucket, trash, etc.
        if (targetId === 'trashcan') {
          try {
            const result = await dispatch(deleteTask({ taskId, bucketId: bucketFromId }));
            if (deleteTask.rejected.match(result)) {
              showFailureNotification('Delete failed', result.payload as string);
            }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            showFailureNotification('Delete failed', 'An unexpected error occurred');
          }
        } else if (event.over.data.current?.bucketId) {
          const bucketToId = event.over.data.current.bucketId;
          try {
            const result = await dispatch(moveTask({
              taskId,
              fromBucketId: bucketFromId,
              toBucketId: bucketToId
            }));
            if (moveTask.rejected.match(result)) {
              showFailureNotification('Move failed', result.payload as string);
            }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) {
            showFailureNotification('Move failed', 'An unexpected error occurred');
          }
        }
      }
    }
  }

  async function logout() {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    await client.post('/logout/');
    dispatch(clearUserState());
    dispatch(clearProjectState());
  }

  if (!user.username) {
    return (
      <Login />
    );
  } else {
    return (
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>

        <AppShell
          header={{height:60}}
          navbar={{width: 180, breakpoint: 'sm', collapsed: {mobile: !burgerOpened, desktop: !burgerOpened}}}
          padding='md'>

          <AppShell.Header>
            <Flex px="md" justify="space-between" align="center">
              <Group>
                <Burger opened={burgerOpened} onClick={toggleBurger} visibleFrom="sm" size="sm" />
                <p>hello {user.username ? user.username : 'anonymous'}</p>
              </Group>
              {!user.isElectron ? <FontAwesomeIcon onClick={logout} icon={faPersonWalkingDashedLineArrowRight} />: ''}
            </Flex>
          </AppShell.Header>

          <AppShell.Navbar p="md">
            <Navbar/>
          </AppShell.Navbar>

          <AppShell.Main>
            <AppRoutes />
            <Notifications />
          </AppShell.Main>
        </AppShell>

      </DndContext>
    );
  }
}

export default App;

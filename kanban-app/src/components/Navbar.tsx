import { ProjectItemType } from '../types';
import { consts } from '../consts.ts';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Button, Center, Container, Divider, Modal, SegmentedControl, Textarea, TextInput } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { setProject } from '../lib/redux/UserStateSlice';
import { useForm } from '@mantine/form';
import { fetchProjectBuckets } from '../lib/redux/ProjectStateSlice';
import { useDisclosure } from '@mantine/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFolderPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../lib/redux/redux-store.ts';
import { showFailureNotification, showSuccessNotification } from '../lib/notifications.ts';
import { useDroppable } from '@dnd-kit/core';
import { useNavigate } from 'react-router';

function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Array<ProjectItemType>>([]);
  const [newProjectModalOpened, newProjectModalCallbacks] = useDisclosure(false);
  const [newTaskModalOpened, newTaskModalCallbacks] = useDisclosure(false);
  const user = useSelector((state: RootState) => state.userState);
  const {setNodeRef: setTrashNodeRef} = useDroppable({ id: 'trashcan'});

  const newProjectForm = useForm({
    mode: 'uncontrolled',
    initialValues: {name: ''},
    validate: {
      name: (value) => {
        if (value && value.trim()) {
          return null;
        } else {
          return 'Project name cannot be empty';
        }
      }
    }
  });

  const newTaskForm = useForm({
    mode: 'uncontrolled',
    initialValues: {name: '', description: ''},
    validate: {
      name: (value) => {
        if (value && value.trim()) {
          return null;
        } else {
          return 'Task name cannot be empty';
        }
      }
    }
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const resp = await client.get('/projects/');

    if (resp.status === 200) {
      setProjects(resp.data);
    } else {
      setProjects([]);
    }
  }

  async function switchProjects(id: string) {
    dispatch(setProject(id));
    navigate('/projects/' + id);
  }

  async function createNewProject(v:{name: string}) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const resp = await client.put('/projects/' + v.name.trim());

    if (resp.status === 200) {
      showSuccessNotification('Success', 'New project successfully created!');
      newProjectModalCallbacks.close();
      newProjectForm.reset();
      fetchProjects();
    } else {
      showFailureNotification(resp.data.msg, resp.data.detail);
    }
  }

  async function createNewTask(v:{name: string; description: string}) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const resp = await client.put('/task/' + user.activeProject + '/', v);

    if (resp.status === 200) {
      showSuccessNotification('Success', 'New task successfully created!');
      newTaskModalCallbacks.close();
      newTaskForm.reset();

      // Refresh the current project's buckets
      if (user.activeProject) {
        dispatch(fetchProjectBuckets(user.activeProject));
      }
    } else {
      showFailureNotification(resp.data.msg, resp.data.detail);
    }
  }

  return (
    <>
      <Modal opened={newProjectModalOpened} onClose={newProjectModalCallbacks.close} title='Create new project'>
        <form onSubmit={newProjectForm.onSubmit(createNewProject)}>
          <TextInput
            data-autofocus
            placeholder='name'
            key={newProjectForm.key('name')}
            {...newProjectForm.getInputProps('name')}
          />
          <Container style={{textAlign: 'right'}} m={0} p={0}>
            <Button size='compact-sm' mt='5' type='submit'>Create</Button>
          </Container>
        </form>
      </Modal>

      <Modal opened={newTaskModalOpened} onClose={newTaskModalCallbacks.close} title='Add new task'>
        <form onSubmit={newTaskForm.onSubmit(createNewTask)}>
          <TextInput
            data-autofocus
            placeholder='name'
            key={newTaskForm.key('name')}
            {...newTaskForm.getInputProps('name')}
          />

          <Textarea
            mt={5}
            placeholder='describe this task in a sentence or two'
            key={newTaskForm.key('description')}
            {...newTaskForm.getInputProps('description')}
          />

          <Container style={{textAlign: 'right'}} m={0} p={0}>
            <Button size='compact-sm' mt='5' type='submit'>Create</Button>
          </Container>
        </form>
      </Modal>

      <Divider size='lg' label='projects' labelPosition='center'/>
      <SegmentedControl
        orientation='vertical'
        fullWidth
        value={user.activeProject || ''}
        data={projects.map((project) => {return {value: project.id.toString(), label: project.name}})}
        onChange={switchProjects} />

      <Divider size='lg' label='new items' labelPosition='center'/>
      <Button size='xs' mt='5'
        leftSection={<FontAwesomeIcon icon={faFolderPlus} />}
        onClick={newProjectModalCallbacks.open}>New Project</Button>
      <Button size='xs' mt='5'
        leftSection={<FontAwesomeIcon icon={faPlus} />}
        onClick={newTaskModalCallbacks.open}
        disabled={!user.activeProject}>New Task</Button>

      <Divider size='lg' label='trash' labelPosition='center'/>
      <Center ref={setTrashNodeRef} style={{border: '1px dashed #700'}} p={50}>
        <FontAwesomeIcon icon={faTrash} color={'#700'}/>
      </Center>
    </>
  );
}

export default Navbar;

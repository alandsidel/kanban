import { ProjectItemType } from '../types';
import { useEffect, useState } from 'react';
import { Button, Center, Container, Divider, Modal, SegmentedControl, Text, Textarea, TextInput } from '@mantine/core';
import { useDispatch, useSelector } from 'react-redux';
import { setProject } from '../lib/redux/UserStateSlice';
import { useForm } from '@mantine/form';
import { fetchProjectBuckets } from '../lib/redux/ProjectStateSlice';
import { useDisclosure } from '@mantine/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faFolderPlus, faTrash, faUsers } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../lib/redux/redux-store.ts';
import { showFailureNotification, showSuccessNotification } from '../lib/notifications.ts';
import { useDroppable } from '@dnd-kit/core';
import { useNavigate } from 'react-router';
import { createAxiosAPIClient } from '../util/JunkDrawer.ts';

function Navbar() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Array<ProjectItemType>>([]);
  const [deleteDialogText, setDeleteDialogText] = useState('');
  const [newProjectModalOpened, newProjectModalCallbacks] = useDisclosure(false);
  const [newTaskModalOpened, newTaskModalCallbacks] = useDisclosure(false);
  const [deleteProjectModalOpened, deleteProjectModalCallbacks] = useDisclosure(false);

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

  const deleteProjectForm = useForm({
    mode: 'uncontrolled',
    initialValues: {confirm: ''},
    validate: {
      confirm: (value) => {
        if (value === 'delete') {
          return null;
        } else {
          return 'Type "delete" to confirm';
        }
      }
    },
    onValuesChange: (values) => {
      setDeleteDialogText(values.confirm);
    }
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const client = await createAxiosAPIClient();
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
    const client = await createAxiosAPIClient();
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
    const client = await createAxiosAPIClient();
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

  async function onDeleteProjectClick() {
    await deleteProjectModalCallbacks.open();
  }

  async function deleteProject() {
    if (!user.activeProject) {
      showFailureNotification('Error', 'No active project selected');
      return;
    }

    const client = await createAxiosAPIClient();
    const resp = await client.delete('/projects/' + user.activeProject);

    if (resp.status === 200) {
      deleteProjectModalCallbacks.close();
      deleteProjectForm.reset();
      showSuccessNotification('Success', 'Project successfully deleted!');
      fetchProjects();
      navigate('/');
    } else {
      showFailureNotification(resp.data.msg, resp.data.detail);
    }
  }

  async function manageProjectUsers() {
  }

  // This is here to only provide the button if the user is a project admin
  // and also if the app is not running in Electron.
  function getUsersButton() {
    if (!user.isElectron) {
      // check admin status
      return (
        <Button size='xs' mt='5'
          leftSection={<FontAwesomeIcon icon={faUsers} />}
          onClick={() => manageProjectUsers()}
          disabled={!user.activeProject}>Users</Button>
      );
    } else {
      return '';
    }
  }

  return (
    <>
      <Modal opened={deleteProjectModalOpened}
        onClose={() => {
          setDeleteDialogText('');
          deleteProjectForm.reset();
          deleteProjectModalCallbacks.close();
        }}
        returnFocus={false}

        title={'Delete Project "' + projects.find(p => p.id.toString() === user.activeProject)?.name + '"?'}>
        <form onSubmit={deleteProjectForm.onSubmit(deleteProject)}>
          <TextInput
            data-autofocus
            placeholder='Type "delete" to confirm'
            key={deleteProjectForm.key('confirm')}
            {...deleteProjectForm.getInputProps('confirm')}
          />
          <Container style={{textAlign: 'right'}} m={0} p={0}>
            <Button size='compact-sm' mt='5' color='red' type='submit'
              disabled={deleteDialogText !== 'delete'}>Delete</Button>
          </Container>
        </form>
      </Modal>

      <Modal opened={newProjectModalOpened} onClose={newProjectModalCallbacks.close}
        returnFocus={false}
        title='Create new project'>
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

      <Modal opened={newTaskModalOpened} onClose={newTaskModalCallbacks.close}
        returnFocus={false}
        title='Add new task'>
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

      <Button size='xs' mt='5'
        leftSection={<FontAwesomeIcon icon={faFolderPlus} />}
        onClick={newProjectModalCallbacks.open}>New Project</Button>
      <Button size='xs' mt='5'
        leftSection={<FontAwesomeIcon icon={faPlus} />}
        onClick={newTaskModalCallbacks.open}
        disabled={!user.activeProject}>New Task</Button>

      <Divider size='lg' label='projects' labelPosition='center'/>
      <SegmentedControl
        orientation='vertical'
        fullWidth
        value={user.activeProject || ''}
        data={projects.map((project) => {return {value: project.id.toString(), label: project.name}})}
        onChange={switchProjects} />

      <Divider size='lg' label='manage' labelPosition='center'/>
      {getUsersButton()}

      <Button size='xs' mt='5' color='red'
        leftSection={<FontAwesomeIcon icon={faTrash} />}
        onClick={() => {onDeleteProjectClick()}}
        disabled={!user.activeProject}>Delete Project</Button>

      <Divider size='lg' label='trash' labelPosition='center'/>
      <Center ref={setTrashNodeRef} style={{border: '1px dashed #700'}} p={50}>
        <FontAwesomeIcon icon={faTrash} color={'#700'}/>
      </Center>
      <Center>
        <Text size='xs' color='dimmed' mt={5}>
          Drag tasks here to delete.
        </Text>
      </Center>
    </>
  );
}

export default Navbar;

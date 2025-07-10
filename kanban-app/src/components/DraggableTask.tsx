import { useDraggable } from '@dnd-kit/core';
import { Button, Card, Container, Modal, Text, Textarea, TextInput } from '@mantine/core';
import { BucketTask } from '../lib/redux/ProjectStateSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import axios from 'axios';
import { consts } from '../consts';
import { showFailureNotification, showSuccessNotification } from '../lib/notifications';
import { assignProjectState } from '../lib/redux/ProjectStateSlice';
import { useDispatch } from 'react-redux';

export type DraggableTaskProps = {
  task: BucketTask,
  bucketId: number // DnDContext onDragEnd doesn't contain info on the 'from'
};

export function DraggableTask(props: DraggableTaskProps) {
  const {attributes, isDragging, listeners, setNodeRef, transform} = useDraggable({
    id: 'draggable_' + props.task.id,
    data: {
      taskId: props.task.id,
      bucketId: props.bucketId
  }});
  const [editModalOpened, editModalCallbacks] = useDisclosure(false);
  const dispatch = useDispatch();
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const editForm = useForm({
    mode: 'uncontrolled',
    initialValues: {name: props.task.name, description: props.task.description},
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

  async function saveEdit(v:{name: string; description: string}) {
    const client = axios.create({ withCredentials: true, baseURL: consts.API_URL, validateStatus: () => true });
    const resp = await client.post('/task/' + props.task.id, v);

    if (resp.status === 200) {
      showSuccessNotification('Success', 'Task successfully updated!');
      editModalCallbacks.close();
      dispatch(assignProjectState(resp.data));
      editForm.setValues({name: v.name, description: v.description});
    } else {
      showFailureNotification(resp.data.msg, resp.data.detail);
    }
  }

  return (
    <>
      <Modal opened={editModalOpened} onClose={editModalCallbacks.close} title='Create new project'>
        <form onSubmit={editForm.onSubmit(saveEdit)}>
          <TextInput
            label='Task name'
            placeholder='name'
            withAsterisk
            data-autofocus
            key={editForm.key('name')}
            {...editForm.getInputProps('name')}
          />
          <Textarea
            mt={5}
            label='Task description'
            placeholder='describe this task in a sentence or two'
            key={editForm.key('description')}
            {...editForm.getInputProps('description')}
          />
          <Container style={{textAlign: 'right'}} m={0} p={0}>
            <Button size='compact-sm' mt='5' type='submit'>Save</Button>
          </Container>
        </form>
      </Modal>

      <Card mt={5} shadow='sm' padding='lg' radius='0' withBorder ref={setNodeRef} style={ isDragging ? {...style, zIndex:10, borderColor:'pink'} : style}>
        <Card.Section {...attributes} {...listeners} bg={'blue'}>
          <FontAwesomeIcon pull={'right'} icon={faEdit} onClick={editModalCallbacks.open} />
          <Text size='md' truncate='end' title={props.task.name}>{props.task.name}</Text>
        </Card.Section>
        <Card.Section>
          <Text size='sm'>{props.task.description}</Text>
        </Card.Section>
      </Card>

    </>
  );
}

import { useDraggable } from '@dnd-kit/core';
import { Button, Card, Container, Modal, Text, Textarea, TextInput } from '@mantine/core';
import { BucketTask, updateTask } from '../lib/redux/ProjectStateSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { showFailureNotification, showSuccessNotification } from '../lib/notifications';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../lib/redux/redux-store';

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
  const dispatch = useDispatch<AppDispatch>();
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
    try {
      const result = await dispatch(updateTask({
        taskId: props.task.id,
        name: v.name,
        description: v.description
      }));

      if (updateTask.fulfilled.match(result)) {
        showSuccessNotification('Success', 'Task successfully updated!');
        editModalCallbacks.close();
        editForm.setValues({name: v.name, description: v.description});
      } else {
        // Handle the rejected case
        const errorMessage = result.payload as string || 'Failed to update task';
        showFailureNotification('Error', errorMessage);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      showFailureNotification('Error', 'An unexpected error occurred');
    }
  }

  return (
    <>
      <Modal opened={editModalOpened} onClose={editModalCallbacks.close} title='Edit Task'>
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

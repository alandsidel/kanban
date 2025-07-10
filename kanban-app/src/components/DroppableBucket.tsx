import { Divider } from '@mantine/core';
import { ProjectBucket } from '../lib/redux/ProjectStateSlice';
import { DraggableTask } from './DraggableTask';
import { useDroppable } from '@dnd-kit/core';

export type DroppableBucketProps = {
  styleProps?: React.CSSProperties | undefined,
  bucket: ProjectBucket
};

export function DroppableBucket({styleProps, bucket}: DroppableBucketProps) {
  const {setNodeRef} = useDroppable({ id: 'droppablebucket_' + bucket.id, data: { bucketId: bucket.id }});

  return (
    <div style={{...styleProps}} ref={setNodeRef}>
      <p>{bucket.name}</p>
      <Divider size='lg'/>
      <div>
        {bucket.tasks.map((task) => (
          <DraggableTask key={task.id} task={task} bucketId={bucket.id} />
        ))}
      </div>
    </div>
  );
}

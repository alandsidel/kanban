import { Flex, Paper, Text, Center, SimpleGrid } from '@mantine/core';
import { useSelector } from 'react-redux';
import { RootState } from '../lib/redux/redux-store';
import { DroppableBucket } from './DroppableBucket';

function Dash() {
  const user     = useSelector((state: RootState) => state.userState);
  const buckets  = useSelector((state: RootState) => state.projectState);

  if (!user.activeProject) {
    return (
      <Flex direction='column' gap='sm'>
        <Center>
          <Paper shadow='xs' radius='lg' withBorder>
            <Text>Select or create a project to get started!</Text>
          </Paper>
        </Center>
      </Flex>
    );
  } else {
    return (
      <SimpleGrid cols={buckets.length} spacing='sm'>
      {buckets.map((bucket) => (
      <DroppableBucket key={bucket.id} bucket={bucket}/>
      ))}
      </SimpleGrid>
    );
  }
}

export default Dash;

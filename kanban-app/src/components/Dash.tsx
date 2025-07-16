import { Flex, Paper, Text, Center, SimpleGrid, Loader } from '@mantine/core';
import { DroppableBucket } from './DroppableBucket';
import { useParams } from 'react-router';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../lib/redux/redux-store';
import { fetchProjectBuckets } from '../lib/redux/ProjectStateSlice';
import { setProject } from '../lib/redux/UserStateSlice';

function Dash() {
  const dispatch = useDispatch<AppDispatch>();
  const { projectId } = useParams<{ projectId: string }>();
  const { buckets, isLoading, error, currentProjectId } = useSelector((state: RootState) => state.projectState);
  const user = useSelector((state: RootState) => state.userState);

  useEffect(() => {
    if (projectId) {
      // Update Redux state to match URL
      if (user.activeProject !== projectId) {
        dispatch(setProject(projectId));
      }

      // Fetch buckets if needed
      if (projectId !== currentProjectId) {
        dispatch(fetchProjectBuckets(projectId));
      }
    }
  }, [projectId, currentProjectId, user.activeProject, dispatch]);

  if (!projectId) {
    return (
      <Flex direction='column' gap='sm'>
        <Center>
          <Paper shadow='xs' radius='lg' withBorder>
            <Text>Select or create a project to get started!</Text>
          </Paper>
        </Center>
      </Flex>
    );
  }

  if (isLoading) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  if (error) {
    return (
      <Center>
        <Paper shadow='xs' radius='lg' withBorder p='md'>
          <Text c='red'>Error: {error}</Text>
        </Paper>
      </Center>
    );
  }

  return (
    <SimpleGrid cols={buckets.length} spacing='sm'>
      {buckets.map((bucket) => (
        <DroppableBucket key={bucket.id} bucket={bucket}/>
      ))}
    </SimpleGrid>
  );
}

export default Dash;

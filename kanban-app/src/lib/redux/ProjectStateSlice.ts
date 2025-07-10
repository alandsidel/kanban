import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type BucketTask = {
  id: number,
  name: string,
  description: string
}

export type ProjectBucket = {
  id : number,
  name: string,
  ord: number,
  tasks: BucketTask[]
};

export type MoveItemPayload = {
  itemId: number,
  fromBucketId: number,
  toBucketId: number
};

type ProjectBuckets = ProjectBucket[];

const initialState: ProjectBuckets = [];

const ProjectStateSlice = createSlice({
  name: 'projectStateSlice',
  initialState,
  reducers: {
    assignProjectState: (_state, action: PayloadAction<ProjectBuckets>) => {
      return action.payload;
    },
    clearProjectState: () => {
      return initialState;
    }
  }
});

export const { assignProjectState, clearProjectState } = ProjectStateSlice.actions;
export default ProjectStateSlice.reducer;

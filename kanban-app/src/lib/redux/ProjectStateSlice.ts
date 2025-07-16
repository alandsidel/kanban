import { createSlice, createAsyncThunk, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import { appendErrorDetail, createAxiosAPIClient } from '../../util/JunkDrawer';

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

type ProjectState = {
  buckets: ProjectBucket[];
  isLoading: boolean;
  error: string | null;
  currentProjectId: string | null;
};

const initialState: ProjectState = {
  buckets: [],
  isLoading: false,
  error: null,
  currentProjectId: null
};

// Async thunk for fetching project buckets
export const fetchProjectBuckets = createAsyncThunk(
  'project/fetchBuckets',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const resp = await createAxiosAPIClient().get(`/buckets/${projectId}`);
      if (resp.status === 200) {
        return { buckets: resp.data, projectId };
      } else {
        return rejectWithValue('Failed to fetch project buckets');
      }
    } catch (error) {
      return rejectWithValue(appendErrorDetail('Network error occurred', error));
    }
  }
);

// Async thunk for updating a task
export const updateTask = createAsyncThunk(
  'project/updateTask',
  async (params: { taskId: number; name: string; description: string }, { rejectWithValue }) => {
    try {
      const resp = await createAxiosAPIClient().post(`/task/${params.taskId}`, {
        name: params.name,
        description: params.description
      });
      if (resp.status === 200) {
        return resp.data;
      } else {
        return rejectWithValue(resp.data?.detail || 'Failed to update task');
      }
    } catch (error) {
      return rejectWithValue(appendErrorDetail('Network error occurred', error));
    }
  }
);

// Async thunk for moving a task between buckets
export const moveTask = createAsyncThunk(
  'project/moveTask',
  async (params: { taskId: number; fromBucketId: number; toBucketId: number }, { rejectWithValue }) => {
    try {
      const resp = await createAxiosAPIClient().post(`/movetask/${params.taskId}/${params.fromBucketId}/${params.toBucketId}`);
      if (resp.status === 200) {
        return resp.data;
      } else {
        return rejectWithValue(resp.data?.detail || 'Failed to move task');
      }
    } catch (error) {
      return rejectWithValue(appendErrorDetail('Network error occurred', error));
    }
  }
);

// Async thunk for deleting a task
export const deleteTask = createAsyncThunk(
  'project/deleteTask',
  async (params: { taskId: number; bucketId: number }, { rejectWithValue }) => {
    try {
      const resp = await createAxiosAPIClient().delete(`/task/${params.bucketId}/${params.taskId}`);
      if (resp.status === 200) {
        return resp.data;
      } else {
        return rejectWithValue(resp.data?.detail || 'Failed to delete task');
      }
    } catch (error) {
      return rejectWithValue(appendErrorDetail('Network error occurred', error));
    }
  }
);

const ProjectStateSlice = createSlice({
  name: 'projectState',
  initialState,
  reducers: {
    clearProjectState: (state) => {
      state.buckets = [];
      state.currentProjectId = null;
      state.error = null;
    },
    updateProjectBuckets: (state, action: PayloadAction<ProjectBucket[]>) => {
      state.buckets = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Pending - only fetchProjectBuckets shows loading
      .addCase(fetchProjectBuckets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      // fetchProjectBuckets fulfilled - special case with projectId
      .addCase(fetchProjectBuckets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.buckets = action.payload.buckets;
        state.currentProjectId = action.payload.projectId;
      })
      // All other fulfilled cases - they just update buckets
      .addMatcher(
        isAnyOf(updateTask.fulfilled, moveTask.fulfilled, deleteTask.fulfilled),
        (state, action) => {
          state.isLoading = false;
          state.error = null;
          state.buckets = action.payload;
        }
      )
      // All rejected cases
      .addMatcher(
        isAnyOf(fetchProjectBuckets.rejected, updateTask.rejected, moveTask.rejected, deleteTask.rejected),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      );
  }
});

export const { clearProjectState, updateProjectBuckets } = ProjectStateSlice.actions;
export default ProjectStateSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import { appendErrorDetail, createAxiosAPIClient } from '../../util/JunkDrawer';

type UserState = {
  username: string,
  email: string,
  isAdmin: boolean,
  isElectron: boolean,
  activeProject: string|null,
  error: string | null,
}

const initialState: UserState = {
  username: '',
  email: '',
  isAdmin: false,
  isElectron: false,
  activeProject: null,
  error: null
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  'user/login',
  async (credentials: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const resp = await createAxiosAPIClient().post('/login/', credentials);
      if (resp.status === 200) {
        return resp.data;
      } else {
        return rejectWithValue(resp.data?.detail || 'Login failed');
      }
    } catch (error) {
      return rejectWithValue(appendErrorDetail('Network error occurred', error));
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      await createAxiosAPIClient().post('/logout/');
      return;
    } catch (error) {
      return rejectWithValue(appendErrorDetail('Network error occurred', error));
    }
  }
);

// Async thunk for auth check
export const checkAuth = createAsyncThunk(
  'user/checkAuth',
  async () => {
    try {
      const resp = await createAxiosAPIClient().get('/authcheck/');
      if (resp.status === 200) {
        return resp.data;
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }
);

const UserStateSlice = createSlice({
  name: 'userStateSlice',
  initialState,
  reducers: {
    assignUserState: (state, action: PayloadAction<UserState>) => {
      return {...state, ...action.payload};
    },
    clearUserState: () => {
      return initialState;
    },
    setProject: (state, action: PayloadAction<string | null>) => {
      return {...state, activeProject: action.payload};
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.fulfilled, () => {
        return initialState;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.error = null;
        Object.assign(state, action.payload);
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.error = null;
        if (action.payload) {
          Object.assign(state, action.payload);
        } else {
          return initialState;
        }
      })
      .addMatcher(
        isAnyOf(loginUser.rejected, logoutUser.rejected),
        (state, action) => {
          state.error = action.payload as string;
        }
      );
  }
});

export const { assignUserState, clearUserState, setProject, clearError } = UserStateSlice.actions;
export default UserStateSlice.reducer;

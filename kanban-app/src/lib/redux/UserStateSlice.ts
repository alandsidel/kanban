import { createSlice, createAsyncThunk, PayloadAction, isAnyOf } from '@reduxjs/toolkit';
import { appendErrorDetail, createAxiosAPIClient } from '../../util/JunkDrawer';

type UserState = {
  username: string,
  isAdmin: boolean,
  isElectron: boolean,
  activeProject: string|null,
  isLoading: boolean,
  error: string | null,
}

const initialState: UserState = {
  username: '',
  isAdmin: false,
  isElectron: false,
  activeProject: null,
  isLoading: false,
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
  async (_, { rejectWithValue }) => {
    try {
      const resp = await createAxiosAPIClient().get('/authcheck/');
      if (resp.status === 200) {
        return resp.data;
      } else {
        return rejectWithValue('Auth check failed');
      }
    } catch (error) {
      return rejectWithValue(appendErrorDetail('Network error occurred', error));
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
    setProject: (state, action: PayloadAction<string>) => {
      return {...state, activeProject: action.payload};
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Logout fulfilled - clear user state
      .addCase(logoutUser.fulfilled, () => {
        return initialState;
      })
      // Pending states
      .addMatcher(
        isAnyOf(loginUser.pending, logoutUser.pending, checkAuth.pending),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      // Login/checkAuth fulfilled - update user state
      .addMatcher(
        isAnyOf(loginUser.fulfilled, checkAuth.fulfilled),
        (state, action) => {
          state.isLoading = false;
          state.error = null;
          Object.assign(state, action.payload);
        }
      )
      // All rejected cases
      .addMatcher(
        isAnyOf(loginUser.rejected, logoutUser.rejected, checkAuth.rejected),
        (state, action) => {
          state.isLoading = false;
          state.error = action.payload as string;
        }
      );
  }
});

export const { assignUserState, clearUserState, setProject, clearError } = UserStateSlice.actions;
export default UserStateSlice.reducer;

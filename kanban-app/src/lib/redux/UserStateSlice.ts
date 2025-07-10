import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UserState = {
  username: string,
  isAdmin: boolean,
  isElectron: boolean,
  activeProject: string|null,
}

const initialState: UserState = {
  username: '',
  isAdmin: false,
  isElectron: false,
  activeProject: null
};

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
    }
  }
});

export const { assignUserState, clearUserState, setProject } = UserStateSlice.actions;
export default UserStateSlice.reducer;

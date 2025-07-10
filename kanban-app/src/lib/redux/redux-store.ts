import { configureStore } from '@reduxjs/toolkit';
import UserStateSliceReducer from './UserStateSlice';
import ProjectStateSliceReducer from './ProjectStateSlice';

export const store = configureStore({
  reducer: {
    userState: UserStateSliceReducer,
    projectState: ProjectStateSliceReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import axiosInstance from '../../axiosInstance';

export const getUserInfo = createAsyncThunk(
  'auth/getUserInfo',
  async (_, {rejectWithValue}) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const response = await axiosInstance.get(
        `http://localhost:8080/api/users/by-userid/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!token || !userId) {
        return rejectWithValue('getUserInfo: No user data found');
      }
      console.log('AsyncStorage(getUserInfo) user: ', response.data);

      return response.data; // {id, userId, email, userName, role}
    } catch (error) {
      console.error('getUSerInfo:',error);
      return rejectWithValue(error.message);
    }
  },
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({username, password}, {rejectWithValue}) => {
    try {
      const response = await axiosInstance.post(
        'http://localhost:8080/api/auth/authenticate',
        {
          userId: username,
          upassword: password,
        },
      );
      const token = response.data;

      if (!token || token.error) {
        throw new Error('토큰 생성에 실패했습니다.');
      }

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('userId', username);
      console.log('AsyncStorage(loginUser) token: ', token);
      console.log('AsyncStorage(loginUser) userId: ', username);

      return token;
    } catch (error) {
      console.error('loginUser:',error);
      return rejectWithValue(error.message);
    }
  },
);

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, // {id, userId, email, userName, role}
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: state => {
      state.user = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getUserInfo.fulfilled, (state, action) => {
        // getUserInfo 액션의 결과로 받아온 사용자 정보를 스토어에 저장 {id, userId, email, userName, role}
        state.user = action.payload;
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.user = null;
      });
  },
});

export const {setUser, clearUser} = authSlice.actions;
export default authSlice.reducer;

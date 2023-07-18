import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  inRoom: null,
  remoteId: null,
  localStream: null,
  preferences: null,
  remoteStream: null,
  localScreenStream: null,
  remoteStreamIDs: null,
  remoteScreenStream: null,
  remoteUserName: null,
};

export const videoRoomSlice = createSlice({
  name: "videoRooms",
  initialState,
  reducers: {
    setInRoom: (state, action) => {
      state.inRoom = action.payload;
    },
    setRemoteId: (state, action) => {
      state.remoteId = action.payload;
    },
    setPreferences: (state, action) => {
      state.preferences = action.payload;
    },
    setLocalStream: (state, action) => {
      state.localStream = action.payload;
    },
    setLocalScreenStream: (state, action) => {
      state.localScreenStream = action.payload;
    },
    setRemoteStream: (state, action) => {
      state.remoteStream = action.payload;
    },
    setRemoteStreamIDs: (state, action) => {
      state.remoteStreamIDs = action.payload;
    },
    setRemoteScreenStream: (state, action) => {
      state.remoteScreenStream = action.payload;
    },
    setRemoteUserName: (state, action) => {
      state.remoteUserName = action.payload;
    },
  },
});

export const {
  setInRoom,
  setRemoteId,
  setPreferences,
  setLocalStream,
  setLocalScreenStream,
  setRemoteStream,
  setRemoteStreamIDs,
  setRemoteScreenStream,
  setRemoteUserName,
} = videoRoomSlice.actions;
export default videoRoomSlice.reducer;

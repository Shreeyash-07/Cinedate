import { configureStore } from "@reduxjs/toolkit";
import videoRoomReducer from "../Slices/videoRoomSlice";
const store = configureStore({
  reducer: {
    videoRoom: videoRoomReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoreActions: [
          "videoRoom/setLocalStream",
          "videoRoom/setRemoteStream",
          "videoRoom/setLocalScreenStream",
          "videoRoom/setRemoteScreenStream",
        ],
        ignoredPaths: [
          "videoRoom.localStream",
          "videoRoom.remoteStream",
          "videoRoom.localScreenStream",
          "videoRoom.remoteScreenStream",
        ],
      },
    }),
});

export default store;

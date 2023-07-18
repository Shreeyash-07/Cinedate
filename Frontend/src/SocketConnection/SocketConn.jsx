import { io } from "socket.io-client";
import { RTCConnection, SDPProcess } from "../Hooks/WebRTC";
let socket = null;
const URL = "https://cinedateserver.onrender.com/";

export const connectWithSocketIOServer = () => {
  socket = io(URL, { transports: ["polling", "websocket"] });
  socket.on("connect", () => {
    console.log("Connected to socket Server");
  });

  socket.on("inform_other_about_me", (data) => {
    RTCConnection(data.connectionId);
  });

  socket.on("sdp-process", async (data) => {
    await SDPProcess(data.message, data.from_connId, data.from_name);
  });
};

export const socketIO = () => {
  return socket;
};

export const connectUser = (data) => {
  socket.emit("userconnect", data);
};

export const sendChatMessage = (message) => {
  socket.emit("message", message);
};

export const createVideoRoom = (data) => {
  socket.emit("video-room-create", data);
};

export const joinVideoRoom = (data) => {
  socket.emit("video-room-join", data);
};

export const handleSDP = (data, to_connId) => {
  socket.emit("sdp-process", {
    message: data,
    to_connId: to_connId,
  });
};

export const getCurrentUserName = (data) => {
  socket.emit("getname", data);
};

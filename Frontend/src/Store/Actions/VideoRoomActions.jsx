import { v4 as uuid } from "uuid";
import * as socket from "../../SocketConnection/SocketConn";
import { setInRoom } from "../../Slices/videoRoomSlice";
import store from "../../Store/Store";

export const CreateVideoRoom = async ({ userName }) => {
  const newRoomId = uuid().slice(0, 18);
  store.dispatch(setInRoom(newRoomId));
  socket.createVideoRoom({
    userName,
    newRoomId,
  });
};

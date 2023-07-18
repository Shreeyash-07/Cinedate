import * as socket from "../../SocketConnection/SocketConn";

export const proceedWithUserConnection = (data) => {
  socket.connectUser(data);
};

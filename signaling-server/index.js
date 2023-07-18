const express = require("express");
const app = express();
const http = require("http").createServer(app);
const { Server } = require("socket.io");

const PORT = process.env.PORT;

const server = http.listen(PORT, () => {
  console.log(`signalling server listening on port ${PORT}`);
});
const io = new Server(server);

app.get("/", (req, res) => {
  res.send(
    `<html>
      <head>Response from socket server ${PORT} </head>
      <body>
        <h1>
          This page was render direcly from the server{" "}
          <p>Hello there welcome to my website</p>
        </h1>
      </body>
    </html>`
  );
});
var userConnections = [];
io.on("connection", (socket) => {
  console.log(`A client connected with id ${socket.id}`);
  let meetingId = getMeetingId(socket.id);
  socket.on("userconnect", (data) => {
    handleUserConnect(data);
  });
  socket.on("video-room-create", (data) => {
    handleCreateRoom(socket, data);
  });

  socket.on("video-room-join", (data) => {
    handleJoinRoom(socket, data);
  });

  socket.on("sdp-process", (data) => {
    const senderName = getName(socket.id);

    socket.to(data.to_connId).emit("sdp-process", {
      message: data.message,
      from_connId: socket.id,
      from_name: senderName,
    });
  });
  socket.on("getname", (data) => {
    const name = getName(data);
    socket.emit("getname", name);
  });
  socket.on("message", (message) => {
    const meet = getMeetingId(socket.id);
    io.to(meet).emit("message", {
      message: message,
      sender: socket.id,
    });
  });
  socket.on("disconnect", () => {
    socket.leave(meetingId);
    disconnectEventHandler(socket.id);
    broadcastDisconnectedUser(socket.id);
  });
});

const getMeetingId = (connId) => {
  const foundUser = userConnections.find(
    (user) => user.connectionId === connId
  );
  return foundUser ? foundUser.meetingId : null;
};

const getName = (connId) => {
  const foundUser = userConnections.find(
    (user) => user.connectionId === connId
  );
  return foundUser ? foundUser.userName : null;
};

const broadcastDisconnectedUser = (id) => {};

const handleCreateRoom = (socket, data) => {
  var users_other_than_me = userConnections.filter(
    (user) => user.meetingId == data.meetingId
  );

  userConnections.push({
    connectionId: socket.id,
    userName: data.name,
    meetingId: data.meetingId,
  });
  socket.join(data.meetingId);
  users_other_than_me.forEach((user) => {
    socket.to(user.connectionId).emit("inform_other_about_me", {
      userName: data.name,
      connectionId: socket.id,
    });
  });
};

const handleJoinRoom = (socket, data) => {
  console.log("Join Room", data);
};

const disconnectEventHandler = (id) => {
  console.log(`User disconnected with ID ${id}`);
  removeOnlineUser(id);
};

const removeOnlineUser = (id) => {
  if (userConnections[id]) {
    delete userConnections[id];
  }
};

const handleUserConnect = (data) => {
  console.log("user :", { data });
};

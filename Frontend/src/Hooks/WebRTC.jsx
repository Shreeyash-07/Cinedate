import { handleSDP } from "../SocketConnection/SocketConn";
import store from "../Store/Store";
import {
  setRemoteStream,
  setRemoteId,
  setRemoteStreamIDs,
  setRemoteScreenStream,
  setRemoteUserName,
} from "../Slices/videoRoomSlice";

let peerConnection;
let remoteStream;

const servers = {
  iceServers: [
    {
      urls: [
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
        "stun:stun.services.mozilla.com",
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};
export const SDPProcess = async (message, from_connId, from_name) => {
  message = JSON.parse(message);
  store.dispatch(setRemoteUserName(from_name));
  if (message.answer) {
    console.log({ msid: message.answer.mediaStreamMetadata });
    store.dispatch(setRemoteStreamIDs(message.answer.mediaStreamMetadata));
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.answer.answer)
    );
  } else if (message.offer) {
    if (!peerConnection) {
      RTCConnection(from_connId);
    }
    console.log({ msid: message.offer.mediaStreamMetadata });
    store.dispatch(setRemoteStreamIDs(message.offer.mediaStreamMetadata));
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(message.offer.offer)
    );
    var answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    const mediaStreamMetadata = {
      [store.getState().videoRoom.localStream?.id]: { type: "camera" },
      [store.getState().videoRoom.localScreenStream?.id]: { type: "screen" },
    };
    const customAnswer = {
      answer: answer,
      mediaStreamMetadata,
    };
    handleSDP(JSON.stringify({ answer: customAnswer }), from_connId);
  } else if (message.icecandidate) {
    if (!peerConnection) {
      await RTCConnection(from_connId);
    }
    try {
      await peerConnection.addIceCandidate(message.icecandidate);
    } catch (e) {
      console.error("Error while adding candidate", e);
    }
  }
};

const setOffer = async (connId) => {
  var offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);
  const localStream = store.getState().videoRoom.localStream;
  const localScreenStream = store.getState().videoRoom.localScreenStream;
  const mediaStreamMetadata = {
    [localStream?.id]: { type: "camera" },
    [localScreenStream?.id]: { type: "screen" },
  };
  const customOffer = {
    offer: peerConnection.localDescription,
    mediaStreamMetadata,
  };
  handleSDP(JSON.stringify({ offer: customOffer }), connId);
};

export const RTCConnection = async (connectionId) => {
  store.dispatch(setRemoteId(connectionId));
  peerConnection = new RTCPeerConnection(servers);
  let localStream = store.getState().videoRoom.localStream;
  if (localStream) {
    localStream.getTracks().forEach(async (track) => {
      await peerConnection.addTrack(track, localStream);
    });
  }
  peerConnection.onnegotiationneeded = async (event) => {
    console.log("inside negotiatiion");
    await setOffer(connectionId);
  };
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      handleSDP(
        JSON.stringify({ icecandidate: event.candidate }),
        connectionId
      );
    }
  };

  peerConnection.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
    }
    remoteStream = event.streams[0];
    const streamMetadata = store.getState().videoRoom.remoteStreamIDs;
    console.log({ streamMetadata });
    const typeForGivenId = streamMetadata[remoteStream.id]?.type;
    if (typeForGivenId === "camera") {
      console.log("dispatching remote Strem");
      remoteStream.onremovetrack = ({ track }) => {
        if (track.kind === "video") {
          // Video track is removed, let's get the audio track and dispatch it
          const audioTrack = remoteStream.getAudioTracks()[0];
          if (audioTrack) {
            const newRemoteAudioStream = new MediaStream([audioTrack]);
            store.dispatch(setRemoteStream(newRemoteAudioStream));
          }
        }
      };
      store.dispatch(setRemoteStream(remoteStream));
    }
    if (typeForGivenId === "screen") {
      remoteStream.onremovetrack = () => {
        console.log("onremovefired");
        store.dispatch(setRemoteScreenStream(null));
      };
      console.log("dispatching remote screen");
      store.dispatch(setRemoteScreenStream(remoteStream));
    }
  };

  return peerConnection;
};

export const addTracks = (stream) => {
  stream.getTracks().forEach((track) => {
    peerConnection?.addTrack(track, stream);
  });
};

export const updateStream = (toBeDeletedTrack, videoTrack, newStream) => {
  console.log({ newVideoTrack: videoTrack });
  // const videoSender = peerConnection
  //   ?.getSenders()
  //   .find(
  //     (sender) =>
  //       sender.track &&
  //       sender.track.kind === "video" &&
  //       sender.track.id === toBeDeletedTrack.id
  //   );

  if (!videoTrack) {
    console.log("Replacing track");
    // videoSender.replaceTrack(videoTrack);
    peerConnection?.getSenders().forEach((sender) => {
      if (
        sender.track &&
        sender.track.kind === "video" &&
        sender.track.id === toBeDeletedTrack.id
      ) {
        peerConnection.removeTrack(sender);
      }
    });
  } else {
    console.log("Removing track");
    peerConnection?.addTrack(videoTrack, newStream);
  }
};

export const addScreenTrack = (screenStream) => {
  if (peerConnection) {
    screenStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, screenStream);
    });
  }
};

export const removeScreenShareTrack = (stream) => {
  const videoTrack = stream?.getVideoTracks()[0];
  const audioTrack = stream?.getAudioTracks()[0];
  if (peerConnection) {
    const videoSender = peerConnection.getSenders().find((sender) => {
      console.log({ track: sender.track });
      return (
        sender.track &&
        sender.track.kind === "video" &&
        sender.track.id === videoTrack.id
      );
    });
    const audioSender = peerConnection.getSenders().find((sender) => {
      console.log({ track: sender.track });
      return (
        sender.track &&
        sender.track.kind === "audio" &&
        sender.track.id === audioTrack.id
      );
    });
    if (videoSender) {
      peerConnection.removeTrack(videoSender);
    }
    if (audioSender) {
      peerConnection.removeTrack(audioSender);
    }
  }
};

export const removeVideoTrack = (videoTrack) => {
  if (peerConnection) {
    const videoSender = peerConnection.getSenders().find((sender) => {
      console.log({ track: sender.track });
      return (
        sender.track &&
        sender.track.kind === "video" &&
        sender.track.id === videoTrack.id
      );
    });
    console.log({ videoSender });
    if (videoSender) {
      console.log("removing track");
      peerConnection.removeTrack(videoSender);
    }
  }
};

export const addVideoTrack = (videoTrack, stream) => {
  if (peerConnection) {
    peerConnection.addTrack(videoTrack, stream);
  }
};

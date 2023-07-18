import React, {
  useMemo,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { dbRef } from "../Server/FireBase";
import { push, child, set, onChildAdded, ref, get } from "firebase/database";
import { database } from "../Server/FireBase";
import { io } from "socket.io-client";

const PeerConnectionContext = createContext(null);
const URL = "http://localhost:3001";
export const usePeerConnection = () => useContext(PeerConnectionContext);
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
const PeerConnectionProvider = (props) => {
  // const peerConnection = useMemo(() => new RTCPeerConnection(servers), []);
  const socket = io(URL, { transports: ["websocket"] });

  var peers_connection_ids = [];
  var peers_connection = [];
  var serverProcess;
  var remote_vid_stream = [];
  var remote_aud_stream = [];
  var audio;
  var isAudioMute = true;
  var videoSender = [];
  var videoState = {
    None: 0,
    Camera: 1,
    ScreenShare: 2,
  };
  var videoSt = videoState.None;
  var videoTrack;

  const eventProcess = async () => {
    if (!audio) {
      await loadAudio();
    }
    if (!audio) {
      alert("Audio permission has not granteed");
      return;
    }
    if (isAudioMute) {
      audio.enabled = true;
      updateMediaSenders(audio, videoSender);
    } else {
      audio.enabled = false;
      removeMediaSenders(videoSender);
    }
    isAudioMute = !isAudioMute;
  };

  const videoToggle = async () => {
    if (videoSt == videoState.Camera) {
      await videoProcess(videoState.None);
    } else {
      await videoProcess(videoState.Camera);
    }
  };
  const screenShareToggle = async () => {
    if (videoSt == videoState.ScreenShare) {
      await videoProcess(videoState.None);
    } else {
      await videoProcess(videoState.ScreenShare);
    }
  };

  const loadAudio = async () => {};
  const updateMediaSenders = () => {};
  const removeMediaSenders = () => {};
  const videoProcess = async (newVideoState) => {
    try {
      var videoStream = null;
      if (newVideoState == videoState.Camera) {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } else if (newVideoState == videoState.ScreenShare) {
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      }

      if (videoStream && videoStream.getVideoTracks().length > 0) {
        videoTrack = videoStream.getVideoTracks()[0];
        //set it as a local
      }
    } catch (e) {
      console.log(e);
      return;
    }
    videoSt = newVideoState;
  };

  const setConnection = async (connId) => {
    var connection = new RTCPeerConnection(servers);

    connection.onnegotiationneeded = async (event) => {
      await setOffer(connId);
    };

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        serverProcess(
          JSON.stringify({ icecandidate: event.candidate }),
          connId
        );
      }
    };

    connection.ontrack = (event) => {
      if (!remote_vid_stream[connId]) {
        remote_vid_stream[connId] = new MediaStream();
      }
      if (!remote_aud_stream[connId]) {
        remote_aud_stream[connId] = new MediaStream();
      }

      if (event.track.kind == "video") {
        remote_vid_stream[connId].getVideoTracks().forEach((track) => {
          remote_vid_stream[connId].removeTrack(event.track);
          remote_vid_stream[connId].addTrack(event.track);
        });
      } else if (event.track.kind === "audio") {
        remote_aud_stream[connId].getAudioTracks().forEach((track) => {
          remote_aud_stream[connId].removeTrack(event.track);
          remote_aud_stream[connId].addTrack(event.track);
        });
      }
    };

    peers_connection_ids[connId] = connId;
    peers_connection[connId] = connection;

    return connection;
  };

  const SDPProcess = async (message, from_connId) => {
    message = JSON.parse(message);
    if (message.answer) {
      await peers_connection[from_connId].setRemoteDescription(
        new RTCSessionDescription(message.answer)
      );
    } else if (message.offer) {
      if (!peers_connection[from_connId]) {
        await setConnection(from_connId);
      }
      await peers_connection[from_connId].setRemoteDescription(
        new RTCSessionDescription(message.offer)
      );
      var answer = await peers_connection[from_connId].createAnswer();
      await peers_connection[from_connId].setLocalDescription(answer);
      serverProcess(
        JSON.stringify({
          answer: answer,
        }),
        from_connId
      );
    } else if (message.icecandidate) {
      if (!peers_connection[from_connId]) {
        await setConnection(from_connId);
      }
      try {
        await peers_connection[from_connId].addIceCandidate(
          message.icecandidate
        );
      } catch (e) {
        console.log(e);
      }
    }
  };

  const setOffer = async (connId) => {
    var connection = peers_connection[connId];
    var offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    serverProcess(
      JSON.stringify({
        offer: connection.localDescription,
      }),
      connId
    );
  };

  // const createOffer = async (id, userName) => {
  //   const dateRef = ref(database, `Dates/${id}`);
  //   const offerCandidatesRef = child(dateRef, "offerCandidates");
  //   const answerCandidateRef = child(dateRef, "answersCandidates");
  //   const answersRef = child(dateRef, "answers");
  //   const offerRef = child(dateRef, "offers");

  //   peerConnection.onicecandidate = (event) => {
  //     event.candidate && push(offerCandidatesRef, event.candidate.toJSON());
  //   };
  //   const offerDescription = await peerConnection.createOffer();
  //   await peerConnection.setLocalDescription(offerDescription);

  //   const offer = {
  //     name: userName,
  //     sdp: offerDescription.sdp,
  //     type: offerDescription.type,
  //   };

  //   await set(offerRef, { offer });
  //   onChildAdded(answersRef, async (snap) => {
  //     const data = snap.val();
  //     console.log({ answerRef: data });
  //     if (!peerConnection.currentRemoteDescription && data) {
  //       const answerDescription = new RTCSessionDescription(data);
  //       try {
  //         await peerConnection.setRemoteDescription(answerDescription);
  //         console.log("Remote Set");
  //       } catch (e) {
  //         console.log({ ErrorWhileSeetinGRemote: e });
  //       }
  //     }
  //   });

  //   onChildAdded(answerCandidateRef, (snap) => {
  //     const candidate = new RTCIceCandidate(snap.val());
  //     peerConnection.addIceCandidate(candidate);
  //   });
  // };

  // const createAnswer = async (id, userName) => {
  //   const dateRef = ref(database, `Dates/${id}`);
  //   const offerCandidatesRef = child(dateRef, "offerCandidates");
  //   const answerCandidateRef = child(dateRef, "answersCandidates");
  //   const answersRef = child(dateRef, "answers");
  //   const offerRef = child(dateRef, "offers");

  //   peerConnection.onicecandidate = (event) => {
  //     console.log("Inside answer");
  //     event.candidate && push(answerCandidateRef, event.candidate.toJSON());
  //   };

  //   const snapshot = await get(child(dateRef, "offers"));
  //   const date = snapshot.val();
  //   console.log({ date: date });
  //   if (date.offer) {
  //     const offerDescription = new RTCSessionDescription(date.offer);
  //     await peerConnection.setRemoteDescription(offerDescription);

  //     const answerDescription = await peerConnection.createAnswer();
  //     await peerConnection.setLocalDescription(answerDescription);

  //     const answer = {
  //       name: userName,
  //       sdp: answerDescription.sdp,
  //       type: answerDescription.type,
  //     };

  //     await set(answersRef, { answer });

  //     onChildAdded(offerCandidatesRef, async (snap) => {
  //       const candidate = new RTCIceCandidate(snap.val());
  //       await peerConnection.addIceCandidate(candidate);
  //     });
  //   } else {
  //     console.error("Invalid offer data in the date object.");
  //   }
  // };

  return (
    <PeerConnectionContext.Provider
      value={{
        socket,
        setConnection,
      }}
    >
      {props.children}
    </PeerConnectionContext.Provider>
  );
};

export default PeerConnectionProvider;

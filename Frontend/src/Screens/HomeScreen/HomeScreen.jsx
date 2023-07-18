import "./HomeScreen.css";
import {
  BiMicrophone,
  BiMicrophoneOff,
  BiMessageSquareDetail,
} from "react-icons/bi";
import { PiPhoneDisconnectFill } from "react-icons/pi";
import { FiVideoOff, FiVideo, FiSettings } from "react-icons/fi";
import { PiMonitor } from "react-icons/pi";
import {
  LuScreenShare,
  LuScreenShareOff,
  LuClipboardCopy,
  LuClipboardCheck,
} from "react-icons/lu";
import { useEffect, useRef, useState } from "react";
import { usePeerConnection } from "../../Hooks/PeerConnectionProvider";
import { useParams, useLocation } from "react-router-dom";
import Chat from "../Chat/Chat";
import SmallScreen from "../SmallScreen/SmallScreen";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setLocalStream } from "../../Slices/videoRoomSlice";
import { setLocalScreenStream } from "../../Slices/videoRoomSlice";
import { addTracks } from "../../Hooks/WebRTC";
import { updateStream } from "../../Hooks/WebRTC";
import {
  getCurrentUserName,
  socketIO,
} from "../../SocketConnection/SocketConn";
import { sendChatMessage } from "../../SocketConnection/SocketConn";
import { addScreenTrack } from "../../Hooks/WebRTC";
import { removeScreenShareTrack, removeVideoTrack } from "../../Hooks/WebRTC";

const HomeScreen = () => {
  const dispatch = useDispatch();
  const { state } = useLocation();
  const { id } = useParams();
  const remoteId = useSelector((state) => state.videoRoom.remoteId);
  const localStream = useSelector((state) => state.videoRoom.localStream);
  const localScreenStream = useSelector(
    (state) => state.videoRoom.localScreenStream
  );
  const remoteStream = useSelector((state) => state.videoRoom.remoteStream);
  const remoteScreenStream = useSelector(
    (state) => state.videoRoom.remoteScreenStream
  );
  const remoteUserName = useSelector((state) => state.videoRoom.remoteUserName);

  const [copied, setCopied] = useState(false);
  const [currentUserName, setcurrentUserName] = useState("");
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [stream, setStream] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const localvideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localScreenRef = useRef(null);
  const remoteScreenRef = useRef(null);

  useEffect(() => {
    if (localStream && localvideoRef.current) {
      localvideoRef.current.srcObject = localStream;
      setStream(localStream);
    }
    if (localScreenStream && localScreenRef.current) {
      localScreenRef.current.srcObject = localScreenStream;
    }
    if (remoteScreenStream && remoteScreenRef.current) {
      remoteScreenRef.current.srcObject = remoteScreenStream;
    }
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    setVideoEnabled(localStream?.getVideoTracks().length > 0);
    setAudioEnabled(localStream?.getAudioTracks().length > 0);
  }, [localStream, remoteStream, localScreenStream, remoteScreenStream]);

  useEffect(() => {
    const socket = socketIO();
    if (socket) {
      setCurrentUser(socket.id);
      getCurrentUserName(socket.id);
      socket.on("getname", (name) => {
        setcurrentUserName(name);
      });
    }
  }, []);
  useEffect(() => {
    const socket = socketIO();
    if (socket) {
      socket.on("message", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }
  }, []);

  const handleCopyToClipBoard = () => {
    setCopied(true);

    navigator.clipboard.writeText(id);
    setTimeout(() => {
      setCopied(false);
    }, 1000);
  };

  const handleAudio = async () => {
    if (stream) {
      if (audioEnabled) {
        stream.getAudioTracks()[0].stop();
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: !audioEnabled,
      });
      setStream(newStream);
      addTracks(newStream);

      if (localvideoRef.current) {
        localvideoRef.current.srcObject = newStream;
      }
    }
    setAudioEnabled(!audioEnabled);
  };

  const handleVideo = async () => {
    if (stream) {
      if (videoEnabled) {
        stream.getVideoTracks()[0].stop();
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: !videoEnabled,
        audio: audioEnabled,
      });
      if (localvideoRef.current) {
        localvideoRef.current.srcObject = newStream;
      }
      const videoTrack = newStream.getVideoTracks()[0];
      updateStream(stream.getVideoTracks()[0], videoTrack, newStream);
      setStream(newStream);
      dispatch(setLocalStream(newStream));
    }
    setVideoEnabled(!videoEnabled);
  };

  const handleMessage = (message) => {
    sendChatMessage(message, remoteId);
  };

  const handleScreenShare = async () => {
    if (!screenShareActive) {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      dispatch(setLocalScreenStream(screenStream));
      addScreenTrack(screenStream);
      setScreenShareActive(true);
    } else {
      if (localScreenStream) {
        localScreenStream.getTracks().forEach((track) => {
          track.stop();
        });
        dispatch(setLocalScreenStream(null));
        setScreenShareActive(false);
        removeScreenShareTrack(localScreenStream);
      }
    }
  };

  const onMouseMove = (e) => {
    setCursorPosition({ top: e.screenY, left: e.screenX });
  };
  return (
    <div className="mainContainer">
      <div className="innerContainer">
        <div className="copyId" onClick={handleCopyToClipBoard}>
          <div className="idText">{id}</div>
          {copied ? (
            <LuClipboardCheck className="clipicon" />
          ) : (
            <LuClipboardCopy className="clipicon" />
          )}
        </div>
        <div className="screenContainer">
          <video
            ref={
              remoteScreenStream != null
                ? remoteScreenRef
                : localScreenStream != null
                ? localScreenRef
                : localvideoRef
            }
            playsInline
            autoPlay
            className="videoScreen"
          ></video>
          {localScreenRef.current ? (
            <div className="nameLabel">You are presenting</div>
          ) : remoteScreenRef.current ? (
            <div className="nameLabel">{remoteUserName} is presenting</div>
          ) : (
            <div className="nameLabel">{currentUserName} (Me)</div>
          )}

          {remoteStream && (
            <div className="smallScreen">
              <SmallScreen
                stream={remoteStream}
                vref={remoteVideoRef}
                name={remoteUserName}
              />
            </div>
          )}
          {remoteScreenStream && (
            <div className="smallScreenStream">
              <SmallScreen
                stream={localStream}
                vref={localvideoRef}
                name={`${currentUserName} (Me)`}
              />
            </div>
          )}
          {localScreenStream && (
            <div className="smallScreenStream">
              <SmallScreen
                stream={localStream}
                vref={localvideoRef}
                name={`${currentUserName} (Me)`}
              />
            </div>
          )}
        </div>
        <div className="iconsContainer">
          <div className="iconbucket">
            <FiSettings className="icons" />
          </div>
          <div className="iconbucket" onClick={handleAudio}>
            {audioEnabled ? (
              <BiMicrophone className="icons" />
            ) : (
              <BiMicrophoneOff className="icons" />
            )}
          </div>
          <div className="disconnecticonbucket">
            <PiPhoneDisconnectFill className="disconneticon" />
          </div>
          <div className="iconbucket" onClick={handleVideo}>
            {videoEnabled ? (
              <FiVideo className="icons" />
            ) : (
              <FiVideoOff className="icons" />
            )}
          </div>
          <div className="iconbucket" onClick={handleScreenShare}>
            {!screenShareActive ? (
              <LuScreenShare className="icons" />
            ) : (
              <LuScreenShareOff className="icons" />
            )}
          </div>
        </div>
        {chatModalOpen && (
          <div className="chatModal">
            <Chat
              handleMessage={handleMessage}
              messages={messages}
              currentUser={currentUser}
            />
          </div>
        )}
        <div
          className="messageContainer"
          onClick={() => setChatModalOpen(!chatModalOpen)}
        >
          <BiMessageSquareDetail className="icons" />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

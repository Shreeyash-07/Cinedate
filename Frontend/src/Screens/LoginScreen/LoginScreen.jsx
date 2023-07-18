import React, { useEffect, useState, useRef } from "react";
import "./LoginScreen.css";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import * as socket from "../../SocketConnection/SocketConn";
import { useDispatch } from "react-redux";
import {
  setInRoom,
  setPreferences,
  setLocalStream,
} from "../../Slices/videoRoomSlice";
import { FiVideoOff, FiVideo } from "react-icons/fi";
import { BiMicrophone, BiMicrophoneOff } from "react-icons/bi";
const LoginScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [hostName, setHostName] = useState("");
  const [guestName, setGuestName] = useState("");
  const [id, setID] = useState("");
  const [micEnable, setMicEnable] = useState(true);
  const [videoEnable, setVideoEnable] = useState(true);
  const [stream, setStream] = useState(null);
  const videoRef = useRef();

  useEffect(() => {
    let localStream = null;
    const run = async () => {
      socket.connectWithSocketIOServer();
      localStream = await getUserStream();
      setStream(localStream);
    };
    run();
  }, [getUserStream]);

  const createDateRoom = async (e) => {
    e.preventDefault();
    if (hostName) {
      const id = uuidv4().slice(0, 18);
      dispatch(setInRoom(id));
      dispatch(setPreferences({ video: videoEnable, audio: micEnable }));
      dispatch(setLocalStream(stream));
      socket.createVideoRoom({ name: hostName, meetingId: id });
      navigate(`/${id}`);
    } else {
      alert("Please Enter the name");
      return;
    }
  };

  const joinDateRoom = async (e) => {
    e.preventDefault();
    if (guestName && id) {
      dispatch(setInRoom(id));
      dispatch(setPreferences({ video: videoEnable, audio: micEnable }));
      dispatch(setLocalStream(stream));
      socket.createVideoRoom({ name: guestName, meetingId: id });
      navigate(`/${id}`);
    } else {
      alert("Please enter the details");
      return;
    }
  };

  const getUserStream = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: videoEnable,
      audio: micEnable,
    });
    setStream(localStream);
    if (videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
    dispatch(setLocalStream(localStream));
    return localStream;
  };

  const handleVideo = async () => {
    if (stream) {
      if (videoEnable) {
        stream.getVideoTracks()[0].stop();
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: !videoEnable,
        audio: micEnable,
      });
      setStream(newStream);
      dispatch(setLocalStream(newStream));
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    }
    setMicEnable(!micEnable);
  };

  const handleAudio = async () => {
    if (stream) {
      if (micEnable) {
        stream.getAudioTracks()[0].stop();
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnable,
        audio: !micEnable,
      });
      setStream(newStream);
      dispatch(setLocalStream(newStream));
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    }
    setVideoEnable(!micEnable);
  };
  return (
    <div className="wrapper">
      <div className="container">
        <div className="loginStream">
          <video
            ref={videoRef}
            playsInline
            autoPlay
            className="videoScreen"
          ></video>
          <div className="streamControls">
            <div className="streamControlBucket" onClick={handleAudio}>
              {micEnable ? (
                <BiMicrophone className="streamIcon" />
              ) : (
                <BiMicrophoneOff className="streamIcon" />
              )}
            </div>
            <div className="streamControlBucket" onClick={handleVideo}>
              {videoEnable ? (
                <FiVideo className="streamIcon" />
              ) : (
                <FiVideoOff className="streamIcon" />
              )}
            </div>
          </div>
        </div>
        <div className="formsDiv">
          <form onSubmit={createDateRoom} className="formEdit">
            <div className="createdate">Create Date</div>
            <div className="lowerContainer">
              <input
                type="text"
                className="inputDate"
                placeholder="Enter Your Name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
              />
              <button className="createButton" type="submit">
                Create Date ❤️
              </button>
            </div>
          </form>
          <div className="line" />
          <form onSubmit={joinDateRoom} className="formEdit">
            <div className="joindate">Join Date</div>
            <div className="lowerContainer">
              <input
                type="text"
                className="inputDate"
                placeholder="Enter Your Name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
              <input
                type="text"
                className="inputDate"
                placeholder="Enter Date ID"
                value={id}
                onChange={(e) => setID(e.target.value)}
              />
              <button className="createButton">Join Date ❤️</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

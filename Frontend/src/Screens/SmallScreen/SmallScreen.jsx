import "./SmallScreen.css";
import React, { useEffect, useRef, useState } from "react";

const SmallScreen = ({ stream, vref, name }) => {
  useEffect(() => {
    console.log(name);
    console.log(stream.getVideoTracks()[0]);
    console.log(stream.getTracks());
    if (vref.current && stream) {
      vref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="smallScreenContainer">
      {stream.getVideoTracks()[0] && (
        <video
          ref={vref}
          playsInline
          autoPlay
          className="smallvideoScreen"
        ></video>
      )}

      <div className="streamsenderName">{name}</div>
    </div>
  );
};

export default SmallScreen;

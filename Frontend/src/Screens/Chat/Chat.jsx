import "./Chat.css";
import React, { useState } from "react";
const Chat = ({ handleMessage, messages, currentUser }) => {
  const [message, setMessage] = useState("");

  const handleChatMessage = (e) => {
    e.preventDefault();
    handleMessage(message);
    setMessage("");
  };
  return (
    <div className="chatContainer">
      <div className="messagesContainer">
        {messages.map((msg, index) => {
          {
            return msg.sender === currentUser ? (
              <div key={index} className="leftMessage">
                {msg.message}
              </div>
            ) : (
              <div key={index} className="rightMessage">
                {msg.message}
              </div>
            );
          }
        })}
      </div>
      <div>
        <form onSubmit={handleChatMessage} className="chatSender">
          <input
            type="text"
            id=""
            placeholder="Type a message"
            value={message}
            className="chatInput"
            onChange={(e) => setMessage(e.target.value)}
          />
          <button type="submit" className="sendButton">
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

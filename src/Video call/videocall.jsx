// import React, { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";

// const socket = io("http://localhost:7007");
// const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// function VideoCall() {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const peerConnection = useRef(null);
//   const [roomId, setRoomId] = useState("");
//   const [inCall, setInCall] = useState(false);

//   const startCall = async () => {
//     socket.emit("join-room", roomId);
//   };

//   useEffect(() => {
//     let localStream;

//     const initPeerConnection = async () => {
//       peerConnection.current = new RTCPeerConnection(servers);

//       peerConnection.current.ontrack = (event) => {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       };

//       peerConnection.current.onicecandidate = (event) => {
//         if (event.candidate) {
//           socket.emit("signal", {
//             roomId,
//             data: { candidate: event.candidate },
//           });
//         }
//       };

//       localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//       localVideoRef.current.srcObject = localStream;
//       localStream
//         .getTracks()
//         .forEach((track) =>
//           peerConnection.current.addTrack(track, localStream)
//         );
//     };

//     socket.on("created", async () => {
//       await initPeerConnection();
//       const offer = await peerConnection.current.createOffer();
//       await peerConnection.current.setLocalDescription(offer);
//       socket.emit("signal", { roomId, data: { offer } });
//       setInCall(true);
//     });

//     socket.on("joined", async () => {
//       await initPeerConnection();
//       setInCall(true);
//     });

//     socket.on("ready", async () => {
//       const offer = await peerConnection.current.createOffer();
//       await peerConnection.current.setLocalDescription(offer);
//       socket.emit("signal", { roomId, data: { offer } });
//     });

//     socket.on("signal", async ({ data }) => {
//       if (data.offer) {
//         await peerConnection.current.setRemoteDescription(
//           new RTCSessionDescription(data.offer)
//         );
//         const answer = await peerConnection.current.createAnswer();
//         await peerConnection.current.setLocalDescription(answer);
//         socket.emit("signal", { roomId, data: { answer } });
//       } else if (data.answer) {
//         await peerConnection.current.setRemoteDescription(
//           new RTCSessionDescription(data.answer)
//         );
//       } else if (data.candidate) {
//         try {
//           await peerConnection.current.addIceCandidate(
//             new RTCIceCandidate(data.candidate)
//           );
//         } catch (err) {
//           console.error("ICE Candidate Error:", err);
//         }
//       }
//     });

//     return () => {
//       socket.off("created");
//       socket.off("joined");
//       socket.off("ready");
//       socket.off("signal");
//     };
//   }, [roomId]);

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>🔵 WebRTC Video Call</h2>
//       <input
//         placeholder="Enter Room ID"
//         value={roomId}
//         onChange={(e) => setRoomId(e.target.value)}
//       />
//       <button onClick={startCall} disabled={inCall || !roomId}>
//         Join Call
//       </button>

//       <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
//         <div>
//           <h4>📷 Your Video</h4>
//           <video
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//             style={{ width: 300 }}
//           />
//         </div>
//         <div>
//           <h4>🎥 Remote Video</h4>
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             style={{ width: 300 }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// export default VideoCall;

import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("https://videocallbackend-rjrw.onrender.com");
const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const [roomId, setRoomId] = useState("");
  const [inCall, setInCall] = useState(false);

  const startCall = () => {
    if (!roomId.trim()) return alert("Enter a room ID");
    socket.emit("join-room", roomId);
  };

  useEffect(() => {
    let localStream;

    const initPeerConnection = async () => {
      peerConnection.current = new RTCPeerConnection(servers);

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", {
            roomId,
            data: { candidate: event.candidate },
          });
        }
      };

      peerConnection.current.ontrack = (event) => {
        console.log("ontrack event", event);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Get user media and add tracks
      localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localVideoRef.current.srcObject = localStream;
      localStream.getTracks().forEach((track) => {
        peerConnection.current.addTrack(track, localStream);
      });
    };

    // When this user creates the room (first user)
    socket.on("created", async () => {
      console.log("Created room");
      await initPeerConnection();

      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);

      socket.emit("signal", { roomId, data: { offer } });
      setInCall(true);
    });

    // When second user joins the room
    socket.on("joined", async () => {
      console.log("Joined room");
      await initPeerConnection();
      setInCall(true);
    });

    // Ready event signals second user to wait for offer
    socket.on("ready", async () => {
      console.log("Ready event received");
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("signal", { roomId, data: { offer } });
    });

    socket.on("signal", async ({ data }) => {
      try {
        if (data.offer) {
          console.log("Received offer");
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("signal", { roomId, data: { answer } });
        } else if (data.answer) {
          console.log("Received answer");
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } else if (data.candidate) {
          console.log("Received ICE candidate");
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        }
      } catch (err) {
        console.error("Signal handling error", err);
      }
    });

    return () => {
      socket.off("created");
      socket.off("joined");
      socket.off("ready");
      socket.off("signal");
    };
  }, [roomId]);

  return (
    <div style={{ padding: 20 }}>
      <h2>WebRTC Video Call</h2>
      <input
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={startCall} disabled={inCall || !roomId.trim()}>
        Join Call
      </button>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <div>
          <h4>Your Video</h4>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 300, backgroundColor: "#000" }}
          />
        </div>
        <div>
          <h4>Remote Video</h4>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{ width: 300, backgroundColor: "#000" }}
          />
        </div>
      </div>
    </div>
  );
}

export default VideoCall;

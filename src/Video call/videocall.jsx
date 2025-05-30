// import React, { useEffect, useRef, useState } from "react";
// import { io } from "socket.io-client";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faMicrophone,
//   faMicrophoneSlash,
//   faVolumeUp,
//   faVolumeMute,
// } from "@fortawesome/free-solid-svg-icons";

// const socket = io("https://videocallbackend-rjrw.onrender.com");
// const servers = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// function VideoCall() {
//   const localVideoRef = useRef(null);
//   const remoteVideoRef = useRef(null);
//   const peerConnection = useRef(null);
//   const localStreamRef = useRef(null);

//   const [roomId, setRoomId] = useState("");
//   const [inCall, setInCall] = useState(false);
//   const [isLocalMuted, setIsLocalMuted] = useState(false);
//   const [isRemoteMuted, setIsRemoteMuted] = useState(false);

//   const startCall = () => {
//     socket.emit("join-room", roomId);
//   };

//   const toggleLocalMute = () => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getAudioTracks().forEach((track) => {
//         track.enabled = !track.enabled;
//       });
//       setIsLocalMuted((prev) => !prev);
//     }
//   };

//   const toggleRemoteMute = () => {
//     if (remoteVideoRef.current) {
//       remoteVideoRef.current.muted = !remoteVideoRef.current.muted;
//       setIsRemoteMuted((prev) => !prev);
//     }
//   };

//   const createPeerConnection = () => {
//     peerConnection.current = new RTCPeerConnection(servers);

//     peerConnection.current.onicecandidate = (event) => {
//       if (event.candidate) {
//         socket.emit("signal", {
//           roomId,
//           data: { candidate: event.candidate },
//         });
//       }
//     };

//     peerConnection.current.ontrack = (event) => {
//       if (remoteVideoRef.current) {
//         remoteVideoRef.current.srcObject = event.streams[0];
//       }
//     };

//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => {
//         peerConnection.current.addTrack(track, localStreamRef.current);
//       });
//     }
//   };

//   useEffect(() => {
//     const getLocalStream = async () => {
//       try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//           video: true,
//           audio: true,
//         });
//         localStreamRef.current = stream;
//         localVideoRef.current.srcObject = stream;
//       } catch (error) {
//         console.error("Error accessing media devices.", error);
//       }
//     };

//     getLocalStream();

//     socket.on("created", () => {
//       createPeerConnection();
//       setInCall(true);
//     });

//     socket.on("joined", () => {
//       createPeerConnection();
//       socket.emit("ready", roomId);
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
//           console.error("ICE error", err);
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
//         {/* Local Video */}
//         <div style={{ position: "relative", width: 300 }}>
//           <h4>📷 Your Video</h4>
//           <video
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//             style={{ width: "100%" }}
//           />
//           <button
//             onClick={toggleLocalMute}
//             style={overlayButtonStyle}
//             title={isLocalMuted ? "Unmute Mic" : "Mute Mic"}
//           >
//             <FontAwesomeIcon
//               icon={isLocalMuted ? faMicrophoneSlash : faMicrophone}
//               size="lg"
//             />
//           </button>
//         </div>

//         {/* Remote Video */}
//         <div style={{ position: "relative", width: 300 }}>
//           <h4>🎥 Remote Video</h4>
//           <video
//             ref={remoteVideoRef}
//             autoPlay
//             playsInline
//             style={{ width: "100%" }}
//           />
//           <button
//             onClick={toggleRemoteMute}
//             style={overlayButtonStyle}
//             title={isRemoteMuted ? "Unmute Remote" : "Mute Remote"}
//           >
//             <FontAwesomeIcon
//               icon={isRemoteMuted ? faVolumeMute : faVolumeUp}
//               size="lg"
//             />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
// const overlayButtonStyle = {
//   position: "absolute",
//   bottom: 10,
//   right: 10,
//   background: "rgba(0,0,0,0.6)",
//   color: "#fff",
//   border: "none",
//   borderRadius: "50%",
//   padding: "10px",
//   cursor: "pointer",
// };

// export default VideoCall;
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { v4 as uuid } from "uuid";

const socket = io("https://videocallbackend-rjrw.onrender.com"); // ✅ Your signaling server

const VideoCall = () => {
  const { roomId } = useParams(); // ✅ Dynamic room ID
  const localVideoRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const userId = useRef(uuid());

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;

      socket.emit("join-room", roomId, userId.current);
    };

    init();

    // ✅ When someone else joins the room
    socket.on("user-joined", async (newUserId) => {
      if (newUserId === userId.current) return;

      const pc = createPeerConnection(newUserId);
      peersRef.current[newUserId] = pc;

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("signal", {
        to: newUserId,
        from: userId.current,
        data: { sdp: pc.localDescription },
      });
    });

    // ✅ When receiving SDP or ICE
    socket.on("signal", async ({ from, data }) => {
      if (from === userId.current) return;

      let pc = peersRef.current[from];
      if (!pc) {
        pc = createPeerConnection(from);
        peersRef.current[from] = pc;

        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));

        if (data.sdp.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit("signal", {
            to: from,
            from: userId.current,
            data: { sdp: pc.localDescription },
          });
        }
      }

      if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("ICE Candidate Error:", err);
        }
      }
    });

    // ✅ Cleanup when someone leaves
    socket.on("user-left", (leftUserId) => {
      if (peersRef.current[leftUserId]) {
        peersRef.current[leftUserId].close();
        delete peersRef.current[leftUserId];
        setRemoteStreams((prev) => {
          const copy = { ...prev };
          delete copy[leftUserId];
          return copy;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const createPeerConnection = (peerId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          to: peerId,
          from: userId.current,
          data: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerId]: event.streams[0],
      }));
    };

    return pc;
  };

  return (
    <div style={{ padding: "10px" }}>
      <h2>🔗 Room ID: {roomId}</h2>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        width={200}
        style={{ border: "2px solid green", marginBottom: "10px" }}
      />
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <video
            key={id}
            autoPlay
            playsInline
            width={200}
            ref={(video) => {
              if (video) video.srcObject = stream;
            }}
            style={{ border: "2px solid blue" }}
          />
        ))}
      </div>
    </div>
  );
};

export default VideoCall;

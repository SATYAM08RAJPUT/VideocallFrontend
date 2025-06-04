import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { v4 as uuid } from "uuid";

const socket = io("https://videocallbackend-rjrw.onrender.com"); // your backend

const ROOM_ID = "classroom-101"; // static room (or make dynamic)

const VideoCall = () => {
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const [remoteStreams, setRemoteStreams] = useState({});
  const userId = useRef(uuid());

  useEffect(() => {
    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socket.emit("join-room", {
        roomId: ROOM_ID,
        userId: userId.current,
      });
    };

    init();

    // 1. Receive list of users already in the room
    socket.on("all-users", (users) => {
      users.forEach(({ userId: remoteUserId, socketId }) => {
        const pc = createPeerConnection(socketId);
        peersRef.current[socketId] = pc;

        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });

        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer);
          socket.emit("signal", {
            to: socketId,
            from: socket.id,
            data: { sdp: offer },
          });
        });
      });
    });

    // 2. A new user joined after you
    socket.on("user-joined", ({ userId: remoteUserId, socketId }) => {
      const pc = createPeerConnection(socketId);
      peersRef.current[socketId] = pc;

      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    });

    // 3. Handle signal (SDP or ICE)
    socket.on("signal", async ({ from, data }) => {
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
            from: socket.id,
            data: { sdp: answer },
          });
        }
      }

      if (data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error("Error adding ICE candidate", err);
        }
      }
    });

    // 4. Handle user left
    socket.on("user-left", (leftUserId) => {
      const pc = peersRef.current[leftUserId];
      if (pc) {
        pc.close();
        delete peersRef.current[leftUserId];
        setRemoteStreams((prev) => {
          const updated = { ...prev };
          delete updated[leftUserId];
          return updated;
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Peer connection setup
  const createPeerConnection = (peerSocketId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", {
          to: peerSocketId,
          from: socket.id,
          data: { candidate: event.candidate },
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [peerSocketId]: event.streams[0],
      }));
    };

    return pc;
  };

  return (
    <div style={{ padding: "10px" }}>
      <h2>📹 Classroom Video Call</h2>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        width={250}
        style={{ border: "3px solid green", marginBottom: "10px" }}
      />
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {Object.entries(remoteStreams).map(([id, stream]) => (
          <video
            key={id}
            autoPlay
            playsInline
            width={250}
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

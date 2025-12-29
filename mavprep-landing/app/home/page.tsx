"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  signOut,
  fetchUserAttributes,
  getCurrentUser,
} from "@aws-amplify/auth";
import { io, Socket } from "socket.io-client";
import Peer from "simple-peer";
import AuthGuard from "../../components/AuthGuard";

type Channel = {
  id: string;
  name: string;
  type: "text" | "voice";
  privacy?: "public" | "private";
  password?: string;
  editable?: boolean;
  createdBy?: string;
  createdAt?: string;
  course?: string;
};

type Message = {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date | string;
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: {
    id: string;
    userName: string;
    content: string;
  };
};

// Common emojis for quick picker
const EMOJI_LIST = [
  "😀",
  "😂",
  "😍",
  "🤔",
  "👍",
  "👎",
  "❤️",
  "🔥",
  "🎉",
  "👏",
  "🙌",
  "💯",
  "✅",
  "❌",
  "⭐",
  "💡",
  "📚",
  "✏️",
  "💻",
  "🎓",
  "📝",
  "🤓",
  "😅",
  "🙏",
];

const DEFAULT_CHANNELS: Channel[] = [
  {
    id: "c-1",
    name: "Final Review",
    type: "text",
    privacy: "public",
    course: "CSE 2320 - Data Structures",
    createdBy: "aroudra_thakur",
  },
  {
    id: "c-2",
    name: "Last Minute Q&A",
    type: "text",
    privacy: "public",
    course: "CSE 3318 - Algorithms",
    createdBy: "aroudra_thakur",
  },
  {
    id: "c-3",
    name: "Group Study",
    type: "text",
    privacy: "public",
    course: "CSE 3320 - Operating Systems",
    createdBy: "aroudra_thakur",
  },
  {
    id: "c-4",
    name: "Project Help",
    type: "text",
    privacy: "public",
    course: "CSE 3330 - Databases",
    createdBy: "aroudra_thakur",
  },
  {
    id: "v-1",
    name: "Study Room A",
    type: "voice",
    privacy: "public",
    course: "General Study",
    createdBy: "aroudra_thakur",
  },
  {
    id: "v-2",
    name: "Silent Focus",
    type: "voice",
    privacy: "public",
    course: "Quiet Study Zone",
    createdBy: "aroudra_thakur",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [_channelsLoading, setChannelsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch channels from DynamoDB on every page load
  useEffect(() => {
    async function fetchChannels() {
      setChannelsLoading(true);
      try {
        const response = await fetch("/api/channels", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.channels && data.channels.length > 0) {
            setChannels(data.channels);
          } else {
            // If no channels in DB, seed them
            const seedResponse = await fetch("/api/seed-channels", {
              method: "POST",
              cache: "no-store",
            });
            if (seedResponse.ok) {
              const seedData = await seedResponse.json();
              if (seedData.channels) {
                setChannels(seedData.channels);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
        // Keep default channels as fallback
      } finally {
        setChannelsLoading(false);
      }
    }

    fetchChannels();
  }, []);

  // Text channel state
  const [activeTextChannel, setActiveTextChannel] = useState<Channel | null>(
    null
  );
  const [messages, setMessages] = useState<{ [channelId: string]: Message[] }>(
    {}
  );
  const [messageInput, setMessageInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editInput, setEditInput] = useState("");
  const [deletingMessage, setDeletingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<
    { username: string; email: string; description?: string; createdAt?: string }[]
  >([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [showUserSearchResults, setShowUserSearchResults] = useState(false);
  const userSearchRef = useRef<HTMLDivElement>(null);
  const userSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // User profile modal state
  const [selectedUserProfile, setSelectedUserProfile] = useState<{
    username: string;
    email: string;
    description?: string;
    createdAt?: string;
  } | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Voice call state
  const [activeCall, setActiveCall] = useState<null | {
    channelId: string;
    name: string;
    privacy: "public" | "private";
    password?: string;
  }>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [callPassword, setCallPassword] = useState("");
  const [callError, setCallError] = useState<string | null>(null);
  const [inCall, setInCall] = useState(false);
  const [showVoiceCallView, setShowVoiceCallView] = useState(true); // Controls if voice call UI is expanded
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [participants, setParticipants] = useState<
    {
      id: string;
      name: string;
      isMuted: boolean;
      isSpeaking: boolean;
      hasVideo?: boolean;
    }[]
  >([]);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Disconnected");

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoStreamRef = useRef<MediaStream | null>(null);

  // User profile state
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    isLoading: boolean;
  }>({
    id: "",
    name: "",
    email: "",
    avatar: null,
    isLoading: true,
  });

  // Fetch actual user data from Cognito on every page load
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchUserData() {
      try {
        const user = await getCurrentUser();
        const attributes = await fetchUserAttributes();

        if (!isMounted) return;

        // Use preferred_username if available, otherwise email
        const displayName =
          attributes.preferred_username || attributes.email || "User";

        setCurrentUser({
          id: user.userId,
          name: displayName,
          email: attributes.email || "",
          avatar: attributes.picture || null,
          isLoading: false,
        });
      } catch (error) {
        console.log(
          "Error fetching user data (attempt " + (retryCount + 1) + "):",
          error
        );

        // Retry a few times in case session isn't ready yet
        if (retryCount < maxRetries && isMounted) {
          retryCount++;
          setTimeout(fetchUserData, 500 * retryCount);
        } else if (isMounted) {
          setCurrentUser((prev) => ({ ...prev, isLoading: false }));
        }
      }
    }

    // Small delay to ensure auth session is ready
    const timeoutId = setTimeout(fetchUserData, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<{ [id: string]: InstanceType<typeof Peer> }>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioRefs = useRef<{ [id: string]: HTMLAudioElement }>({});
  const userIdRef = useRef<string>("");
  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio cue system using Web Audio API
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  const playTone = (
    frequency: number,
    duration: number,
    type: OscillatorType = "sine",
    volume: number = 0.3
  ) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + duration
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio cue failed:", e);
    }
  };

  const playJoinSound = () => {
    // Rising two-tone sound (like Discord join)
    playTone(400, 0.15, "sine", 0.25);
    setTimeout(() => playTone(600, 0.15, "sine", 0.25), 100);
  };

  const playLeaveSound = () => {
    // Falling two-tone sound (like Discord leave)
    playTone(500, 0.15, "sine", 0.25);
    setTimeout(() => playTone(350, 0.2, "sine", 0.25), 100);
  };

  const playMuteSound = () => {
    // Quick low beep
    playTone(300, 0.1, "sine", 0.2);
  };

  const playUnmuteSound = () => {
    // Quick high beep
    playTone(500, 0.1, "sine", 0.2);
  };

  const playDeafenSound = () => {
    // Two quick low beeps
    playTone(250, 0.08, "sine", 0.2);
    setTimeout(() => playTone(200, 0.12, "sine", 0.2), 80);
  };

  const playUndeafenSound = () => {
    // Two quick high beeps
    playTone(400, 0.08, "sine", 0.2);
    setTimeout(() => playTone(550, 0.12, "sine", 0.2), 80);
  };

  function removeRemoteAudio(id: string) {
    const audio = audioRefs.current[id];
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      delete audioRefs.current[id];
    }
  }

  // Helper function to create a peer connection
  function createPeer(
    remoteSocketId: string,
    initiator: boolean,
    stream: MediaStream
  ): InstanceType<typeof Peer> {
    const peer = new Peer({
      initiator,
      stream,
      trickle: true,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ],
      },
    });

    // Connection timeout
    const connectionTimeout = setTimeout(() => {
      if (!peer.destroyed) {
        console.error("Peer connection timeout:", remoteSocketId);
        setCallError("Connection timeout. Please try again.");
        peer.destroy();
      }
    }, 30000);

    // Handle signaling data
    peer.on("signal", (signal: unknown) => {
      if (socketRef.current) {
        socketRef.current.emit("signal", {
          roomId: activeCall!.channelId,
          targetSocketId: remoteSocketId,
          signal,
        });
      }
    });

    // Handle incoming stream
    peer.on("stream", (remoteStream: MediaStream) => {
      attachRemoteStream(remoteSocketId, remoteStream);
    });

    // Handle connection established
    peer.on("connect", () => {
      clearTimeout(connectionTimeout);
      console.log("Peer connected:", remoteSocketId);
    });

    // Handle errors
    peer.on("error", (err: Error) => {
      clearTimeout(connectionTimeout);
      console.error("Peer error:", remoteSocketId, err);
      setCallError(`Connection error: ${err.message}`);
    });

    // Handle peer close
    peer.on("close", () => {
      clearTimeout(connectionTimeout);
      console.log("Peer closed:", remoteSocketId);
      cleanupPeer(remoteSocketId);
    });

    return peer;
  }

  // Helper function to attach remote stream
  function attachRemoteStream(socketId: string, stream: MediaStream) {
    // Check if stream has audio
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      // Create audio element if it doesn't exist
      if (!audioRefs.current[socketId]) {
        const audio = new Audio();
        audio.autoplay = true;
        audio.srcObject = stream;
        audio.muted = isDeafened;
        audioRefs.current[socketId] = audio;

        // Play audio
        audio.play().catch((err) => {
          console.error("Error playing audio:", err);
        });
      }
    }

    // Check if stream has video
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      // Update participant to show they have video
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === socketId ? { ...p, hasVideo: true } : p
        )
      );
    }
  }

  // Helper function to cleanup peer connection
  function cleanupPeer(socketId: string) {
    // Destroy peer connection
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].destroy?.();
      delete peersRef.current[socketId];
    }

    // Remove audio element
    removeRemoteAudio(socketId);
  }

  // Setup WebRTC when joining a call
  useEffect(() => {
    if (!inCall || !activeCall) return;
    let mounted = true;
    if (!userIdRef.current) {
      userIdRef.current = `user_${Math.random().toString(36).substr(2, 9)}`;
    }
    const userId = userIdRef.current;
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        // Connect to signaling server
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "";
        const isProduction = socketUrl && socketUrl !== "http://localhost:3000";

        // For local development, initialize the API endpoint first
        const initPromise = isProduction
          ? Promise.resolve()
          : fetch("/api/webrtc-signaling");

        initPromise
          .then(() => {
            const socket = io(socketUrl, {
              path: isProduction ? "/socket.io" : "/api/webrtc-signaling",
              transports: ["websocket", "polling"],
              reconnection: true,
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
            });

        if (!socket) {
              setCallError(
                "Socket.IO not available. Please check server setup."
              );
          setConnectionStatus("Error");
          return;
        }
        socketRef.current = socket;

        socket.on("connect", () => {
          setConnectionStatus("Joining room...");
              socket.emit("join-room", {
                roomId: activeCall.channelId,
                userId,
              });
            });

            socket.on(
              "room-joined",
              ({
                memberCount,
                existingUsers,
              }: {
                memberCount: number;
                existingUsers: Array<{ socketId: string; userId: string }>;
              }) => {
                setConnectionStatus(`Connected (${memberCount} in room)`);
                playJoinSound();

                // Create peers for all existing users (we are the initiator)
                if (localStreamRef.current && existingUsers) {
                  existingUsers.forEach(({ socketId, userId }) => {
                    // Create participant entry
                    setParticipants((prev) => [
                      ...prev,
                      {
                        id: socketId,
                        name: userId,
                        isMuted: false,
                        isSpeaking: false,
                      },
                    ]);

                    // Create peer connection as initiator
                    const peer = createPeer(
                      socketId,
                      true,
                      localStreamRef.current!
                    );
                    peersRef.current[socketId] = peer;
                  });
                }
              }
            );

            socket.on(
              "user-joined",
              ({
                userId,
                socketId: remoteSocketId,
              }: {
                userId: string;
                socketId: string;
              }) => {
                console.log("User joined:", userId, remoteSocketId);

                // Add to participants
                setParticipants((prev) => [
                  ...prev,
                  {
                    id: remoteSocketId,
                    name: userId,
                    isMuted: false,
                    isSpeaking: false,
                  },
                ]);

                // Create peer connection as receiver (NOT initiator)
                if (localStreamRef.current) {
                  const peer = createPeer(
                    remoteSocketId,
                    false,
                    localStreamRef.current
                  );
                  peersRef.current[remoteSocketId] = peer;
                }
              }
            );

            socket.on(
              "signal",
              ({
                signal,
                senderSocketId,
              }: {
                signal: unknown;
                senderSocketId: string;
              }) => {
                console.log("Received signal from:", senderSocketId);

                // Forward signal to the corresponding peer
                const peer = peersRef.current[senderSocketId];
                if (peer) {
                  peer.signal(signal);
                } else {
                  console.warn(
                    "Received signal for unknown peer:",
                    senderSocketId
                  );
                }
              }
            );

            socket.on(
              "user-left",
              ({
                userId,
                socketId: remoteSocketId,
              }: {
                userId: string;
                socketId: string;
              }) => {
                console.log("User left:", userId, remoteSocketId);

                // Remove from participants
                setParticipants((prev) =>
                  prev.filter((p) => p.id !== remoteSocketId)
                );

                // Cleanup peer connection
                cleanupPeer(remoteSocketId);
              }
            );

            socket.on("connect_error", () => {
          setConnectionStatus("Connection error");
          setCallError("Failed to connect to voice server");
        });

        socket.on("error", ({ message }: { message: string }) => {
          setCallError(message);
        });
      })
          .catch((fetchErr) => {
            console.error("Failed to initialize Socket.IO server:", fetchErr);
            setCallError("Failed to initialize voice server.");
            setConnectionStatus("Error");
          });
      })
      .catch(() => {
        setCallError("Failed to access microphone. Please check permissions.");
        setConnectionStatus("Error");
        setInCall(false);
      });
    return () => {
      mounted = false;
      // Only set state after cleanup
      setTimeout(() => setConnectionStatus("Disconnected"), 0);
      if (socketRef.current) {
        socketRef.current.emit("leave-room", {
          roomId: activeCall.channelId,
          userId: userIdRef.current,
        });
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Clean up all peers
      Object.keys(peersRef.current).forEach((socketId) => {
        cleanupPeer(socketId);
      });
      peersRef.current = {};

      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }

      // Stop local video stream
      if (localVideoStreamRef.current) {
        localVideoStreamRef.current.getTracks().forEach((track) => track.stop());
        localVideoStreamRef.current = null;
      }

      setParticipants([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inCall, activeCall]);

  function toggleMute() {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        const willBeMuted = audioTrack.enabled; // If currently enabled, will be muted
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        // Play appropriate sound
        if (willBeMuted) {
          playMuteSound();
        } else {
          playUnmuteSound();
        }
      }
    }
  }

  function toggleDeafen() {
    setIsDeafened((prev) => {
      const newDeafened = !prev;
      // When deafening, also mute (like Discord)
      if (newDeafened && !isMuted) {
        // Call mute without sound since deafen sound will play
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
            audioTrack.enabled = false;
            setIsMuted(true);
          }
        }
      }
      // Mute/unmute all remote audio
      Object.values(audioRefs.current).forEach((audio) => {
        audio.muted = newDeafened;
      });
      // Play appropriate sound
      if (newDeafened) {
        playDeafenSound();
      } else {
        playUndeafenSound();
      }
      return newDeafened;
    });
  }

  // Toggle video on/off (no audio cue)
  async function toggleVideo() {
    if (isVideoOn) {
      // Turn off video
      if (localVideoStreamRef.current) {
        const videoTrack = localVideoStreamRef.current.getVideoTracks()[0];

        // Remove video track from all peer connections
        Object.values(peersRef.current).forEach((peer) => {
          if (videoTrack && localVideoStreamRef.current) {
            peer.removeTrack(videoTrack, localVideoStreamRef.current);
          }
        });

        // Stop video track
        videoTrack?.stop();
        localVideoStreamRef.current = null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      setIsVideoOn(false);
    } else {
      // Turn on video
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
          audio: false,
        });

        localVideoStreamRef.current = videoStream;
        const videoTrack = videoStream.getVideoTracks()[0];

        // Set state first to render the video element
        setIsVideoOn(true);

        // Add video track to local preview
        // Wait for next tick to ensure video element is rendered
        setTimeout(() => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = videoStream;
            // Explicitly play the video
            localVideoRef.current.play().catch((err) => {
              console.error("Error playing video:", err);
            });
          }
        }, 0);

        // Add video track to all peer connections
        Object.values(peersRef.current).forEach((peer) => {
          if (videoTrack && localStreamRef.current) {
            peer.addTrack(videoTrack, localStreamRef.current);
          }
        });
      } catch (error: unknown) {
        console.error("Error accessing camera:", error);

        // Check for specific error types
        if (error instanceof Error) {
          if (
            error.name === "NotFoundError" ||
            error.name === "DevicesNotFoundError"
          ) {
            setCallError(
              "Camera not found. Please connect a camera and try again."
            );
          } else if (
            error.name === "NotAllowedError" ||
            error.name === "PermissionDeniedError"
          ) {
            setCallError(
              "Camera permission denied. Please allow camera access in your browser settings."
            );
          } else if (
            error.name === "NotReadableError" ||
            error.name === "TrackStartError"
          ) {
            setCallError("Camera is in use by another application.");
          } else {
            setCallError("Could not access camera. Please check your device.");
          }
        } else {
          setCallError("Camera not found.");
        }
      }
    }
  }

  // Add channel modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<"text" | "voice">("text");
  const [newName, setNewName] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [password, setPassword] = useState("");
  const [maxMembers, setMaxMembers] = useState<number>(10);
  const [formError, setFormError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return channels;
    return channels.filter((ch) => ch.name.toLowerCase().includes(q));
  }, [channels, query]);

  function resetForm() {
    setNewType("text");
    setNewName("");
    setNewCourse("");
    setPrivacy("public");
    setPassword("");
    setMaxMembers(10);
    setFormError(null);
  }

  async function createChannel() {
    if (!newName.trim()) {
      setFormError("Please enter a channel name.");
      return;
    }
    if (!newCourse.trim()) {
      setFormError("Please enter the related course.");
      return;
    }
    if (privacy === "private" && !password) {
      setFormError("Private channels require a password.");
      return;
    }
    if (maxMembers < 1 || maxMembers > 10) {
      setFormError("Max members must be between 1 and 10.");
      return;
    }

    const id = `${newType}-${Date.now()}`;
    const payload: Channel = {
      id,
      name: newName.trim(),
      type: newType,
      privacy,
      password: privacy === "private" ? password : undefined,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      course: newCourse.trim(),
    };

    // Optimistically add to UI
    setChannels((prev) => [payload, ...prev]);
    setShowAddModal(false);
    resetForm();

    // Save to DynamoDB
    try {
      await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  }

  function handleJoinVoiceChannel(ch: Channel) {
    const channel = channels.find((x) => x.id === ch.id);
    const channelPrivacy = channel?.privacy || "public";

    if (channelPrivacy === "private") {
      setActiveCall({
        channelId: ch.id,
        name: ch.name,
        privacy: channelPrivacy,
        password: channel?.password,
      });
      setShowPasswordPrompt(true);
    } else {
      setActiveCall({
        channelId: ch.id,
        name: ch.name,
        privacy: channelPrivacy,
      });
      setInCall(true);
    }
  }

  function handlePasswordSubmit() {
    if (!activeCall) return;

    if (callPassword.length < 1) {
      setCallError("Password required");
      return;
    }

    // Verify password
    if (activeCall.password && callPassword !== activeCall.password) {
      setCallError("Incorrect password");
      return;
    }

    setInCall(true);
    setShowPasswordPrompt(false);
    setCallError(null);
  }

  function handleLeaveCall() {
    playLeaveSound(); // Play leave sound

    // Clean up video stream
    if (localVideoStreamRef.current) {
      localVideoStreamRef.current.getTracks().forEach((track) => track.stop());
      localVideoStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setActiveCall(null);
    setInCall(false);
    setShowVoiceCallView(true); // Reset for next call
    setCallPassword("");
    setCallError(null);
    setShowPasswordPrompt(false);
    setIsMuted(false);
    setIsDeafened(false);
    setIsVideoOn(false);
  }

  // Profile dropdown handlers
  async function handleLogout() {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still redirect even if signOut fails
      router.push("/");
    }
  }

  function handleOpenSettings() {
    setShowProfileDropdown(false);
    router.push("/settings");
  }

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    }

    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileDropdown]);

  // Text channel functions
  async function openTextChannel(channel: Channel) {
    setActiveTextChannel(channel);

    // Fetch messages from DynamoDB
    try {
      const response = await fetch(`/api/channels/${channel.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => ({
          ...prev,
          [channel.id]: data.messages || [],
        }));
      } else {
        // Initialize with empty array if fetch fails
        setMessages((prev) => ({
          ...prev,
          [channel.id]: prev[channel.id] || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages((prev) => ({
        ...prev,
        [channel.id]: prev[channel.id] || [],
      }));
    }
  }

  function closeTextChannel() {
    setActiveTextChannel(null);
    setMessageInput("");
    setShowEmojiPicker(false);
  }

  async function sendMessage() {
    if (!messageInput.trim() || !activeTextChannel) return;

    const messageContent = messageInput.trim();
    const replyData = replyingTo
      ? {
          id: replyingTo.id,
          userName: replyingTo.userName,
          content:
            replyingTo.content.slice(0, 100) +
            (replyingTo.content.length > 100 ? "..." : ""),
        }
      : undefined;

    setMessageInput("");
    setShowEmojiPicker(false);
    setReplyingTo(null);

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      channelId: activeTextChannel.id,
      userId: currentUser.id,
      userName: currentUser.name,
      content: messageContent,
      timestamp: new Date(),
      replyTo: replyData,
    };

    // Optimistically add the message to UI
    setMessages((prev) => ({
      ...prev,
      [activeTextChannel.id]: [
        ...(prev[activeTextChannel.id] || []),
        newMessage,
      ],
    }));

    // Save to DynamoDB
    try {
      const response = await fetch(
        `/api/channels/${activeTextChannel.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            userName: currentUser.name,
            content: messageContent,
            replyTo: replyData,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update the message with the server-generated ID and timestamp
        setMessages((prev) => ({
          ...prev,
          [activeTextChannel.id]: prev[activeTextChannel.id].map((msg) =>
            msg.id === newMessage.id
              ? {
                  ...msg,
                  id: data.message.id,
                  timestamp: new Date(data.message.timestamp),
                }
              : msg
          ),
        }));
      }
    } catch (error) {
      console.error("Error saving message:", error);
      // Message is already shown optimistically, so we don't remove it
    }
  }

  function startEditMessage(message: Message) {
    setEditingMessage(message);
    setEditInput(message.content);
  }

  function cancelEditMessage() {
    setEditingMessage(null);
    setEditInput("");
  }

  async function saveEditMessage() {
    if (!editingMessage || !editInput.trim() || !activeTextChannel) return;

    const newContent = editInput.trim();
    const messageToEdit = editingMessage;

    // Optimistically update UI
    setMessages((prev) => ({
      ...prev,
      [activeTextChannel.id]: (prev[activeTextChannel.id] || []).map((msg) =>
        msg.id === messageToEdit.id ? { ...msg, content: newContent } : msg
      ),
    }));

    setEditingMessage(null);
    setEditInput("");

    // Update in DynamoDB
    try {
      const timestamp =
        messageToEdit.timestamp instanceof Date
          ? messageToEdit.timestamp.toISOString()
          : messageToEdit.timestamp;

      await fetch(`/api/messages/${messageToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeTextChannel.id,
          timestamp: timestamp,
          content: newContent,
        }),
      });
    } catch (error) {
      console.error("Error updating message:", error);
    }
  }

  function promptDeleteMessage(message: Message) {
    setDeletingMessage(message);
  }

  function cancelDeleteMessage() {
    setDeletingMessage(null);
  }

  async function confirmDeleteMessage() {
    if (!activeTextChannel || !deletingMessage) return;

    const messageToDelete = deletingMessage;
    setDeletingMessage(null);

    // Optimistically remove from UI
    setMessages((prev) => ({
      ...prev,
      [activeTextChannel.id]: (prev[activeTextChannel.id] || []).filter(
        (msg) => msg.id !== messageToDelete.id
      ),
    }));

    // Delete from DynamoDB
    try {
      const timestamp =
        messageToDelete.timestamp instanceof Date
          ? messageToDelete.timestamp.toISOString()
          : messageToDelete.timestamp;

      await fetch(`/api/messages/${messageToDelete.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: activeTextChannel.id,
          timestamp: timestamp,
        }),
      });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  }

  function addEmoji(emoji: string) {
    setMessageInput((prev) => prev + emoji);
  }

  function startReply(message: Message) {
    setReplyingTo(message);
    // Focus the input
    const input = document.querySelector(
      'textarea[placeholder^="Message #"]'
    ) as HTMLTextAreaElement;
    if (input) input.focus();
  }

  function cancelReply() {
    setReplyingTo(null);
  }

  // User search functions
  async function searchUsers(query: string) {
    if (!query.trim() || query.trim().length < 2) {
      setUserSearchResults([]);
      setShowUserSearchResults(false);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const response = await fetch(
        `/api/search-users?q=${encodeURIComponent(query.trim())}`
      );
      if (response.ok) {
        const data = await response.json();
        setUserSearchResults(data.users || []);
        setShowUserSearchResults(true);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearchingUsers(false);
    }
  }

  function handleUserSearchChange(query: string) {
    setUserSearchQuery(query);

    if (userSearchTimeoutRef.current) {
      clearTimeout(userSearchTimeoutRef.current);
    }

    userSearchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  }

  async function openUserProfile(user: {
    username: string;
    email: string;
    description?: string;
    createdAt?: string;
  }) {
    setShowUserSearchResults(false);
    setUserSearchQuery("");
    setIsLoadingProfile(true);

    try {
      // Fetch full profile from API
      const response = await fetch(
        `/api/get-user-profile?username=${encodeURIComponent(user.username)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedUserProfile(data.profile);
      } else {
        // Fallback to search result data
        setSelectedUserProfile(user);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setSelectedUserProfile(user);
    } finally {
      setIsLoadingProfile(false);
    }
  }

  function closeUserProfile() {
    setSelectedUserProfile(null);
  }

  function formatJoinDate(dateString?: string): string {
    if (!dateString) return "Unknown";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Unknown";
    }
  }

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userSearchRef.current &&
        !userSearchRef.current.contains(event.target as Node)
      ) {
        setShowUserSearchResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, []);

  function formatTimestamp(timestamp: Date | string): string {
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  }

  // Check if message should be grouped with previous message
  // Group if: same user AND less than 5 minutes apart
  function shouldGroupMessage(
    currentMsg: Message,
    prevMsg: Message | null
  ): boolean {
    if (!prevMsg) return false;
    if (currentMsg.userId !== prevMsg.userId) return false;

    const currentTime =
      typeof currentMsg.timestamp === "string"
        ? new Date(currentMsg.timestamp).getTime()
        : currentMsg.timestamp.getTime();
    const prevTime =
      typeof prevMsg.timestamp === "string"
        ? new Date(prevMsg.timestamp).getTime()
        : prevMsg.timestamp.getTime();

    const diffMinutes = (currentTime - prevTime) / (1000 * 60);
    return diffMinutes < 5;
  }

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTextChannel]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-black text-white">
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar - Discord-like channels */}
        <aside className="w-72 border-r border-gray-800 h-screen flex flex-col bg-gray-900/30">
          <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold neon-text-glow">MavPrep</h2>
              {/* Profile Icon with Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  suppressHydrationWarning
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className={`w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 transition-colors ${
                    showProfileDropdown
                      ? "border-primary"
                      : "border-gray-600 hover:border-primary"
                  }`}
                >
                  {currentUser.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-700">
                      {currentUser.isLoading ? (
                        <>
                          <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-1"></div>
                          <div className="h-3 w-32 bg-gray-700 rounded animate-pulse"></div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white truncate">
                            {currentUser.name || currentUser.email || "User"}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {currentUser.email}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        onClick={handleOpenSettings}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        User Settings
                      </button>

                      <div className="border-t border-gray-700 my-1"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors flex items-center gap-3"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <input
                suppressHydrationWarning
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search channels..."
                className="flex-1 h-10 px-3 bg-black border border-gray-700 rounded-lg placeholder-gray-500 text-sm focus:outline-none focus:border-primary transition-colors"
            />
            <button
                suppressHydrationWarning
              onClick={() => setShowAddModal(true)}
              aria-label="Create channel"
                className="w-10 h-10 flex-shrink-0 rounded-lg bg-primary text-black flex items-center justify-center text-xl font-bold hover:bg-accent transition-colors"
            >
              +
            </button>
          </div>

          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
              <div className="w-full max-w-md p-6 bg-gradient-to-br from-[#041022] via-[#00131a] to-[#001f2b] border border-primary/30 rounded-xl shadow-[0_20px_60px_rgba(0,217,255,0.08)]">
                <h3 className="text-xl font-semibold mb-6">Create Channel</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Type
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewType("text")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          newType === "text"
                            ? "bg-primary text-black"
                            : "bg-black border border-gray-700 text-gray-200 hover:border-gray-600"
                        }`}
                      >
                        Text
                      </button>
                      <button
                        onClick={() => setNewType("voice")}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          newType === "voice"
                            ? "bg-primary text-black"
                            : "bg-black border border-gray-700 text-gray-200 hover:border-gray-600"
                        }`}
                      >
                        Voice
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Channel Name
                    </label>
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="e.g. Final Review"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Course
                    </label>
                    <input
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="e.g. CSE 2312"
                    />
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-2">
                        Visibility
                      </label>
                      <select
                        value={privacy}
                        onChange={(e) =>
                          setPrivacy(e.target.value as "public" | "private")
                        }
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-2">
                        Max Members
                      </label>
                      <div className="flex items-center bg-black border border-gray-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            setMaxMembers((m) => Math.max(1, m - 1))
                          }
                          className="px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                          aria-label="decrease"
                        >
                          −
                        </button>
                        <div className="px-3 py-2 text-sm flex-1 text-center border-x border-gray-700">
                          {maxMembers}
                        </div>
                        <button
                          onClick={() =>
                            setMaxMembers((m) => Math.min(10, m + 1))
                          }
                          className="px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
                          aria-label="increase"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {privacy === "private" && (
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Password
                      </label>
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                        placeholder="Enter a password"
                      />
                    </div>
                  )}

                  {formError && (
                    <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                      {formError}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-800 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createChannel}
                      className="px-4 py-2 rounded-lg bg-primary text-black text-sm font-medium hover:bg-accent transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <nav className="space-y-4">
            <div>
              <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Text Channels
              </h3>
              <ul className="space-y-1">
                {filtered
                  .filter((c) => c.type === "text")
                  .map((ch) => (
                    <li
                      key={ch.id}
                        onClick={() => openTextChannel(ch)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                          activeTextChannel?.id === ch.id
                            ? "bg-primary/20 border-l-2 border-primary"
                            : "hover:bg-gray-800/50"
                        }`}
                      >
                        <span
                          className={
                            activeTextChannel?.id === ch.id
                              ? "text-primary"
                              : "text-gray-400"
                          }
                        >
                          #
                        </span>
                        <span
                          className={`text-sm truncate ${
                            activeTextChannel?.id === ch.id
                              ? "text-white font-medium"
                              : "text-gray-200"
                          }`}
                        >
                          {ch.name}
                        </span>
                      {ch.privacy === "private" && (
                          <span className="text-xs text-gray-500 ml-auto">
                            🔒
                          </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Voice Channels
              </h3>
              <ul className="space-y-1">
                {filtered
                  .filter((c) => c.type === "voice")
                  .map((ch) => (
                      <div key={ch.id}>
                    <li
                      className={`flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-800/50 cursor-pointer ${
                        inCall && activeCall?.channelId === ch.id
                          ? "bg-primary/20 border-l-2 border-primary"
                          : ""
                      }`}
                          onClick={() => {
                            if (inCall && activeCall?.channelId === ch.id) {
                              // Toggle voice call view if clicking on current call channel
                              setShowVoiceCallView(!showVoiceCallView);
                            } else if (!inCall) {
                              handleJoinVoiceChannel(ch);
                            }
                          }}
                    >
                      <span className="text-accent">♪</span>
                          <span className="text-sm text-gray-200">
                            {ch.name}
                          </span>
                      {ch.privacy === "private" && (
                        <span className="text-xs text-gray-500">🔒</span>
                          )}
                          {inCall && activeCall?.channelId === ch.id && (
                            <span className="ml-auto text-xs text-green-400">
                              ● Live
                            </span>
                          )}
                        </li>
                        {/* Show participants below active voice channel */}
                        {inCall &&
                          activeCall?.channelId === ch.id &&
                          participants.length > 0 && (
                            <ul className="ml-6 mt-1 space-y-1">
                              {participants.map((p) => (
                                <li
                                  key={p.id}
                                  className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400"
                                >
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      p.isSpeaking
                                        ? "bg-green-400"
                                        : "bg-gray-600"
                                    }`}
                                  ></div>
                                  <span
                                    className={
                                      p.isMuted ? "line-through opacity-50" : ""
                                    }
                                  >
                                    {p.name}
                                  </span>
                                  {p.isMuted && (
                                    <span className="text-red-400">🔇</span>
                      )}
                    </li>
                              ))}
                            </ul>
                          )}
                      </div>
                  ))}
              </ul>
            </div>
          </nav>
          </div>

          {/* Active Call Indicator - Fixed at bottom */}
          {inCall && activeCall && (
            <div className="flex-shrink-0 p-4 border-t border-gray-800">
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-primary">Voice Connected</div>
                  {!showVoiceCallView && (
                    <button
                      onClick={() => setShowVoiceCallView(true)}
                      className="p-1 rounded hover:bg-primary/20 transition-colors"
                      title="Expand call view"
                    >
                      <svg
                        className="w-4 h-4 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="text-sm font-medium mb-2">
                  {activeCall.name}
                </div>
              <div className="text-xs text-gray-400 mb-3">
                  {connectionStatus} • {participants.length + 1} in call
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleMute}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isMuted
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-gray-800 text-gray-300 border border-gray-700"
                  }`}
                >
                  {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                </button>
                <button
                  onClick={handleLeaveCall}
                  className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium hover:bg-red-500/30 transition-colors"
                >
                  Leave
                </button>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {activeTextChannel && (!inCall || !showVoiceCallView) ? (
            /* Text Channel Chat Interface */
            <div className="flex-1 flex flex-col h-full">
              {/* Chat Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-primary">#</span>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {activeTextChannel.name}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {messages[activeTextChannel.id]?.length || 0} messages
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeTextChannel}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  title="Close channel"
                >
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {(messages[activeTextChannel.id] || []).length === 0 ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                      <span className="text-4xl">#</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-200 mb-2">
                      Welcome to #{activeTextChannel.name}
                    </h3>
                    <p className="text-gray-400 max-w-md">
                      Be the first Mav to send a message in this chat! 🎓
                    </p>
                  </div>
                ) : (
                  (messages[activeTextChannel.id] || []).map(
                    (msg, index, arr) => {
                      const prevMsg = index > 0 ? arr[index - 1] : null;
                      const isGrouped = shouldGroupMessage(msg, prevMsg);
                      const isOwnMessage = msg.userId === currentUser.id;

                      return (
                        <div
                          key={msg.id}
                          className={`group flex ${
                            isGrouped ? "mt-0.5" : "mt-4 first:mt-0"
                          } ${isOwnMessage ? "flex-row-reverse" : ""} gap-3`}
                        >
                          {/* Avatar - only show if not grouped */}
                          {!isGrouped ? (
                            <div
                              className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                                isOwnMessage
                                  ? "bg-primary/20 border border-primary/50"
                                  : "bg-gray-700"
                              }`}
                            >
                              <span className="text-sm font-medium">
                                {msg.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            // Spacer to maintain alignment for grouped messages
                            <div className="w-10 flex-shrink-0" />
                          )}
                          {/* Message Content */}
                          <div
                            className={`max-w-[70%] ${
                              isOwnMessage
                                ? "flex flex-col items-end"
                                : "flex flex-col items-start"
                            }`}
                          >
                            {/* Header - only show if not grouped */}
                            {!isGrouped && (
                              <div
                                className={`flex items-center gap-2 mb-1 ${
                                  isOwnMessage ? "flex-row-reverse" : ""
                                }`}
                              >
                                <span
                                  className={`text-sm font-medium ${
                                    isOwnMessage
                                      ? "text-primary"
                                      : "text-gray-300"
                                  }`}
                                >
                                  {msg.userName}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(msg.timestamp)}
                                </span>
                                {/* Reply button for other users' messages */}
                                {!isOwnMessage && (
                                  <button
                                    onClick={() => startReply(msg)}
                                    className="p-1 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Reply"
                                  >
                                    <svg
                                      className="w-3.5 h-3.5 text-gray-400 hover:text-primary"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                      />
                                    </svg>
                                  </button>
                                )}
                                {/* Edit/Delete buttons for own messages */}
                                {isOwnMessage && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Edit button - always on left */}
                                    <button
                                      onClick={() => startEditMessage(msg)}
                                      className="p-1 rounded hover:bg-gray-700 transition-colors"
                                      title="Edit message"
                                    >
                                      <svg
                                        className="w-3.5 h-3.5 text-gray-400 hover:text-primary"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                      </svg>
                                    </button>
                                    {/* Delete button - always on right */}
                                    <div className="relative">
                                      <button
                                        onClick={() => promptDeleteMessage(msg)}
                                        className="p-1 rounded hover:bg-gray-700 transition-colors"
                                        title="Delete message"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5 text-gray-400 hover:text-red-400"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                      </button>
                                      {/* Delete Confirmation Dialog */}
                                      {deletingMessage?.id === msg.id && (
                                        <div className="absolute bottom-full right-0 mb-2 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 whitespace-nowrap">
                                          <p className="text-sm text-gray-300 mb-2">
                                            Delete this message?
                                          </p>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={cancelDeleteMessage}
                                              className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              onClick={confirmDeleteMessage}
                                              className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Reply reference - show what message this is replying to */}
                            {msg.replyTo && (
                              <div
                                className={`mb-1 flex items-center gap-1 text-xs ${
                                  isOwnMessage ? "justify-end" : "justify-start"
                                }`}
                              >
                                <svg
                                  className="w-3 h-3 text-gray-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                  />
                                </svg>
                                <span className="text-gray-500">
                                  Replying to{" "}
                                  <span className="text-gray-400 font-medium">
                                    {msg.replyTo.userName}
                                  </span>
                                </span>
                              </div>
                            )}
                            {msg.replyTo && (
                              <div
                                className={`mb-1 px-3 py-1.5 bg-gray-800/50 border-l-2 border-gray-600 rounded text-xs text-gray-400 max-w-[80%] truncate ${
                                  isOwnMessage ? "ml-auto" : ""
                                }`}
                              >
                                {msg.replyTo.content}
                              </div>
                            )}
                            {/* Edit mode or regular message display */}
                            {editingMessage?.id === msg.id ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editInput}
                                  onChange={(e) => setEditInput(e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-800 border border-primary rounded-lg text-sm text-white focus:outline-none resize-none"
                                  rows={2}
                                  autoFocus
                                />
                                <div
                                  className={`flex gap-2 ${
                                    isOwnMessage ? "justify-end" : ""
                                  }`}
                                >
                                  <button
                                    onClick={cancelEditMessage}
                                    className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={saveEditMessage}
                                    disabled={!editInput.trim()}
                                    className="px-3 py-1 text-xs bg-primary text-black rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative group/msg">
                                <div
                                  className={`inline-block px-4 py-2 rounded-2xl ${
                                    isOwnMessage
                                      ? `bg-primary text-black ${
                                          isGrouped
                                            ? "rounded-tr-md"
                                            : "rounded-br-md"
                                        }`
                                      : `bg-gray-800 text-gray-100 ${
                                          isGrouped
                                            ? "rounded-tl-md"
                                            : "rounded-bl-md"
                                        }`
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {msg.content}
                                  </p>
                                </div>
                                {/* Hover actions for grouped messages */}
                                {isGrouped && (
                                  <div
                                    className={`absolute top-0 ${
                                      isOwnMessage
                                        ? "left-0 -translate-x-full pr-2"
                                        : "right-0 translate-x-full pl-2"
                                    } flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity`}
                                  >
                                    {/* Reply button for other users' grouped messages */}
                                    {!isOwnMessage && (
                                      <button
                                        onClick={() => startReply(msg)}
                                        className="p-1 rounded hover:bg-gray-700 transition-colors"
                                        title="Reply"
                                      >
                                        <svg
                                          className="w-3.5 h-3.5 text-gray-400 hover:text-primary"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                    {/* Edit/Delete buttons for own grouped messages */}
                                    {isOwnMessage && (
                                      <>
                                        <button
                                          onClick={() => startEditMessage(msg)}
                                          className="p-1 rounded hover:bg-gray-700 transition-colors"
                                          title="Edit message"
                                        >
                                          <svg
                                            className="w-3.5 h-3.5 text-gray-400 hover:text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                          </svg>
                                        </button>
                                        <div className="relative">
                                          <button
                                            onClick={() =>
                                              promptDeleteMessage(msg)
                                            }
                                            className="p-1 rounded hover:bg-gray-700 transition-colors"
                                            title="Delete message"
                                          >
                                            <svg
                                              className="w-3.5 h-3.5 text-gray-400 hover:text-red-400"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                              />
                                            </svg>
                                          </button>
                                          {/* Delete Confirmation Dialog */}
                                          {deletingMessage?.id === msg.id && (
                                            <div className="absolute bottom-full right-0 mb-2 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 whitespace-nowrap">
                                              <p className="text-sm text-gray-300 mb-2">
                                                Delete this message?
                                              </p>
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={cancelDeleteMessage}
                                                  className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  onClick={confirmDeleteMessage}
                                                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-6 py-4 border-t border-gray-800 bg-gray-900/30">
                {/* Reply Context */}
                {replyingTo && (
                  <div className="mb-3 flex items-center gap-2 p-2 bg-gray-800/50 border-l-2 border-primary rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary font-medium">
                        Replying to {replyingTo.userName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {replyingTo.content}
                      </p>
                    </div>
                    <button
                      onClick={cancelReply}
                      className="p-1 rounded hover:bg-gray-700 transition-colors flex-shrink-0"
                      title="Cancel reply"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  {/* Emoji Button */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
                      title="Add emoji"
                    >
                      <span className="text-xl">😀</span>
                    </button>
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-14 left-0 p-3 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-10">
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => addEmoji(emoji)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-gray-800 rounded transition-colors text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Text Input */}
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={`Message #${activeTextChannel.name}`}
                      className="w-full h-12 px-4 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors resize-none flex items-center"
                      rows={1}
                      style={{ paddingTop: "14px", paddingBottom: "14px" }}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={sendMessage}
                    disabled={!messageInput.trim()}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary text-black rounded-xl hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send message"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          ) : inCall && activeCall && showVoiceCallView ? (
            /* Voice Call Interface */
            <div className="h-full flex flex-col p-8">
              {/* Call Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <h2 className="text-2xl font-bold">{activeCall.name}</h2>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {connectionStatus}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">
                    {participants.length + 1} participant
                    {participants.length !== 0 ? "s" : ""}
                  </div>
                  {/* Minimize button */}
                  <button
                    onClick={() => setShowVoiceCallView(false)}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                    title="Minimize call view"
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Participants Grid */}
              <div className="flex-1 flex items-center justify-center">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-4xl">
                  {/* Current User */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative ${
                        isVideoOn
                          ? "w-40 h-32 rounded-xl"
                          : "w-24 h-24 rounded-full"
                      } flex items-center justify-center transition-all ${
                        isMuted
                          ? "bg-gray-800 border-2 border-gray-600"
                          : isVideoOn
                          ? "bg-gray-900 border-2 border-primary/50"
                          : "bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-primary/50"
                      }`}
                    >
                      {isVideoOn ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover rounded-xl overflow-hidden"
                          style={{ transform: "scaleX(-1)" }}
                        />
                      ) : currentUser.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                      {/* Muted indicator */}
                      {isMuted && (
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                          </svg>
                        </div>
                      )}
                      {/* Deafened indicator */}
                      {isDeafened && (
                        <div className="absolute -bottom-1 -left-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {/* Headphone icon */}
                            <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                          </svg>
                        </div>
                      )}
                      {/* Video on indicator */}
                      {isVideoOn && (
                        <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                          <svg
                            className="w-4 h-4 text-black"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="mt-3 text-sm font-medium text-primary">
                      {currentUser.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {isMuted ? "Muted" : isDeafened ? "Deafened" : "Speaking"}
                    </span>
                  </div>

                  {/* Other Participants */}
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                          participant.isMuted
                            ? "bg-gray-800 border-2 border-gray-600"
                            : participant.isSpeaking
                            ? "bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500/50 animate-pulse"
                            : "bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-2 border-gray-600"
                        }`}
                      >
                        <svg
                          className="w-12 h-12 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        {/* Muted indicator */}
                        {participant.isMuted && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <span className="mt-3 text-sm font-medium text-gray-300">
                        {participant.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {participant.isMuted
                          ? "Muted"
                          : participant.isSpeaking
                          ? "Speaking"
                          : "Connected"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex justify-center gap-4 pt-8 pb-4">
                {/* Mute Button */}
                <button
                  onClick={toggleMute}
                  className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isMuted
                      ? "bg-red-500/20 border-2 border-red-500/50 hover:bg-red-500/30"
                      : "bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  {isMuted ? (
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                    </svg>
                  )}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {isMuted ? "Unmute" : "Mute"}
                  </span>
                </button>

                {/* Deafen Button */}
                <button
                  onClick={toggleDeafen}
                  className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isDeafened
                      ? "bg-red-500/20 border-2 border-red-500/50 hover:bg-red-500/30"
                      : "bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  {isDeafened ? (
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {/* Headphone with slash */}
                      <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                      {/* Slash line */}
                      <path
                        d="M3.27 3L2 4.27l3.18 3.18C3.82 8.93 3 10.89 3 13v4c0 1.1.9 2 2 2h1v-7H5v-2c0-1.17.29-2.26.79-3.22L20.73 21 22 19.73 3.27 3z"
                        fillOpacity="0.8"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      {/* Headphone */}
                      <path d="M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z" />
                    </svg>
                  )}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {isDeafened ? "Undeafen" : "Deafen"}
                  </span>
                </button>

                {/* Video Toggle Button */}
                <button
                  onClick={toggleVideo}
                  className={`group relative w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isVideoOn
                      ? "bg-primary/20 border-2 border-primary/50 hover:bg-primary/30"
                      : "bg-gray-800 border-2 border-gray-600 hover:bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  {isVideoOn ? (
                    <svg
                      className="w-6 h-6 text-primary"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z" />
                    </svg>
                  )}
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {isVideoOn ? "Stop Video" : "Start Video"}
                  </span>
                </button>

                {/* Leave Call Button */}
                <button
                  onClick={handleLeaveCall}
                  className="group relative w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                  </svg>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Leave
                  </span>
                </button>
              </div>

              {/* Call Error */}
              {callError && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-600 rounded-lg text-center">
                  <p className="text-red-300 text-sm">{callError}</p>
                </div>
              )}
            </div>
          ) : (
            /* Study Rooms Browser */
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold neon-text-glow">
                    Study Rooms
                  </h2>
                  {/* User Search */}
                  <div className="relative" ref={userSearchRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearchQuery}
                        onChange={(e) => handleUserSearchChange(e.target.value)}
                        onFocus={() => {
                          if (userSearchResults.length > 0) {
                            setShowUserSearchResults(true);
                          }
                        }}
                        placeholder="Search users..."
                        className="w-64 px-4 py-2 pl-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-sm"
                      />
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      {isSearchingUsers && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg
                            className="w-4 h-4 text-gray-400 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {/* Search Results Dropdown */}
                    {showUserSearchResults && (
                      <div className="absolute top-full mt-2 right-0 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                        {userSearchResults.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">
                            {userSearchQuery.trim().length < 2
                              ? "Type at least 2 characters to search"
                              : "No users found"}
                          </div>
                        ) : (
                          <div className="py-2">
                            <div className="px-3 py-1 text-xs text-gray-500 uppercase">
                              Users ({userSearchResults.length})
                            </div>
                            {userSearchResults.map((user, index) => (
                              <button
                                key={index}
                                onClick={() => openUserProfile(user)}
                                className="w-full px-3 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-medium text-primary">
                                    {user.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">
                                    {user.username}
                                  </p>
                                  {user.description && (
                                    <p className="text-xs text-gray-400 truncate">
                                      {user.description}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channels.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-gradient-to-br from-gray-900/50 to-black border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400 uppercase">
                          {c.type === "text" ? "Text" : "Voice"}
                        </div>
                        {c.privacy === "private" && (
                          <span className="text-xs text-gray-500">🔒</span>
                        )}
                      </div>
                          <div className="font-semibold text-lg mt-1">
                            {c.name}
                    </div>
                    </div>
                  </div>
                      {c.course && (
                        <p className="text-sm text-gray-300 mt-3 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                          <span className="text-primary font-medium">
                            {c.course}
                          </span>
                        </p>
                      )}
                      {c.createdBy && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                          Created by{" "}
                          <span className="text-primary">{c.createdBy}</span>
                        </p>
                      )}
                  {c.type === "voice" && (
                    <button
                          suppressHydrationWarning
                          onClick={() => handleJoinVoiceChannel(c)}
                          className="mt-3 w-full px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/30"
                        >
                          Join Voice
                        </button>
                      )}
                      {c.type === "text" && (
                        <button
                          suppressHydrationWarning
                          onClick={() => openTextChannel(c)}
                          className="mt-3 w-full px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors border border-primary/30"
                        >
                          Open Chat
                    </button>
                  )}
                </div>
              ))}
            </div>
              </div>
            </div>
          )}

            {/* Password Prompt Modal */}
            {showPasswordPrompt && activeCall && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <div className="w-full max-w-md p-6 bg-gradient-to-br from-[#041022] via-[#00131a] to-[#001f2b] border border-primary/30 rounded-xl shadow-[0_20px_60px_rgba(0,217,255,0.08)]">
                  <h3 className="text-xl font-semibold mb-4">
                    Join Voice Channel
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    This is a private voice channel. Enter the password to join.
                  </p>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={callPassword}
                      onChange={(e) => {
                        setCallPassword(e.target.value);
                        setCallError(null);
                      }}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handlePasswordSubmit()
                      }
                      className="w-full px-3 py-2 bg-black border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter password"
                      autoFocus
                    />
                    {callError && (
                      <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 mt-2">
                        {callError}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowPasswordPrompt(false);
                        setActiveCall(null);
                        setCallPassword("");
                        setCallError(null);
                      }}
                      className="px-4 py-2 rounded-lg bg-gray-800 text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePasswordSubmit}
                      className="px-4 py-2 rounded-lg bg-primary text-black text-sm font-medium hover:bg-accent transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>

      {/* User Profile Modal */}
      {(selectedUserProfile || isLoadingProfile) && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden">
            {isLoadingProfile ? (
              <div className="p-8 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-primary animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : selectedUserProfile ? (
              <>
                {/* Header with close button */}
                <div className="relative">
                  <div className="h-24 bg-gradient-to-r from-primary/30 to-accent/30"></div>
                  <button
                    onClick={closeUserProfile}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  {/* Avatar */}
                  <div className="absolute -bottom-12 left-6">
                    <div className="w-24 h-24 rounded-full bg-gray-800 border-4 border-gray-900 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary">
                        {selectedUserProfile.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="pt-14 px-6 pb-6">
                  {/* Username */}
                  <h3 className="text-xl font-bold text-white">
                    {selectedUserProfile.username}
                  </h3>

                  {/* Description */}
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                      About
                    </p>
                    <p className="text-gray-300">
                      {selectedUserProfile.description || (
                        <span className="text-gray-500 italic">
                          This Mav has no description
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Member Since */}
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        Member since {formatJoinDate(selectedUserProfile.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

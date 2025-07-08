const io = require("socket.io-client");
const axios = require("axios");

const SERVER_URL = "http://localhost:5000";

// Freelancer user
const freelancerId = "680ba4ca22c1005e84742d3f";
const freelancerType = "Freelancer";
const freelancerSocket = io(SERVER_URL);

// Client user (replace with a real client ID)
const clientId = "680ba72022c1005e84742daa";
const clientType = "Client";
const clientSocket = io(SERVER_URL);

let chatRoomId = null;

// Helper: join chat and room
function setupUser(socket, userId, userType, label) {
  socket.on("connect", () => {
    console.log(`[${label}] Connected to server!`);
    socket.emit("join-chat", { userId, userType });
  });

  socket.on("chat-joined", (data) => {
    console.log(`[${label}] Chat joined:`, data);
  });

  socket.on("new-message", (msg) => {
    console.log(`[${label}] New message:`, msg);
  });

  socket.on("error", (err) => {
    console.log(`[${label}] Error from server:`, err);
  });

  socket.on("disconnect", () => {
    console.log(`[${label}] Disconnected from server`);
  });
}

setupUser(freelancerSocket, freelancerId, freelancerType, "Freelancer");
setupUser(clientSocket, clientId, clientType, "Client");

// Step 1: Get or create chat room via HTTP
async function startChatSimulation() {
  if (clientId === "PUT_CLIENT_ID_HERE") {
    console.log("Please replace PUT_CLIENT_ID_HERE with a real client ID.");
    return;
  }
  try {
    const response = await axios.post(`${SERVER_URL}/api/chat/room`, {
      clientId,
      freelancerId
    });
    chatRoomId = response.data.data.chatRoom._id;
    console.log(`[SYSTEM] Chat room ID: ${chatRoomId}`);

    // Step 2: Both users join the chat room
    freelancerSocket.emit("join-room", { chatRoomId });
    clientSocket.emit("join-room", { chatRoomId });

    // Step 3: Freelancer sends a message
    setTimeout(() => {
      freelancerSocket.emit("send-message", {
        chatRoomId,
        content: "Hello from Freelancer!"
      });
    }, 1000);

    // Step 4: Client replies after a short delay
    setTimeout(() => {
      clientSocket.emit("send-message", {
        chatRoomId,
        content: "Hello from Client!"
      });
    }, 2000);
  } catch (err) {
    console.error("[SYSTEM] Error creating chat room:", err.response ? err.response.data : err.message);
  }
}

startChatSimulation(); 
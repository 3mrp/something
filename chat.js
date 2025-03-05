const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");

// Set default channel to "general"
let currentChannelName = "general";
let channel = ably.channels.get(currentChannelName);

// DOM elements
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const channelButtons = document.querySelectorAll(".channel-button");

let username = "";
while (!username) {
  username = prompt("Enter your username").trim();
}
alert(`Welcome, ${username}! Let's chat`);

// Message tracker to prevent duplicates
let messageTracker = new Set();

// Function to add a message to the UI and auto-scroll
function addMessageToUI(username, text) {
  const uniqueKey = `${username}-${text}`;
  if (messageTracker.has(uniqueKey)) return;
  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${username}</strong>: ${text}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Autoscroll to the bottom
  messageTracker.add(uniqueKey);
}

// Load messages for the current channel from localStorage
function loadChats(channelName) {
  const savedChats = JSON.parse(localStorage.getItem(`${channelName}-chatHistory`)) || [];
  savedChats.forEach(({ username, text }) => addMessageToUI(username, text));
}

// Save a message to localStorage for the current channel
function saveChatToLocal(channelName, username, text) {
  const savedChats = JSON.parse(localStorage.getItem(`${channelName}-chatHistory`)) || [];
  savedChats.push({ username, text });
  localStorage.setItem(`${channelName}-chatHistory`, JSON.stringify(savedChats));
}

// Subscribe to a channel
function subscribeToChannel() {
  channel.subscribe("message", (message) => {
    addMessageToUI(message.data.username, message.data.text);
    saveChatToLocal(currentChannelName, message.data.username, message.data.text);
  });
}

// Switch to a new channel
function switchChannel(newChannelName) {
  if (newChannelName === currentChannelName) return;
  
  // Unsubscribe from the current channel
  channel.unsubscribe();
  // Clear the chatbox and message tracker
  chatBox.innerHTML = "";
  messageTracker.clear();
  // Update the current channel
  currentChannelName = newChannelName;
  channel = ably.channels.get(currentChannelName);
  // Load saved chats for the new channel and subscribe
  loadChats(currentChannelName);
  subscribeToChannel();
  console.log(`Switched to channel: ${currentChannelName}`);
}

// Handle channel button clicks
channelButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Update active button styling
    channelButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    const newChannelName = button.getAttribute("data-channel");
    switchChannel(newChannelName);
  });
});

// Initial setup: Load chats and subscribe to the default channel
loadChats(currentChannelName);
subscribeToChannel();

// Ably connection event handlers
ably.connection.on("connected", () => {
  console.log("Connected to Ably!");
});

ably.connection.on("failed", (err) => {
  console.error("Failed to connect to Ably:", err);
  alert("Could not connect to the messaging service. Please check your API key.");
});

// Send a message
sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const message = { username, text };
    channel.publish("message", message, (err) => {
      if (err) {
        console.error("Failed to send message:", err);
        alert("Failed to send message. Try again.");
      } else {
        saveChatToLocal(currentChannelName, username, text);
        addMessageToUI(username, text);
      }
    });
    messageInput.value = ""; // Clear the input field
  } else {
    alert("Please type a message before sending!");
  }
});

// Clear chat history for the current channel
clearBtn.addEventListener("click", () => {
  localStorage.removeItem(`${currentChannelName}-chatHistory`);
  chatBox.innerHTML = "";
  messageTracker.clear();
  alert("Chat history cleared!");
});

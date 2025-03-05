const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");

// Default channel setup
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

// Set to track and avoid duplicate messages in the chat box
let messageTracker = new Set();

// Function to add a message to the UI and auto-scroll to the bottom
function addMessageToUI(username, text) {
  const uniqueKey = `${username}-${text}`;
  if (messageTracker.has(uniqueKey)) return;

  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${username}</strong>: ${text}`;
  chatBox.appendChild(messageElement);

  // Auto-scroll to the bottom of the chat
  chatBox.scrollTop = chatBox.scrollHeight;

  messageTracker.add(uniqueKey);
}

// Function to load saved messages for a channel from localStorage
function loadChats(channelName) {
  const savedMessages = JSON.parse(localStorage.getItem(`${channelName}-chatHistory`)) || [];
  chatBox.innerHTML = ""; // Clear the chat box when switching channels
  messageTracker.clear(); // Clear the message tracker for the new channel
  savedMessages.forEach(({ username, text }) => addMessageToUI(username, text));
}

// Function to save a message in localStorage for a specific channel
function saveChatToLocal(channelName, username, text) {
  const chatHistory = JSON.parse(localStorage.getItem(`${channelName}-chatHistory`)) || [];
  chatHistory.push({ username, text });
  localStorage.setItem(`${channelName}-chatHistory`, JSON.stringify(chatHistory));
}

// Subscribe to the current channel to display new incoming messages
function subscribeToChannel() {
  channel.subscribe("message", (message) => {
    addMessageToUI(message.data.username, message.data.text);
    saveChatToLocal(currentChannelName, message.data.username, message.data.text);
  });
}

// Function to handle channel switching
function switchChannel(newChannelName) {
  if (newChannelName === currentChannelName) return;

  // Unsubscribe from the current channel
  channel.unsubscribe();

  // Update the current channel
  currentChannelName = newChannelName;
  channel = ably.channels.get(currentChannelName);

  // Load and display messages for the selected channel
  loadChats(currentChannelName);

  // Subscribe to the new channel for real-time updates
  subscribeToChannel();

  console.log(`Switched to channel: ${currentChannelName}`);
}

// Ably connection status handlers
ably.connection.on("connected", () => {
  console.log("Connected to Ably!");
});
ably.connection.on("failed", (err) => {
  console.error("Failed to connect to Ably", err);
  alert("Could not connect to the messaging service. Please check your API key.");
});

// Initial chat history load and subscription to the default channel
loadChats(currentChannelName);
subscribeToChannel();

// Message sending logic
sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const message = { username, text };
    channel.publish("message", message, (err) => {
      if (err) {
        console.error("Failed to send message", err);
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

// Clear the chat history for the current channel
clearBtn.addEventListener("click", () => {
  localStorage.removeItem(`${currentChannelName}-chatHistory`);
  chatBox.innerHTML = "";
  messageTracker.clear();
  alert("Chat history cleared!");
});

// Handle channel switching via the sidebar buttons
channelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Update active button styling
    document.querySelectorAll(".channel-button").forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // Switch to the clicked channel
    const newChannelName = button.getAttribute("data-channel");
    switchChannel(newChannelName);
  });
});

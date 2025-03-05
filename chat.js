const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");

// Set the default channel ("general")
let currentChannelName = "general";
let channel = ably.channels.get(currentChannelName);

// DOM elements
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const channelList = document.getElementById("channelList");

let username = "";
while (!username) {
  username = prompt("Enter your username").trim();
}
alert(`Welcome, ${username}! Let's chat`);

// Use a Set to avoid duplicate messages in the UI
let messageTracker = new Set();

// Function to add a message to the UI and auto-scroll
function addMessageToUI(username, text) {
  const uniqueKey = `${username}-${text}`;
  if (messageTracker.has(uniqueKey)) return;
  const p = document.createElement("p");
  p.innerHTML = `<strong>${username}</strong>: ${text}`;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
  messageTracker.add(uniqueKey);
}

// Function to load saved messages for a given channel
function loadChats(channelName) {
  const saved = JSON.parse(localStorage.getItem(`${channelName}-chatHistory`)) || [];
  saved.forEach(({ username, text }) => addMessageToUI(username, text));
}

// Function to save a message to localStorage for a given channel
function saveChatToLocal(channelName, username, text) {
  const saved = JSON.parse(localStorage.getItem(`${channelName}-chatHistory`)) || [];
  saved.push({ username, text });
  localStorage.setItem(`${channelName}-chatHistory`, JSON.stringify(saved));
}

// Subscribe to messages on the current channel
function subscribeToChannel() {
  channel.subscribe("message", (message) => {
    addMessageToUI(message.data.username, message.data.text);
    saveChatToLocal(currentChannelName, message.data.username, message.data.text);
  });
}

// Switch channels: unsubscribe, clear UI, load new messages, subscribe new channel
function switchChannel(newChannelName) {
  if (newChannelName === currentChannelName) return;
  channel.unsubscribe();
  chatBox.innerHTML = "";
  messageTracker.clear();
  currentChannelName = newChannelName;
  channel = ably.channels.get(currentChannelName);
  loadChats(currentChannelName);
  subscribeToChannel();
  console.log(`Switched to channel: ${currentChannelName}`);
}

// Ably connection status
ably.connection.on("connected", () => {
  console.log("Connected to Ably!");
});
ably.connection.on("failed", (err) => {
  console.error("Failed to connect to Ably", err);
  alert("Could not connect to the messaging service. Please check your API key.");
});

// Load chat history for the default channel and subscribe
loadChats(currentChannelName);
subscribeToChannel();

// Sending a message
sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const msg = { username, text };
    channel.publish("message", msg, (err) => {
      if (err) {
        console.error("Failed to send message", err);
        alert("Failed to send message. Try again.");
      } else {
        saveChatToLocal(currentChannelName, username, text);
        addMessageToUI(username, text);
      }
    });
    messageInput.value = "";
  } else {
    alert("Please type a message before sending!");
  }
});

// Clearing chat history for the current channel
clearBtn.addEventListener("click", () => {
  localStorage.removeItem(`${currentChannelName}-chatHistory`);
  chatBox.innerHTML = "";
  messageTracker.clear();
  alert("Chat history cleared!");
});

// Handle channel switching from the channel list
channelList.addEventListener("click", (event) => {
  if (event.target.tagName === "LI") {
    // Update active channel styling
    document.querySelectorAll("#channelList li").forEach(li => li.classList.remove("active"));
    event.target.classList.add("active");
    const newChannel = event.target.getAttribute("data-channel");
    switchChannel(newChannel);
  }
});

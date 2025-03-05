const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");
let currentChannelName = "general";
let channel = ably.channels.get(currentChannelName);

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const channelList = document.getElementById("channelList");
let username = "";

while (!username) {
  username = prompt("enter your username :3").trim();
}
alert(`welcome, ${username}! let’s chat :3`);

const messageTracker = new Set();

// Function to add messages to the UI
const addMessageToUI = (username, text) => {
  const uniqueMessageKey = `${username}-${text}`;
  if (messageTracker.has(uniqueMessageKey)) return; // Prevent duplicates

  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${username}</strong>: ${text}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom

  messageTracker.add(uniqueMessageKey); // Track this message
};

// Load previous chats from local storage
const loadChats = () => {
  const savedChats = JSON.parse(localStorage.getItem(`${currentChannelName}-chatHistory`)) || [];
  savedChats.forEach((message) => {
    addMessageToUI(message.username, message.text);
  });
};

// Save messages to local storage
const saveChatToLocal = (username, text) => {
  const chatHistory = JSON.parse(localStorage.getItem(`${currentChannelName}-chatHistory`)) || [];
  chatHistory.push({ username, text });
  localStorage.setItem(`${currentChannelName}-chatHistory`, JSON.stringify(chatHistory));
};

// Switch channels
const switchChannel = (newChannelName) => {
  if (newChannelName === currentChannelName) return;

  // Unsubscribe from the current channel
  channel.unsubscribe();

  // Clear the chat box and message tracker
  chatBox.innerHTML = "";
  messageTracker.clear();

  // Update the current channel
  currentChannelName = newChannelName;
  channel = ably.channels.get(currentChannelName);

  // Load the new channel's chat history
  loadChats();

  // Subscribe to the new channel
  channel.subscribe("message", (message) => {
    addMessageToUI(message.data.username, message.data.text);
    saveChatToLocal(message.data.username, message.data.text);
  });

  console.log(`Switched to channel: ${currentChannelName}`);
};

// Handle Ably connection events
ably.connection.on("connected", () => {
  console.log("connected to ably! :3");
});

ably.connection.on("failed", (err) => {
  console.error("failed to connect to ably :3", err);
  alert("could not connect to the messaging service. please check your api key and try again. :3");
});

// Subscribe to the initial channel
channel.subscribe("message", (message) => {
  addMessageToUI(message.data.username, message.data.text);
  saveChatToLocal(message.data.username, message.data.text);
});

// Send text messages
sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const message = { username, text };
    channel.publish("message", message, (err) => {
      if (err) {
        console.error("failed to send message :3", err);
        alert("failed to send message. try again. :3");
      } else {
        console.log("message sent :3", message);
        saveChatToLocal(username, text);
        addMessageToUI(username, text); // Immediately show the message in UI
      }
    });
    messageInput.value = ""; // Clear input field
  } else {
    alert("please type a message before sending! :3");
  }
});

// Clear the chat
clearBtn.addEventListener("click", () => {
  localStorage.removeItem(`${currentChannelName}-chatHistory`);
  chatBox.innerHTML = "";
  messageTracker.clear(); // Clear tracker to avoid stale data
  alert("chat history cleared! :3");
});

// Handle channel switching
channelList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    // Update active channel UI
    document.querySelectorAll("#channelList li").forEach((li) => li.classList.remove("active"));
    e.target.classList.add("active");

    // Switch to the selected channel
    const newChannelName = e.target.getAttribute("data-channel");
    switchChannel(newChannelName);
  }
});

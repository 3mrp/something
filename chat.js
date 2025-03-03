// Replace with your Ably API key
const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");
const channel = ably.channels.get("chat-channel");

// DOM Elements
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Listen for incoming messages
channel.subscribe("message", (message) => {
  const messageElement = document.createElement("p");
  messageElement.textContent = message.data;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll
});

// Send messages
sendBtn.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message) {
    channel.publish("message", message);
    messageInput.value = ""; // Clear the input field
  }
});

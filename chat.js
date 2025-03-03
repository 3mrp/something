// Initialize Ably with your API key
const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");

// Connect to a channel
const channel = ably.channels.get("chat-channel");

// DOM Elements
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
let username = ""; // Store the user's username

// Prompt for username
while (!username) {
  username = prompt("Enter your username:").trim();
}
alert(`Welcome, ${username}!`);

// Verify connection to Ably
ably.connection.on('connected', () => {
  console.log("Connected to Ably!");
});

ably.connection.on('failed', (err) => {
  console.error("Failed to connect to Ably:", err);
  alert("Could not connect to the messaging service. Please check your API key and try again.");
});

// Listen for messages
channel.subscribe("message", (message) => {
  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${message.data.username}</strong>: ${message.data.text}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom
  console.log("received message:", message.data);
});

// Send messages
sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const message = { username, text }; // Include the username with the message
    channel.publish("message", message, (err) => {
      if (err) {
        console.error("failed to send message:", err);
        alert("failed to send message. try again. idiot smh");
      } else {
        console.log("message sent:", message);
      }
    });
    messageInput.value = ""; // Clear input after sending
  } else {
    alert("type a message before sending gang");
  }
});

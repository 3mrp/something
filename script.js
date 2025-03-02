// Initialize the Ably Realtime connection
const ably = new Ably.Realtime("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");

// Get a channel to send/receive messages
const channel = ably.channels.get("chat-room");

// DOM elements
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// Publish a message when the send button is clicked
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        channel.publish("chat-message", message);
        messageInput.value = ""; // Clear the input field
    }
});

// Subscribe to messages on the channel
channel.subscribe("chat-message", (msg) => {
    const newMessage = document.createElement("div");
    newMessage.textContent = msg.data; // Display the message content
    messagesDiv.appendChild(newMessage);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll
});

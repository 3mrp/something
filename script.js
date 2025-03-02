// Initialize the Ably Realtime connection
const ably = new Ably.Realtime("Aj5RCA.CygHdA:ygSN2m0iIHyUlwoZBKmpENRPoarL-HcYq-MzyAmeMXo");

// Get a channel to send/receive messages
const channel = ably.channels.get("chat-room");

// DOM elements
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// Helper function to display messages
function displayMessage(message) {
    const newMessage = document.createElement("div");
    newMessage.textContent = message;
    messagesDiv.appendChild(newMessage);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
}

// Publish a message when the send button is clicked
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        channel.publish("chat-message", message); // Send the message to the Ably channel
        messageInput.value = ""; // Clear the input field
        displayMessage(`You: ${message}`); // Show your message immediately
    }
});

// Subscribe to messages on the channel
channel.subscribe("chat-message", (msg) => {
    displayMessage(`Friend: ${msg.data}`); // Display the received message
});

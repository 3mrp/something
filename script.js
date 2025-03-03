// Initialize the Ably Realtime connection
const ably = new Ably.Realtime("Aj5RCA.eFB3YA:VbGyxs0o72pEszMGqx9cA8wZBUaFHry8CXQ0D3bXxfQ");

// Get the channel to send/receive messages
const channel = ably.channels.get("chat-room");

// DOM elements
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// Function to display messages in the chat window
function displayMessage(content, sender) {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${sender}: ${content}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
}

// Handle sending messages
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        // Publish the message to Ably
        channel.publish("chat-message", message, (err) => {
            if (err) {
                console.error("Failed to send message:", err);
            } else {
                displayMessage(message, "You"); // Show the message locally
            }
        });
        messageInput.value = ""; // Clear input field
    }
});

// Handle receiving messages
channel.subscribe("chat-message", (msg) => {
    displayMessage(msg.data, "Friend"); // Show the incoming message
});

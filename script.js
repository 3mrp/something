// Initialize the Ably Realtime connection
const ably = new Ably.Realtime("Aj5RCA.eFB3YA:VbGyxs0o72pEszMGqx9cA8wZBUaFHry8CXQ0D3bXxfQ");

// Get the channel to send and receive messages
const channel = ably.channels.get("chat-room");

// Get DOM elements
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// Function to display messages
function displayMessage(content, sender) {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${sender}: ${content}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
}

// Publish a message when the send button is clicked
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        // Publish message to Ably
        channel.publish("chat-message", message, (err) => {
            if (err) {
                console.error("Failed to send message:", err);
            } else {
                displayMessage(message, "You"); // Show your message locally
            }
        });
        messageInput.value = ""; // Clear input field
    }
});

// Subscribe to the "chat-message" channel to receive messages
channel.subscribe("chat-message", (msg) => {
    // Ensure the message displays for all tabs or devices
    displayMessage(msg.data, "Friend");
});

// Initialize the Ably Realtime connection with the given API key
const ably = new Ably.Realtime("Aj5RCA.eFB3YA:VbGyxs0o72pEszMGqx9cA8wZBUaFHry8CXQ0D3bXxfQ");

// Get the channel to send and receive messages
const channel = ably.channels.get("chat-room");

// Get DOM elements
const messagesDiv = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

// Function to display a message
function displayMessage(content, sender) {
    const messageElement = document.createElement("div");
    messageElement.textContent = `${sender}: ${content}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the latest message
}

// Event listener for sending messages
sendButton.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (message) {
        channel.publish("chat-message", message); // Send to Ably
        displayMessage(message, "You"); // Display your message locally
        messageInput.value = ""; // Clear input field
    }
});

// Subscribe to incoming messages
channel.subscribe("chat-message", (msg) => {
    displayMessage(msg.data, "Friend"); // Display received message
});

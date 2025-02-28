document.addEventListener('DOMContentLoaded', function() {
    const Ably = require('ably');
    const ably = new Ably.Realtime('YOUR_API_KEY');
    const channel = ably.channels.get('chat-room');

    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');

    // Listen for new messages
    channel.subscribe('message', function(message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message.data;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    });

    // Send a new message
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const message = messageInput.value;
            channel.publish('message', message);
            messageInput.value = '';
        }
    });
});

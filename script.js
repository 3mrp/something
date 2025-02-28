document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded and parsed");
    const ably = new Ably.Realtime('Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY');
    const channel = ably.channels.get('chat-room');

    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    // Function to append messages to the chat
    function appendMessage(messageText) {
        const messageElement = document.createElement('div');
        messageElement.textContent = messageText;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    // Listen for new messages and append them to the chat window
    channel.subscribe('message', function(message) {
        console.log('Received message:', message.data);
        appendMessage(message.data);
    });

    // Function to send a new message
    function sendMessage() {
        const message = messageInput.value;
        if (message) {
            console.log('Sending message:', message);
            channel.publish('message', message, function(err) {
                if (err) {
                    console.error('Error publishing message:', err);
                } else {
                    console.log('Message sent successfully');
                    appendMessage(message);
                }
            });
            messageInput.value = '';
        }
    }

    // Send message on Enter key press
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            console.log('Enter key pressed');
            sendMessage();
        }
    });

    // Send message on button click
    sendButton.addEventListener('click', function() {
        console.log('Send button clicked');
        sendMessage();
    });
});

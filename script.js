// Initialize Ably
const ably = new Ably.Realtime('Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY');
const channel = ably.channels.get('chat');

// DOM Elements
const chatDiv = document.getElementById('chat');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// Send Message
sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    channel.publish('message', { text: message }, (err) => {
        if (err) {
            console.error('Unable to publish message:', err);
        } else {
            messageInput.value = '';
        }
    });
});

// Receive Message
channel.subscribe('message', (msg) => {
    const messageElement = document.createElement('div');
    messageElement.textContent = msg.data.text;
    chatDiv.appendChild(messageElement);
});

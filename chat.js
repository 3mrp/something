// initialize ably with your api key
const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");

// connect to a channel
const channel = ably.channels.get("chat-channel");

// dom elements
const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
let username = "";

// prompt for username
while (!username) {
  username = prompt("enter your username :3").trim();
}
alert(`welcome, ${username}! let’s chat :3`);

// load previous chats from local storage
const loadChats = () => {
  const savedChats = JSON.parse(localStorage.getItem("chatHistory")) || [];
  savedChats.forEach((message) => {
    const messageElement = document.createElement("p");
    messageElement.innerHTML = `<strong>${message.username}</strong>: ${message.text}`;
    chatBox.appendChild(messageElement);
  });
  chatBox.scrollTop = chatBox.scrollHeight; // auto-scroll to bottom
};
loadChats();

// save message to local storage
const saveChatToLocal = (username, text) => {
  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistory.push({ username, text });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
};

// verify connection to ably
ably.connection.on('connected', () => {
  console.log("connected to ably! :3");
});

ably.connection.on('failed', (err) => {
  console.error("failed to connect to ably :3", err);
  alert("could not connect to the messaging service. please check your api key and try again. :3");
});

// listen for messages
channel.subscribe("message", (message) => {
  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${message.data.username}</strong>: ${message.data.text}`;
  chatBox.appendChild(messageElement);
  saveChatToLocal(message.data.username, message.data.text);
  chatBox.scrollTop = chatBox.scrollHeight; // auto-scroll to bottom
  console.log("received message: :3", message.data);
});

// send messages
sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const message = { username, text }; // only the message text, no :3
    channel.publish("message", message, (err) => {
      if (err) {
        console.error("failed to send message :3", err);
        alert("failed to send message. try again. :3");
      } else {
        console.log("message sent :3", message);
        saveChatToLocal(username, text);
      }
    });
    messageInput.value = ""; // clear input after sending
  } else {
    alert("please type a message before sending! :3");
  }
});

// clear chat history
clearBtn.addEventListener("click", () => {
  localStorage.removeItem("chatHistory");
  chatBox.innerHTML = ""; // clear chat box
  alert("chat history cleared! :3");
});

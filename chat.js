const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");
const channel = ably.channels.get("chat-channel");

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
let username = "";

while (!username) {
  username = prompt("enter your username :3").trim();
}
alert(`welcome, ${username}! let’s chat :3`);

const loadedMessages = new Set();

const loadChats = () => {
  const savedChats = JSON.parse(localStorage.getItem("chatHistory")) || [];
  savedChats.forEach((message) => {
    if (!loadedMessages.has(message.text)) {
      const messageElement = document.createElement("p");
      messageElement.innerHTML = `<strong>${message.username}</strong>: ${message.text}`;
      chatBox.appendChild(messageElement);
      loadedMessages.add(message.text);
    }
  });
  chatBox.scrollTop = chatBox.scrollHeight;
};
loadChats();

const saveChatToLocal = (username, text) => {
  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistory.push({ username, text });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
};

ably.connection.on('connected', () => {
  console.log("connected to ably! :3");
});

ably.connection.on('failed', (err) => {
  console.error("failed to connect to ably :3", err);
  alert("could not connect to the messaging service. please check your api key and try again. :3");
});

channel.subscribe("message", (message) => {
  if (!loadedMessages.has(message.data.text)) {
    const messageElement = document.createElement("p");
    messageElement.innerHTML = `<strong>${message.data.username}</strong>: ${message.data.text}`;
    chatBox.appendChild(messageElement);
    saveChatToLocal(message.data.username, message.data.text);
    loadedMessages.add(message.data.text);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const message = { username, text };
    channel.publish("message", message, (err) => {
      if (err) {
        console.error("failed to send message :3", err);
        alert("failed to send message. try again. :3");
      } else {
        console.log("message sent :3", message);
        saveChatToLocal(username, text);
      }
    });
    messageInput.value = "";
  } else {
    alert("please type a message before sending! :3");
  }
});

clearBtn.addEventListener("click", () => {
  localStorage.removeItem("chatHistory");
  chatBox.innerHTML = "";
  alert("chat history cleared! :3");
});

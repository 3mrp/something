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

const messageTracker = new Set();

const addMessageToUI = (username, text) => {
  const uniqueMessageKey = `${username}-${text}`;
  if (messageTracker.has(uniqueMessageKey)) return; // Prevent duplicates

  const messageElement = document.createElement("p");
  messageElement.innerHTML = `<strong>${username}</strong>: ${text}`;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom

  messageTracker.add(uniqueMessageKey); // Track this message
};

const loadChats = () => {
  const savedChats = JSON.parse(localStorage.getItem("chatHistory")) || [];
  savedChats.forEach((message) => {
    addMessageToUI(message.username, message.text);
  });
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
  addMessageToUI(message.data.username, message.data.text);
  saveChatToLocal(message.data.username, message.data.text);
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
        addMessageToUI(username, text); // Immediately show the message in UI
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
  messageTracker.clear(); // Clear tracker to avoid stale data
  alert("chat history cleared! :3");
});

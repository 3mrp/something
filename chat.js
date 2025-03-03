const ably = new Ably.Realtime.Promise("Aj5RCA.lkSclA:JY7AdllhPQkqoWqgyuxqUA3KeUBA_4ZkQhC8jJnuPYY");
const channel = ably.channels.get("chat-channel");

const chatBox = document.getElementById("chatBox");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const imageInput = document.getElementById("imageInput");
let username = "";

while (!username) {
  username = prompt("enter your username :3").trim();
}
alert(`welcome, ${username}! let’s chat :3`);

const messageTracker = new Set();

const addMessageToUI = (username, content, isImage = false) => {
  const uniqueMessageKey = `${username}-${content}`;
  if (messageTracker.has(uniqueMessageKey)) return; // Prevent duplicates

  const messageElement = document.createElement("p");

  if (isImage) {
    const imageElement = document.createElement("img");
    imageElement.src = content;
    imageElement.style.maxWidth = "200px";
    messageElement.appendChild(imageElement);
  } else {
    messageElement.innerHTML = `<strong>${username}</strong>: ${content}`;
  }

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to bottom

  messageTracker.add(uniqueMessageKey); // Track this message
};

const loadChats = () => {
  const savedChats = JSON.parse(localStorage.getItem("chatHistory")) || [];
  savedChats.forEach((message) => {
    addMessageToUI(message.username, message.content, message.isImage);
  });
};
loadChats();

const saveChatToLocal = (username, content, isImage = false) => {
  const chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || [];
  chatHistory.push({ username, content, isImage });
  localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
};

ably.connection.on("connected", () => {
  console.log("connected to ably! :3");
});

ably.connection.on("failed", (err) => {
  console.error("failed to connect to ably :3", err);
  alert("could not connect to the messaging service. please check your api key and try again. :3");
});

channel.subscribe("message", (message) => {
  if (message.data.isImage) {
    addMessageToUI(message.data.username, message.data.content, true);
    saveChatToLocal(message.data.username, message.data.content, true);
  } else {
    addMessageToUI(message.data.username, message.data.content);
    saveChatToLocal(message.data.username, message.data.content);
  }
});

sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    const message = { username, content: text, isImage: false };
    channel.publish("message", message, (err) => {
      if (err) {
        console.error("failed to send message :3", err);
        alert("failed to send message. try again. :3");
      } else {
        console.log("message sent :3", message);
        saveChatToLocal(username, text, false);
        addMessageToUI(username, text, false); // Immediately show the message in UI
      }
    });
    messageInput.value = "";
  } else {
    alert("please type a message before sending! :3");
  }
});

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target.result;
      const message = { username, content: imageData, isImage: true };

      channel.publish("message", message, (err) => {
        if (err) {
          console.error("failed to send image :3", err);
          alert("failed to send image. try again. :3");
        } else {
          console.log("image sent :3", message);
          saveChatToLocal(username, imageData, true);
          addMessageToUI(username, imageData, true); // Immediately show the image in UI
        }
      });
    };
    reader.readAsDataURL(file); // Convert image to Base64
    imageInput.value = ""; // Clear the file input
  }
});

clearBtn.addEventListener("click", () => {
  localStorage.removeItem("chatHistory");
  chatBox.innerHTML = "";
  messageTracker.clear(); // Clear tracker to avoid stale data
  alert("chat history cleared! :3");
});

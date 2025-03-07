// Countdown start (2000 years from now)
let yearsLeft = 2000;

// Function to update the countdown
function updateCountdown() {
  const countdownElement = document.getElementById("countdown");

  // Update the message
  if (yearsLeft > 0) {
    countdownElement.textContent = `${yearsLeft} years until Fruit Bat comes out`;
    yearsLeft--;
  } else {
    countdownElement.textContent = "Fruit Bat is here! 🦇";
    clearInterval(countdownInterval); // Stop the countdown
  }
}

// Start the countdown and update every 1 second
const countdownInterval = setInterval(updateCountdown, 1000);

// Initialize the countdown immediately on page load
updateCountdown();

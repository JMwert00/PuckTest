let puckDevice = null;
let gattServer = null;
let txCharacteristic = null;
let rxCharacteristic = null;

async function connectToPuck() {
  try {
    // Request the device with UART service
    puckDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
    });

    console.log("Connecting to GATT server...");
    gattServer = await puckDevice.gatt.connect();

    console.log("Getting UART service...");
    const service = await gattServer.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');

    console.log("Getting characteristics...");
    txCharacteristic = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
    rxCharacteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');

    // Enable notifications on the RX characteristic
    rxCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);
    await rxCharacteristic.startNotifications();

    console.log("Connected to Puck.js");

  } catch (error) {
    console.error("Failed to connect to Puck.js:", error);
  }
}
//Disconnect from Puck
async function disconnectFromPuck() {
  try {
    if (!puckDevice) {
      console.log("No device connected.");
      return;
    }

    if (rxCharacteristic) {
      console.log("Stopping notifications...");
      await rxCharacteristic.stopNotifications();
      rxCharacteristic.removeEventListener('characteristicvaluechanged', handleNotifications);
      console.log("Notifications stopped.");
    }

    if (gattServer && gattServer.connected) {
      console.log("Disconnecting from GATT server...");
      gattServer.disconnect();
      console.log("Disconnected from GATT server.");
    } else {
      console.log("GATT server is not connected.");
    }

    // Clear references to ensure the device can be reconnected
    puckDevice = null;
    gattServer = null;
    txCharacteristic = null;
    rxCharacteristic = null;

    console.log("Puck.js disconnected and cleaned up.");
  } catch (error) {
    console.error("Failed to disconnect from Puck.js:", error);
  }
}
//
//EventListener mit Funktion
document.getElementById("disconnect").addEventListener("click", disconnectFromPuck);
const popup = document.getElementById("popup");
const overlay = document.getElementById("overlay");
const saveNoteButton = document.getElementById("saveNote");
const confirmSaveButton = document.getElementById("confirmSave");
const cancelSaveButton = document.getElementById("cancelSave");

saveNoteButton.addEventListener("click", () => {
  popup.style.display = "block";
  overlay.style.display = "block";
});

confirmSaveButton.addEventListener("click", () => {
  const color = document.getElementById("colorPicker").value;
  const title = document.getElementById("titleInput").value.trim();
  const content = document.getElementById("d-array").value.trim();

  if (!title || !content) {
    alert("Please provide a title and pulse times.");
    return;
  }

  notes.push({ color, title, text: content });
  commands[title] = content.split("\n");

  saveNotes();
  renderNotes();

  popup.style.display = "none";
  overlay.style.display = "none";
});

cancelSaveButton.addEventListener("click", () => {
  popup.style.display = "none";
  overlay.style.display = "none";
});


function handleNotifications(event) {
  const value = new TextDecoder().decode(event.target.value);
  console.log("Received data:", value);

  // Append the received value to the existing content of the textarea
  console.log("");
  const textarea = document.getElementById("d-array");
  textarea.value += value.trim();

  // Optional: Automatically scroll to the bottom to see new data
  textarea.scrollTop = textarea.scrollHeight;
}
document.getElementById("connect").addEventListener("click", connectToPuck);

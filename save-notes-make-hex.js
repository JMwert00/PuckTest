let color = '#ffffff';
let title = '';
let content = '';
let notes = [];
var commands = {};
let savedCommands = JSON.parse(localStorage.getItem('savedCommands')) || [];
//savedCommands.push({title: title, command: irCommand });
saveSavedCommands();

function loadNotes() {
  const savedNotes = JSON.parse(localStorage.getItem('notes')) || [];
  notes = savedNotes;
  renderNotes();

  const savedCommands = JSON.parse(localStorage.getItem('commands')) || {};
  commands = savedCommands;
}
function saveNotes() {
  localStorage.setItem('notes', JSON.stringify(notes));
  localStorage.setItem('commands', JSON.stringify(commands));

}
function renderNotes() {
  const notesContainer = document.getElementById('notesContainer');
  notesContainer.innerHTML = ''; // Clear existing notes
  notes.forEach((note, index) => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.style.backgroundColor = note.color;
    noteElement.style.boxShadow = note.shadow;

    const deleteButton = document.createElement('span');
    deleteButton.classList.add('delete');
    deleteButton.textContent = 'Löschen';
    // Use the note's title directly
    deleteButton.onclick = () => deleteNote(index);

    const playButton = document.createElement('span');
    playButton.classList.add('delete');
    playButton.textContent = 'Wiedergabe';
    playButton.onclick = () => playNoteCommand(note.title);  // Add play functionality

    const titleElement = document.createElement('h2');
    titleElement.textContent = note.title;

    const contentElement = document.createElement('p');
    contentElement.textContent = note.text;

    noteElement.appendChild(deleteButton);
    noteElement.appendChild(titleElement);
    noteElement.appendChild(contentElement);
    noteElement.appendChild(playButton);
    notesContainer.appendChild(noteElement);
  });
}


function addNote() {
  title = document.getElementById('titleInput').value;
  content = document.getElementById('contentInput').value;
  color = document.getElementById('colorPicker').value;

  if (!title || !content) {
    alert('Bitte Titel und Notiz eingeben.');
    return;
  }

  commands[title] = [content]; // [content] = IR Impulse/Pulszeiten die in Puck.IR(); genutzt werden für Replay von erlernten Signalen

  notes.push({
    color: color,
    title: title,
    text: content,
    shadow: '1px 1px 4px 1px #000',
  });
  clearInputFields();
  saveNotes();
  renderNotes();
  console.log(commands);
}
function clearInputFields() {
  document.getElementById('colorPicker').value = '#ffffff';
  document.getElementById('titleInput').value = '';
  document.getElementById('contentInput').value = '';
}

function deleteNote(index) {
  const noteToDelete = notes[index].title;
  notes.splice(index, 1);
  deleteCommand(noteToDelete);
  saveNotes();
  renderNotes();
}

function deleteCommand(title) {
  delete commands[title];
  saveNotes();
}

// BLE Funktionalität hinzufügen nach Tutorial Beispiel
function playNoteCommand(title) {
  if (commands[title]) {
    const irCommand = commands[title].join(' '); // Initialisierung
    console.log('Playing command for note:', title);
    console.log('Command content:', irCommand);
    const tdElement = document.createElement('td');
    tdElement.setAttribute('onclick', `sendIR(${JSON.stringify(irCommand)})`);
    tdElement.textContent = title.toUpperCase(); //Befehlsfeld Name

    // Erzeuge Lösch-Button
    const deleteButton = document.createElement('span');
    deleteButton.classList.add('delete');
    deleteButton.textContent = 'Löschen';
    deleteButton.onclick = () => {
      deleteSavedCommand(title, tdElement);
    };

    tdElement.appendChild(deleteButton);
    document.body.appendChild(tdElement);
  }
}

function saveSavedCommands() {
  localStorage.setItem('savedCommands', JSON.stringify(savedCommands));
}

function deleteSavedCommand(title, tdElement) {
  //  <td> Element von  DOM löschen
  tdElement.remove();

  // Löschen im savedCommands
  savedCommands = savedCommands.filter(command => command.title !== title);

  // Speichern im localStorage
  saveSavedCommands();
}

function restoreSavedCommands() {
  savedCommands.forEach(savedCommand => {
    const tdElement = document.createElement('td');
    tdElement.setAttribute('onclick', `sendIR('${savedCommand.command}')`);
    tdElement.textContent = savedCommand.title.toUpperCase();

    // Löschfunktion ('X')
    const deleteButton = document.createElement('span');
    deleteButton.classList.add('delete');
    deleteButton.textContent = 'X';
    deleteButton.onclick = () => {
      deleteSavedCommand(savedCommand.title, tdElement);
    };

    // Append the delete button to the <td> element
    // Append the <td> element to the DOM (you can append it wherever you'd like)
    tdElement.appendChild(deleteButton);
    document.body.appendChild(tdElement);
  });
}
// IR Funktion wird an den Puck weitergesendet als IR Befehl
function sendIR(array) {
  Puck.write('Puck.IR([' + array + ']);\n');
}

//Befehle und IR Befehle werden beim Start aus dem Speicher geladen
window.onload = () => {
  restoreSavedCommands();
  loadNotes();
}

//Pulszeiten NEC dekodieren und in HEX umwandeln für CSV
document.getElementById('makeHex').addEventListener('click', () => {
  // Input pulse times from the textarea
  const pulseTimes = document.getElementById('d-array').value.trim();
  console.log(pulseTimes);
  if (!pulseTimes) {
    alert('Please enter pulse times!');
    return;
  }

  try {
    // Define the NEC protocol thresholds
    const pulse_width_leader = [9.0, 13.5];  // ms, approximate for the leader signal pulse
    const space_width_leader = [4.0, 5.0];  // ms, approximate for the leader signal space
    const pulse_width_short = [0.4, 1.0];   // ms, for logical 0 or 1 pulses
    const space_width_0 = [0.4, 1.0];       // ms, for logical 0 space
    const space_width_1 = [1.5, 2.0];       // ms, for logical 1 space

    // Parse pulse times into an array
    const pulseArray = pulseTimes.split(',').map(value => parseFloat(value.trim()));

    // Helper function to categorize pulses
    function categorizePulseSequence(pulse_times) {
      const bits = [];
      let leaderDetected = false;
      let i = 0;

      while (i < pulse_times.length) {
        const pulse = pulse_times[i];
        const space = i + 1 < pulse_times.length ? pulse_times[i + 1] : null;

        // Detect leader signal
        if (pulse >= pulse_width_leader[0] && pulse <= pulse_width_leader[1] &&
          space >= space_width_leader[0] && space <= space_width_leader[1]) {
          leaderDetected = true;
          i += 2;  // Skip leader pulse and space
          continue;
        }

        // Detect logical 0 or 1
        if (pulse >= pulse_width_short[0] && pulse <= pulse_width_short[1]) {
          if (space >= space_width_0[0] && space <= space_width_0[1]) {
            bits.push(0);  // Logical 0
          } else if (space >= space_width_1[0] && space <= space_width_1[1]) {
            bits.push(1);  // Logical 1
          }
        }

        i += 2;  // Move to next pulse-space pair
      }

      return [leaderDetected, bits];
    }

    // Decode the pulse sequence
    const [leaderDetected, bits] = categorizePulseSequence(pulseArray);

    // Convert bits to bytes
    function bitsToBytes(bits) {
      const bytesArray = [];
      for (let i = 0; i < bits.length; i += 8) {
        const byte = bits.slice(i, i + 8);
        let byteValue = 0;
        for (let j = 0; j < byte.length; j++) {
          byteValue += byte[j] << (7 - j);
        }
        bytesArray.push(byteValue);
      }
      return bytesArray;
    }

    const decodedBytes = bitsToBytes(bits);

    // Convert bytes to HEX format
    const hexArray = decodedBytes.map(byte => byte.toString(16).toUpperCase().padStart(2, '0'));

    // Now, use the helper function to group the bytes into the DSF format
    function decodeToDSF(decodedBytes) {
      // Ensure the input array has the expected length (8 bytes for NEC protocol)
      // if (decodedBytes.length !== 8) {
      //     console.error("Invalid number of decoded bytes. Expected 8 bytes.");
      //     return;
      //  }

      // Function to reverse the bit order of a byte
      function reverseBits(byte) {
        let reversed = 0;
        for (let i = 0; i < 8; i++) {
          reversed <<= 1; // Shift left to make space for the next bit
          reversed |= (byte & 1); // Add the LSB of the original byte to the reversed byte
          byte >>= 1; // Shift the original byte right to process the next bit
        }
        return reversed;
      }

      // Reverse the bits of each byte in the input array
      const reversedBytes = decodedBytes.map(reverseBits);

      // Extract the relevant sections of the reversed byte array (NEC protocol)
      const deviceAddress = reversedBytes[0];
      const inverseDeviceAddress = reversedBytes[1];
      const functionCode = reversedBytes[2];
      const inverseFunctionCode = reversedBytes[3];

      // Convert each value to hexadecimal format (2 digits with uppercase letters)
      const deviceAddressHex = deviceAddress.toString(16).toUpperCase().padStart(2, '0');
      const inverseDeviceAddressHex = inverseDeviceAddress.toString(16).toUpperCase().padStart(2, '0');
      const functionCodeHex = functionCode.toString(16).toUpperCase().padStart(2, '0');
      const inverseFunctionCodeHex = inverseFunctionCode.toString(16).toUpperCase().padStart(2, '0');

      // Format and return the NEC DSF notation

      const dsfNotation = `Device: ${deviceAddressHex} Subdevice: ${inverseDeviceAddressHex} Function: ${functionCodeHex} Inverse Function: ${inverseFunctionCodeHex}`;
      console.log(dsfNotation, "<--");
      return dsfNotation;
    }
    function hexToSignedDecimal(hex) {
      const num = parseInt(hex, 16); // Convert hex to an integer
      return num > 127 ? num - 256 : num; // Handle signed values (assuming 8-bit representation)
    }

    // Convert each component to signed decimal
    const deviceAddressHex = decodedBytes[0].toString(16).toUpperCase().padStart(2, '0');
    const inverseDeviceAddressHex = decodedBytes[1].toString(16).toUpperCase().padStart(2, '0');
    const functionCodeHex = decodedBytes[2].toString(16).toUpperCase().padStart(2, '0');
    const inverseFunctionCodeHex = decodedBytes[3].toString(16).toUpperCase().padStart(2, '0');

    const signedDevice = hexToSignedDecimal(deviceAddressHex);
    const signedSubdevice = hexToSignedDecimal(inverseDeviceAddressHex);
    const signedFunction = hexToSignedDecimal(functionCodeHex);
    const signedInverseFunction = hexToSignedDecimal(inverseFunctionCodeHex);

    // Prepare the additional signed decimal and signed hex data
    const signedInfo = `
              Signed Decimal Values:
              Device: ${signedDevice}
              Subdevice: ${signedSubdevice}
              Function: ${signedFunction}
              Inverse Function: ${signedInverseFunction}

              Signed HEX:
              Device: ${signedDevice.toString(16).toUpperCase()}
              Subdevice: ${signedSubdevice.toString(16).toUpperCase()}
              Function: ${signedFunction.toString(16).toUpperCase()}
              Inverse Function: ${signedInverseFunction.toString(16).toUpperCase()}
            `;

    function saveToList(dsfResult) {
      const listElement = document.createElement("li");
      listElement.textContent = dsfResult;
      document.getElementById("resultList").appendChild(listElement);
    }
    // Call the function to get the NEC DSF notation
    const dsf = decodeToDSF(decodedBytes);
    console.log(dsf + "<<<<<<< dsf");
    // Display both the HEX code and the DSF formatted result inside the textarea
    const combinedResult = `
              HEX: ${hexArray.join(' ')}
              DSF: ${dsf}
              ${signedInfo}
          `;

    document.getElementById('hexOutput').value = combinedResult || 'No result.';

    console.log(`Leader detected: ${leaderDetected}`);
    console.log(`Decoded Bytes: ${decodedBytes}`);
    console.log(`HEX: ${hexArray.join(' ')}`);
    console.log(`DSF: ${dsf}`);
    document.getElementById(notesContainer)
  } catch (error) {
    alert(error.message); // Handle errors gracefully
  }
  //NEU CSV und LISTE
  function saveToListAndCSV() {
    // Get the content of the textarea
    const textareaContent = document.getElementById("hexOutput").value;

    // Regular expressions to extract the hex values for Device, Subdevice, and Function
    const deviceMatch = textareaContent.match(/Device:\s*([0-9A-Fa-f]{2})/);
    const subdeviceMatch = textareaContent.match(/Subdevice:\s*([0-9A-Fa-f]{2})/);
    const functionMatch = textareaContent.match(/Function:\s*([0-9A-Fa-f]{2})/);

    if (deviceMatch && subdeviceMatch && functionMatch) {
      // Extract hex values
      const deviceHex = deviceMatch[1];
      const subdeviceHex = subdeviceMatch[1];
      const functionHex = functionMatch[1];

      // Convert hex values to decimal
      const deviceDecimal = parseInt(deviceHex, 16);
      const subdeviceDecimal = parseInt(subdeviceHex, 16);
      const functionDecimal = parseInt(functionHex, 16);

      // Format the output for the list
      const listText = `Device: ${deviceDecimal} Subdevice: ${subdeviceDecimal} Function: ${functionDecimal}`;

      // Create a new <li> element and set its content
      const listElement = document.createElement("li");
      listElement.textContent = listText;

      // Append the new <li> to the list with id="resultList"
      document.getElementById("resultList").appendChild(listElement);

      // Prepare the data to save to the CSV
      const csvContent = `${deviceDecimal},${subdeviceDecimal},${functionDecimal}\n`;

      // Save the data to the CSV file
      saveToCSV(csvContent);
    } else {
      alert("Could not find valid Device, Subdevice, or Function values to parse.");
    }
  }

  // Function to save data to a CSV file
  function saveToCSV(data) {
    // Create a Blob object with the CSV data
    const blob = new Blob([data], { type: "text/csv" });

    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "output.csv";

    // Programmatically click the link to trigger the download
    link.click();

    // Clean up the temporary link
    URL.revokeObjectURL(link.href);
  }


});

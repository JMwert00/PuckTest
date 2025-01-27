
      // Array to store list items
      let itemList = [];

      // Function to add an item to the list
      function addItem() {
        // Get input values
        const functionName = document.getElementById("functionName").value.trim();
        const device = document.getElementById("device").value.trim();
        const subdevice = document.getElementById("subdevice").value.trim();
        const func = document.getElementById("function").value.trim();

        // Validate inputs
        if (!functionName || !device || !subdevice || !func) {
          alert("Please fill out all fields.");
          return;
        }

        // Create an item object
        const item = {
          functionName,
          protocol: "NEC", // Default protocol
          device,
          subdevice,
          func,
        };

        // Add item to the list
        itemList.push(item);

        // Save to local storage
        localStorage.setItem("functionList", JSON.stringify(itemList));

        // Update the displayed list
        updateList();
      }

      // Function to update the displayed list
      function updateList() {
        const listContainer = document.getElementById("itemList");
        listContainer.innerHTML = ""; // Clear the list

        itemList.forEach((item, index) => {
          // Create list item element
          const listItem = document.createElement("li");
          listItem.textContent = `${item.functionName}, ${item.protocol}, ${item.device}, ${item.subdevice}, ${item.func}`;

          // Create delete button
          const deleteButton = document.createElement("button");
          deleteButton.textContent = "Delete";
          deleteButton.style.marginLeft = "10px";
          deleteButton.onclick = () => deleteItem(index);

          // Append elements to the list item
          listItem.appendChild(deleteButton);
          listContainer.appendChild(listItem);
        });
      }

      // Function to delete an item
      function deleteItem(index) {
        itemList.splice(index, 1); // Remove item from array

        // Update local storage
        localStorage.setItem("functionList", JSON.stringify(itemList));

        // Update the displayed list
        updateList();
      }

      // Function to export the list as a CSV
      function exportCSV() {
        if (itemList.length === 0) {
          alert("No items to export.");
          return;
        }

        // Prepare CSV content
        let csvContent = "functionname,protocol,device,subdevice,function\n"; // CSV header
        itemList.forEach((item) => {
          csvContent += `${item.functionName},${item.protocol},${item.device},${item.subdevice},${item.func}\n`;
        });

        // Create a Blob and download the file
        const blob = new Blob([csvContent], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "function_list.csv";
        link.click();
      }

      // Load list from local storage on page load
      window.onload = function () {
        const savedList = localStorage.getItem("functionList");
        if (savedList) {
          itemList = JSON.parse(savedList);
          updateList();
        }
      };
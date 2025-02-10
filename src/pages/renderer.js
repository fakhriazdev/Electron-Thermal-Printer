document.addEventListener('DOMContentLoaded', async () => {
  const printerSelect = document.getElementById('printerSelect');
  const testPrintButton = document.getElementById('printTestBtn');
  const refreshButton = document.getElementById('refreshPrinters'); // Tambahkan tombol refresh printer
  const statusText = document.getElementById('status');

  async function loadPrinters() {
    try {
      const printers = await window.electronAPI.getPrinters();
      printerSelect.innerHTML = ''; // Kosongkan dropdown sebelum diisi ulang

      if (printers.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'No printers found';
        option.disabled = true;
        printerSelect.appendChild(option);
      } else {
        printers.forEach((printer) => {
          const option = document.createElement('option');
          option.value = printer.name;
          option.textContent = printer.name;
          printerSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error fetching printers:', error);
      statusText.innerText = '⚠️ Failed to load printers!';
    }
  }

  async function testPrint() {
    const printerName = printerSelect.value;
    if (!printerName) {
      statusText.innerText = '⚠️ Please select a printer first!';
      return;
    }

    statusText.innerText = 'Printing...';
    const result = await window.electronAPI.printTest(printerName);
    statusText.innerText = result.message;
  }

  // Load printer list saat aplikasi dijalankan
  loadPrinters();

  // Event listener untuk tombol test print
  testPrintButton.addEventListener('click', testPrint);

  // Event listener untuk refresh printer list
  refreshButton.addEventListener('click', loadPrinters);
});

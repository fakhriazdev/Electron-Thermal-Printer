document.addEventListener('DOMContentLoaded', () => {
  const testPrintButton = document.getElementById('printTestBtn');
  const statusText = document.getElementById('status');
  const printerInput = document.getElementById('printerInput');
  const savePrinterButton = document.getElementById('savePrinter');
  const logContainer = document.getElementById('logContainer'); // Pastikan ini ada di HTML
  const printerDisplay = document.createElement('p');

  if (
    !testPrintButton ||
    !statusText ||
    !printerInput ||
    !savePrinterButton ||
    !logContainer
  ) {
    console.error(
      '⚠️ Salah satu elemen tidak ditemukan. Periksa kembali HTML!'
    );
    return;
  }

  if (window.electronAPI?.onLogMessage) {
    window.electronAPI.onLogMessage((message) => {
      const logItem = document.createElement('p');
      logItem.textContent = message;
      logContainer.appendChild(logItem);
    });
  } else {
    console.warn('⚠️ window.electronAPI.onLogMessage tidak tersedia.');
  }

  function updatePrinterUI(printerName = '') {
    if (printerName) {
      printerInput.type = 'hidden';
      printerDisplay.innerHTML = `<strong>${printerName}</strong>`;
      printerInput.insertAdjacentElement('afterend', printerDisplay);
      savePrinterButton.textContent = 'Edit';
    } else {
      printerInput.type = 'text';
      printerDisplay.remove();
      savePrinterButton.textContent = 'Save';
    }
  }

  function loadSavedPrinter() {
    const savedPrinter = localStorage.getItem('selectedPrinter');
    updatePrinterUI(savedPrinter);
  }

  savePrinterButton.addEventListener('click', () => {
    if (savePrinterButton.textContent === 'Edit') {
      printerInput.type = 'text';
      printerInput.value = localStorage.getItem('selectedPrinter') || '';
      printerDisplay.remove();
      savePrinterButton.textContent = 'Save';
    } else {
      const printerName = printerInput.value.trim();
      if (printerName) {
        localStorage.setItem('selectedPrinter', printerName);
        updatePrinterUI(printerName);
      } else {
        alert('⚠️ Masukkan nama printer terlebih dahulu!');
      }
    }
  });

  loadSavedPrinter();

  async function printTestReceipt() {
    const selectedPrinter = localStorage.getItem('selectedPrinter');
    if (!selectedPrinter) {
      statusText.innerText = '⚠️ Harap masukkan nama printer terlebih dahulu!';
      return;
    }

    try {
      if (!window.electronAPI?.printReceipt) {
        throw new Error('⚠️ window.electronAPI.printReceipt tidak tersedia!');
      }

      const response = await window.electronAPI.printReceipt(selectedPrinter);
      statusText.innerText = response?.success
        ? '✅ Print berhasil!'
        : `${response?.message || 'Unknown error'}`;
    } catch (error) {
      console.error('Print error:', error);
      statusText.innerText = `⚠️ Print gagal! Error: ${error.message}`;
    }
  }

  async function loadPrinters() {
    const printers = await window.electronAPI.getPrinters();
    const select = document.getElementById('printerSelect');

    select.innerHTML = ''; // Kosongkan dulu dropdown

    if (printers.length === 0) {
      select.innerHTML = "<option value=''>No printers found</option>";
    } else {
      printers.forEach((printer) => {
        const option = document.createElement('option');
        option.value = printer.name;
        option.textContent = printer.name;
        select.appendChild(option);
      });
    }
  }

  loadPrinters();

  testPrintButton.addEventListener('click', printTestReceipt);
});

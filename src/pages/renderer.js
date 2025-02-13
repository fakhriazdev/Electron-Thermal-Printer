document.addEventListener('DOMContentLoaded', async () => {
  const testPrintButton = document.getElementById('printTestBtn');
  const testCashDrawer = document.getElementById('testCashDrawer');

  const statusText = document.getElementById('status');
  const logContainer = document.getElementById('logContainer');
  const printerSelect = document.getElementById('printerSelect');

  // Handler untuk menampilkan log
  if (window.electronAPI?.onLogMessage) {
    window.electronAPI.onLogMessage((message) => {
      const logItem = document.createElement('p');
      logItem.textContent = message;
      logContainer.appendChild(logItem);

      // Auto-scroll ke bawah saat log baru ditambahkan
      logContainer.scrollTop = logContainer.scrollHeight;
    });
  } else {
    console.warn('⚠️ window.electronAPI.onLogMessage tidak tersedia.');
  }

  // Action button TestCashDrawer
  async function testCashDrawerHandler() {
    try {
      if (!window.electronAPI?.openCashDrawer) {
        throw new Error('⚠️ window.electronAPI.openCashDrawer tidak tersedia!');
      }

      const response = await window.electronAPI.openCashDrawer();
      logMessage(
        response?.success
          ? '✅ Cash Drawer terbuka!'
          : `⚠️ ${response?.message || 'Gagal membuka Cash Drawer!'}`,
        response?.success
      );
    } catch (error) {
      console.error('CashDrawer error:', error);
      logMessage(`⚠️ Cash Drawer gagal! Error: ${error.message}`);
    }
  }
  //action button PrintTestReceiot
  async function printTestReceipt() {
    try {
      if (!window.electronAPI?.printReceipt) {
        throw new Error('⚠️ window.electronAPI.printReceipt tidak tersedia!');
      }

      const selectedPrinter = await window.electronAPI.getSavedPrinter();
      if (!selectedPrinter) {
        statusText.innerText = '⚠️ Harap pilih printer terlebih dahulu!';
        return;
      }

      await window.electronAPI.savePrinter(selectedPrinter);

      const response = await window.electronAPI.printReceipt(selectedPrinter);
      statusText.innerText = response?.success
        ? '✅ Print berhasil!'
        : `⚠️ ${response?.message || 'Print gagal!'}`;
    } catch (error) {
      console.error('Print error:', error);
      statusText.innerText = `⚠️ Print gagal! Error: ${error.message}`;
    }
  }

  async function loadPrinters() {
    try {
      if (
        !window.electronAPI?.getPrinters ||
        !window.electronAPI?.getSavedPrinter
      ) {
        throw new Error('⚠️ API Electron tidak tersedia.');
      }

      const printers = await window.electronAPI.getPrinters();
      const savedPrinter = await window.electronAPI.getSavedPrinter();

      printerSelect.innerHTML = ''; // Kosongkan dropdown sebelum diisi ulang

      if (printers.length === 0) {
        printerSelect.innerHTML = "<option value=''>No printers found</option>";
        return;
      }

      printers.forEach((printer) => {
        const option = document.createElement('option');
        option.value = printer.name;
        option.textContent = printer.name;
        printerSelect.appendChild(option);
      });

      // Jadikan printer yang tersimpan sebagai default
      if (savedPrinter && printers.some((p) => p.name === savedPrinter)) {
        printerSelect.value = savedPrinter;
      } else {
        statusText.innerText =
          '⚠️ Printer tersimpan tidak ditemukan. Pilih ulang.';
      }
    } catch (error) {
      console.error('Error loading printers:', error);
      statusText.innerText = `⚠️ Gagal memuat daftar printer!`;
    }
  }

  // Simpan printer yang dipilih ke `env.txt`
  printerSelect.addEventListener('change', async () => {
    const selectedPrinter = printerSelect.value;
    await window.electronAPI.savePrinter(selectedPrinter);
  });

  await loadPrinters();
  testCashDrawer.addEventListener('click', testCashDrawerHandler);
  testPrintButton.addEventListener('click', printTestReceipt);
});

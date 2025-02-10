import { contextBridge, ipcRenderer } from 'electron';
import { setupSecureBridge } from 'electron-secure-pos-printer';

setupSecureBridge(contextBridge, ipcRenderer);

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('dbApi', {
  register: (username: string, password: string) =>
    ipcRenderer.invoke('register-clinician', username, password),
  login: (username: string, password: string) =>
    ipcRenderer.invoke('login-clinician', username, password),
});

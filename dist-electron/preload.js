"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('dbApi', {
    register: (username, password) => electron_1.ipcRenderer.invoke('register-clinician', username, password),
    login: (username, password) => electron_1.ipcRenderer.invoke('login-clinician', username, password),
});

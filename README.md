# FIL-PAT: Filipino Phonological Assessment Tool
## Digital Speech Assessment Platform for UST College of Rehabilitation Sciences

![Version](https://img.shields.io/badge/Version-1.0-blue)
![Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Web-lightgrey)

---

## 🎯 What is FIL-PAT?

**FIL-PAT** (Filipino Phonological Assessment Tool) is a comprehensive platform for speech-language pathologists conducting standardized phonological assessments of Filipino-speaking patients.

### Key Features

- ✨ **70-item standardized assessment** covering all Filipino phonemes
- 🔄 **Real-time synchronization** between clinician and patient devices  
- 🎮 **Kids mode** with 3 engaging themes (Jungle, Space, Ocean)
- 📊 **Automatic scoring** (PCC, PVC, accuracy calculations)
- 📄 **Professional PDF reports** generated instantly
- 💻 **Standalone Windows .exe** - No Node.js required for deployment!
- 🌐 **Multi-device support** via WiFi network
- 🔥 **Automatic firewall configuration** for network access

---

## 📦 Two Deployment Options

### Option 1: Standalone Windows Application (Recommended)

**Build a single .exe file** that includes everything:

```powershell
# Quick build using PowerShell script
.\build-electron.ps1

# Output: release/FIL-PAT-1.0.0-Portable.exe
```

**Features:**
- ✅ No Node.js installation required
- ✅ Automatic Windows Firewall configuration
- ✅ Network-ready for patient devices
- ✅ Portable or installer versions
- ✅ Perfect for clinic deployment

**See: [BUILD_README.md](BUILD_README.md) | [ELECTRON_BUILD_GUIDE.md](ELECTRON_BUILD_GUIDE.md)**

---

### Option 2: Development/Web Mode

**Run as a web application** for development or custom deployment:

```bash
# 1. Install dependencies
npm install

# 2. Run development server (with WebSocket)
npm run fullstack:lan

# 3. Access at http://localhost:3000
```

Patient devices can connect via your local IP address (e.g., `http://192.168.1.100:3000`)

---

## 🚀 Quick Start

### For End Users (Clinics)

1. **Download** the pre-built `FIL-PAT-Portable.exe`
2. **Run as Administrator** (for firewall setup)
3. **Click "Allow access"** when Windows Firewall prompts
4. **App starts** and displays network information
5. **Patient devices connect** via QR code on same WiFi

### For Developers

```bash
# Clone repository
git clone [repository-url]
cd fil-pat

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Start development servers
npm run fullstack:lan

# Build standalone .exe
.\build-electron.ps1
```

---

## 📚 Complete Documentation

| Document | Purpose | Link |
|----------|---------|------|
| **📘 Comprehensive Documentation** | Complete system reference (100 pages) | [View](UST_CRS_COMPREHENSIVE_DOCUMENTATION.md) |
| **🚀 Quick Start Guide** | Get started in 5 minutes | [View](QUICK_START_GUIDE.md) |
| **📋 Clinical Reference Card** | Desktop quick reference | [View](CLINICAL_REFERENCE_CARD.md) |
| **🔬 Research & Academic Guide** | Research protocols & analysis | [View](RESEARCH_ACADEMIC_GUIDE.md) |
| **💻 Electron Build Guide** | Create Windows .exe distribution | [View](ELECTRON_BUILD_GUIDE.md) |
| **📖 Documentation Index** | Navigation hub for all docs | [View](DOCUMENTATION_INDEX.md) |

---

## 🌐 Network Configuration

### How Multi-Device Access Works

```
┌─────────────────────────────────────────────────────────┐
│                    WiFi Network                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐         ┌──────────────────┐    │
│  │ Clinician PC     │         │ Patient Tablet   │    │
│  │ (192.168.1.100)  │◄────────┤ (192.168.1.105)  │    │
│  │                  │ WebSocket│                  │    │
│  │ - FIL-PAT.exe    │         │ - Web Browser    │    │
│  │ - Port 3000      │         │ - Scans QR Code  │    │
│  │ - Port 8080      │         │                  │    │
│  └──────────────────┘         └──────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Automatic Firewall Rules:**
- Port 3000: HTTP Server (Next.js)
- Port 8080: WebSocket Server
- Configured automatically on first run!

---

## 🎓 For Different Users

### **Clinicians** 👩‍⚕️
**Start with:** [Quick Start Guide](QUICK_START_GUIDE.md)  
Learn assessment procedures, scoring, and reporting.

### **IT/Admin** 💻
**Start with:** [Electron Build Guide](ELECTRON_BUILD_GUIDE.md)  
Build and deploy the standalone application.

### **Researchers** 🔬
**Start with:** [Research Guide](RESEARCH_ACADEMIC_GUIDE.md)  
Data collection, analysis, and publishing.

### **Students** 🎓
**Start with:** [Clinical Reference](CLINICAL_REFERENCE_CARD.md)  
Learn Filipino phonology and assessment.

---

## 🔧 Technical Stack

**Frontend:** Next.js 14, React 18, TypeScript, Joy UI  
**Backend:** Node.js, WebSocket (ws), Prisma ORM  
**Desktop:** Electron with automatic firewall configuration  
**Database:** SQLite (bundled in .exe)  
**Real-time:** WebSocket synchronization  

---

## 📊 System Requirements

### For Standalone .exe

**Clinician Computer:**
- Windows 10/11 (64-bit)
- 8GB RAM
- WiFi adapter
- **No Node.js required!**

**Patient Device:**
- Any device with web browser
- Connected to same WiFi network
- Camera (for QR code scanning)

### For Development

- Node.js v18+
- npm v9+
- Windows/Mac/Linux
- 8GB RAM

---

## 🔥 Build Commands

```bash
# Development
npm run dev                    # Standard dev server
npm run fullstack:lan         # Dev with network access
npm run dev:electron:full     # Electron dev mode

# Production Build
npm run build                 # Build Next.js app
npm run build:electron        # Build Electron
npm run dist                  # Package both .exe versions
npm run dist:portable         # Portable .exe only
npm run dist:installer        # NSIS installer only

# Quick Build (PowerShell)
.\build-electron.ps1          # Automated build script

# Database
npm run db:generate           # Generate Prisma client
npm run db:migrate            # Run migrations
npm run db:seed               # Seed with templates
```

---

## 📄 License

**For Educational & Clinical Use**

This software is provided for educational and clinical purposes at the University of Santo Tomas College of Rehabilitation Sciences.

For licensing inquiries: crs@ust.edu.ph

---

## 📞 Contact & Support

**University of Santo Tomas**  
**College of Rehabilitation Sciences**

```
Main Office: (02) 8731-3101
FIL-PAT Support: filpat.support@ust.edu.ph
Support Hours: Mon-Fri 8AM-5PM (PHT)
```

---

## 🏆 Acknowledgments

**Developed for UST College of Rehabilitation Sciences**

- System Architecture & Development
- Clinical Consultation: UST-CRS Faculty
- UX Design: Kids Mode Themes
- Beta Testing: SLP Students & Faculty

---

## 🎉 Getting Started

**For Clinic Deployment:**
1. Read: [BUILD_README.md](BUILD_README.md)
2. Run: `.\build-electron.ps1`
3. Distribute: Copy .exe to clinic computers
4. Deploy: Run as Administrator
5. Done: Start assessing patients!

**For Development:**
1. Clone repository
2. `npm install`
3. `npm run fullstack:lan`
4. Access at `http://localhost:3000`

---

**FIL-PAT: Advancing Evidence-Based Practice in Filipino Speech-Language Pathology** 🇵🇭

**Version 1.0** | December 2, 2025

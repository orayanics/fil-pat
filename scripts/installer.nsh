; Custom NSIS installer script for FIL-PAT
; Automatically adds Windows Firewall rules during installation

!macro customInstall
  ; Add firewall rules for FIL-PAT
  ; These rules allow incoming connections from devices on the same WiFi network
  DetailPrint "Configuring Windows Firewall for network access..."
  
  ; Allow TCP port 3000 (Next.js server) - for patient dashboard access
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="FIL-PAT - HTTP Server" dir=in action=allow protocol=TCP localport=3000 profile=private,domain enable=yes'
  Pop $0
  ${If} $0 == 0
    DetailPrint "✓ HTTP Server firewall rule added (port 3000)"
  ${Else}
    DetailPrint "⚠ Could not add HTTP firewall rule (may need manual configuration)"
  ${EndIf}
  
  ; Allow TCP port 8080 (WebSocket server) - for real-time session communication
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="FIL-PAT - WebSocket Server" dir=in action=allow protocol=TCP localport=8080 profile=private,domain enable=yes'
  Pop $0
  ${If} $0 == 0
    DetailPrint "✓ WebSocket Server firewall rule added (port 8080)"
  ${Else}
    DetailPrint "⚠ Could not add WebSocket firewall rule (may need manual configuration)"
  ${EndIf}
  
  ; Allow the application executable itself
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="FIL-PAT Application" dir=in action=allow program="$INSTDIR\${PRODUCT_NAME}.exe" profile=private,domain enable=yes'
  Pop $0
  ${If} $0 == 0
    DetailPrint "✓ Application firewall rule added"
  ${Else}
    DetailPrint "⚠ Could not add application firewall rule (may need manual configuration)"
  ${EndIf}
  
  DetailPrint "Firewall configuration complete!"
  MessageBox MB_OK "FIL-PAT has been configured to accept connections from other devices on your network.$\r$\n$\r$\nPatient devices on the same WiFi network can now connect to assessment sessions via QR code.$\r$\n$\r$\nNetwork ports opened:$\r$\n  • Port 3000 (HTTP - Patient Dashboard)$\r$\n  • Port 8080 (WebSocket - Real-time Communication)$\r$\n$\r$\nNote: Make sure both devices are on the same WiFi network."
!macroend

!macro customUnInstall
  ; Remove firewall rules during uninstallation
  DetailPrint "Removing Windows Firewall rules..."
  
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="FIL-PAT - HTTP Server"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="FIL-PAT - WebSocket Server"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="FIL-PAT Application"'
  
  DetailPrint "Firewall rules removed"
!macroend

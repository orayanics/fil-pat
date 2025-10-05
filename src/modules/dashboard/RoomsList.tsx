
import { Button, Modal, Box } from "@mui/joy";
import { useState } from "react";
import type { Patient } from "@/models/context";

export default function RoomsList({
  patientList,
  handleJoinRoom,
}: {
  patientList: Record<string, Patient>;
  handleJoinRoom: (patientId: string) => void;
}) {
  const [qrModal, setQrModal] = useState<{ open: boolean; qrData: string | null }>({ open: false, qrData: null });
  const [loadingQr, setLoadingQr] = useState<string | null>(null);

  const isEmpty = Object.values(patientList).length === 0;
  if (isEmpty) return <EmptyList />;

  // Generate QR code for patient and show modal
  const handleShowQr = async (patientId: string) => {
    setLoadingQr(patientId);
    const url = `/patient/${patientId}`;
    try {
      const QRCode = (await import("qrcode")).default;
      const qrDataUri = await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "H",
      });
      setQrModal({ open: true, qrData: qrDataUri });
    } catch {
      setQrModal({ open: true, qrData: null });
    }
    setLoadingQr(null);
  };

  return (
    <>
      {Object.values(patientList).map((p: Patient) => (
        <tr key={p.patientId}>
          <td>{p.patientName}</td>
          <td>{p.patientId}</td>
          <td>
            <Button
              size="sm"
              onClick={() => handleShowQr(p.patientId)}
              sx={{ mr: 1 }}
              disabled={loadingQr === p.patientId}
            >
              {loadingQr === p.patientId ? "Generating..." : "Show QR"}
            </Button>
            <Button
              size="sm"
              variant="soft"
              onClick={() => handleJoinRoom(p.patientId)}
            >
              Join Room
            </Button>
          </td>
        </tr>
      ))}
      <Modal open={qrModal.open} onClose={() => setQrModal({ open: false, qrData: null })}>
        <Box sx={{ p: 4, bgcolor: 'background.body', borderRadius: 2, minWidth: 240, textAlign: 'center' }}>
          {qrModal.qrData ? (
            <img src={qrModal.qrData} alt="Patient QR Code" style={{ width: 200, height: 200 }} />
          ) : (
            <span>Failed to generate QR code.</span>
          )}
        </Box>
      </Modal>
    </>
  );
}

const EmptyList = () => {
  return (
    <tr>
      <td colSpan={3}>No patients found</td>
    </tr>
  );
};

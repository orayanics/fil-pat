import {useParams} from "next/navigation";

import {Box, Button, Alert, Table} from "@mui/joy";
import {usePdfForm} from "./usePdfForm";
import {ExportedSessionData} from "@/models/variables";

export default function SessionPdf() {
  const params = useParams();
  const sessionId = params.id as string;
  const {formData, isSave, savePdf, targetRef} = usePdfForm(sessionId);

  const META_LABEL = [
    {
      label: "Completed Items",
      value: (data: ExportedSessionData) => data.meta.completedItems,
    },
    {
      label: "Total Items",
      value: (data: ExportedSessionData) => data.meta.totalItems,
    },
    {
      label: "Completion Percentage",
      value: (data: ExportedSessionData) =>
        `${data.meta.completionPercentage}%`,
    },
  ];

  if (!formData) {
    return (
      <Alert color="warning" variant="soft">
        No data available for export or the session form is incomplete.
      </Alert>
    );
  }

  return (
    <Box>
      {formData && (
        <Box ref={targetRef}>
          {formData.meta && (
            <Table variant="outlined">
              <thead>
                <tr>
                  <th colSpan={3}>Session Meta</th>
                </tr>
              </thead>
              <tbody>
                {META_LABEL.map((item) => (
                  <tr key={item.label}>
                    <td>
                      <strong>{item.label}</strong>
                    </td>
                    <td colSpan={2}>{item.value(formData)}</td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong>Export At</strong>
                  </td>
                  <td colSpan={2}>{formData.exportedAt}</td>
                </tr>
              </tbody>
            </Table>
          )}

          {formData.session && (
            <Table variant="outlined">
              <thead>
                <tr>
                  <th>IPA</th>
                  <th>Group</th>
                  <th>Child Response</th>
                  <th>Consonants Correct</th>
                  <th>Vowels Correct</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(formData.session).map(([key, value]) => (
                  <tr key={key}>
                    <td>{value.ipa_key}</td>
                    <td>{value.group}</td>
                    <td>{value.childResponse || "N/A"}</td>
                    <td>{value.consonantsCorrect}</td>
                    <td>{value.vowelsCorrect}</td>
                    <td>{value.score}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Box>
      )}
      <Box sx={{mt: 2}}>
        <Button
          variant="solid"
          color="primary"
          onClick={savePdf}
          disabled={!formData || isSave}
        >
          {isSave ? "Saving..." : "Save as PDF"}
        </Button>
      </Box>
    </Box>
  );
}

import React from "react";
import { Card, Input, Table, Textarea, Typography } from "@mui/joy";
import { sampleData } from "@/data/data";

export default function SessionForm() {
  const length = sampleData.length;
  return (
    <Card sx={{ width: "100%", padding: 2 }}>
      <form style={{ overflowY: "auto", maxHeight: "50vh" }}>
        {sampleData.map((item, index) => (
          <Card key={index} style={{ marginBottom: "16px" }}>
            <Typography level="h3">
              No. {index + 1} of {length}
            </Typography>

            <div>
              <Typography fontWeight={800} gutterBottom={false}>
                IPA Transcription
              </Typography>
              <Typography>{item.ipa_key}</Typography>
            </div>

            <div>
              <Typography fontWeight={800} gutterBottom={false}>
                Tugon ng Bata
              </Typography>
              <Typography
                gutterBottom
                level="body-sm"
                sx={{ fontStyle: "italic" }}
              >
                Child&#39;s Response
              </Typography>
              <Textarea minRows={2} placeholder="Type here" />
            </div>

            <Table>
              <thead>
                <tr>
                  <th colSpan={2}>Consonants</th>
                  <th colSpan={2}>Vowels</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={1}>Correct</td>
                  <td colSpan={1}>Total</td>
                  <td colSpan={1}>Correct</td>
                  <td colSpan={1}>Total</td>
                  <td>Score</td>
                </tr>
                <tr>
                  <td colSpan={1}>
                    <Input type="number" />
                  </td>
                  <td colSpan={1}>{item.consonants}</td>
                  <td colSpan={1}>
                    <Input type="number" />
                  </td>
                  <td colSpan={1}>{item.vowel}</td>
                  <td>
                    <Input type="number" />
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card>
        ))}
      </form>
    </Card>
  );
}

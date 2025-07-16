import { Box, Checkbox, Sheet, Table as TableM } from "@mui/joy";

// id, name, date, link
const rows = [
  { id: 1, name: "John Doe", date: "2023-10-01", link: "https://example.com" },
  {
    id: 2,
    name: "Jane Smith",
    date: "2023-10-02",
    link: "https://example.com",
  },
  {
    id: 3,
    name: "Alice Johnson",
    date: "2023-10-03",
    link: "https://example.com",
  },
  { id: 4, name: "Bob Brown", date: "2023-10-04", link: "https://example.com" },
];
export default function Table() {
  return (
    <Box>
      <Sheet
        variant="outlined"
        sx={{ width: "100%", overflow: "auto", borderRadius: "sm", padding: 2 }}
      >
        <TableM aria-label="User Table">
          <thead>
            <tr>
              {/* checkbox */}
              <th style={{ width: "min-content" }}>
                <Checkbox />
              </th>
              <th style={{ width: "min-content" }}>ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>Link</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <Checkbox />
                </td>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.date}</td>
                <td>
                  <a href={row.link} target="_blank" rel="noopener noreferrer">
                    {row.link}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </TableM>
      </Sheet>
    </Box>
  );
}

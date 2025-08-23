import {
  Card,
  Chip,
  Table,
  Textarea,
  Typography,
  Box,
  Dropdown,
  Menu,
  MenuItem,
  MenuButton,
} from "@mui/joy";
import Ipa from "@/components/Keyboard/Ipa";

import useData from "../useData";
import {useSessionForm} from "./useForm";
import {useSocketContext} from "@/context/SocketProvider";
import {useEffect} from "react";

export default function SessionForm() {
  const {
    socket,
    sessionId,
    currentItem,
    updateCurrentItem,
    saveSessionManually,
  } = useSocketContext();
  const {item, length} = useData({
    socket,
    sessionId,
    currentItem,
    updateCurrentItem,
  });

  const currentData = currentItem?.item || item;
  const {item: itemNumber, ipa_key, consonants, vowel} = currentData || {};

  const {
    formData,
    hasData,
    updateChildResponse,
    updateConsonantsCorrect,
    updateVowelsCorrect,
    updateScore,
    calculateScore,
  } = useSessionForm(itemNumber);

  // save session data to localstorage before unload
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      saveSessionManually();

      // before leave, alert dialog
      if (hasData) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [saveSessionManually, hasData]);

  const handleIpaSymbolInsert = (symbol: string) => {
    updateChildResponse(formData.childResponse + symbol);
  };

  const handleTextareaChange = (value: string) => {
    updateChildResponse(value);
  };

  const handleScoring = (count: number, type: string) => {
    let newScore = 0;
    if (type === "consonant") {
      updateConsonantsCorrect(count);
      newScore = calculateScore(
        count,
        consonants || 0,
        formData.vowelsCorrect,
        vowel || 0
      );
    } else {
      updateVowelsCorrect(count);
      newScore = calculateScore(
        formData.consonantsCorrect,
        consonants || 0,
        count,
        vowel || 0
      );
    }

    updateScore(newScore);
  };

  return (
    <Card sx={{width: "100%", padding: 2}}>
      <form style={{overflowY: "auto"}}>
        <Card>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <Typography level="h3">
              No. {itemNumber} of {length}
            </Typography>
            <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
              {hasData && (
                <Chip variant="soft" color="success">
                  Item Saved
                </Chip>
              )}
            </Box>
          </Box>

          <div>
            <Typography fontWeight={800} gutterBottom={false}>
              IPA Transcription
            </Typography>
            <Typography>{ipa_key}</Typography>
          </div>

          <div>
            <Typography fontWeight={800} gutterBottom={false}>
              Tugon ng Bata
            </Typography>
            <Typography gutterBottom level="body-sm" sx={{fontStyle: "italic"}}>
              Child&#39;s Response
            </Typography>
            <Box sx={{marginBottom: 2}}>
              <Textarea
                minRows={2}
                placeholder="If IPA characters do not show please correct fonts such as Charis SIL and Doulos SIL."
                value={formData.childResponse}
                onChange={(e) => handleTextareaChange(e.target.value)}
                sx={{
                  fontFamily: "Charis SIL, Doulos SIL, Times New Roman, serif",
                }}
              />
              <Ipa
                onSymbolSelect={handleIpaSymbolInsert}
                inputValue={formData.childResponse}
                onInputChange={handleTextareaChange}
                showOutput={false}
              />
            </Box>
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
                  <Dropdown>
                    <MenuButton
                      sx={{
                        justifyContent: "center",
                        minHeight: "40px",
                        fontSize: "md",
                        fontWeight: "bold",
                      }}
                    >
                      {formData.consonantsCorrect}
                    </MenuButton>
                    <Menu
                      sx={{
                        maxHeight: "180px",
                        overflow: "auto",
                        display: "grid",
                        gap: 0.5,
                        padding: 1,
                        "& .MuiMenuItem-root": {
                          borderRadius: "sm",
                        },
                      }}
                    >
                      {Array.from(
                        {length: consonants || 0},
                        (_, i) => i + 1
                      ).map((num) => (
                        <MenuItem
                          key={num}
                          selected={num === formData.consonantsCorrect}
                          onClick={() => handleScoring(num, "consonant")}
                          sx={{
                            backgroundColor: "primary",
                            color: "primary",
                            minHeight: "32px",
                          }}
                        >
                          {num}
                        </MenuItem>
                      ))}
                    </Menu>
                  </Dropdown>
                </td>
                <td colSpan={1}>{consonants || 0}</td>
                <td colSpan={1}>
                  <Dropdown>
                    <MenuButton
                      sx={{
                        justifyContent: "center",
                        minHeight: "40px",
                        fontSize: "md",
                        fontWeight: "bold",
                      }}
                    >
                      {formData.vowelsCorrect}
                    </MenuButton>
                    <Menu
                      sx={{
                        maxHeight: "180px",
                        overflow: "auto",
                        display: "grid",
                        gap: 0.5,
                        padding: 1,
                        "& .MuiMenuItem-root": {
                          borderRadius: "sm",
                        },
                      }}
                    >
                      {Array.from({length: vowel || 0}, (_, i) => i + 1).map(
                        (num) => (
                          <MenuItem
                            key={num}
                            selected={num === formData.vowelsCorrect}
                            onClick={() => handleScoring(num, "vowel")}
                            sx={{
                              backgroundColor: "primary",
                              color: "primary",
                              minHeight: "32px",
                            }}
                          >
                            {num}
                          </MenuItem>
                        )
                      )}
                    </Menu>
                  </Dropdown>
                </td>
                <td colSpan={1}>{vowel || 0}</td>
                <td>
                  <Typography>{formData.score}</Typography>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card>
      </form>
    </Card>
  );
}

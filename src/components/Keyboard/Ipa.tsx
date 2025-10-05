import {useState} from "react";
import {Box, Button, Typography, Sheet, IconButton} from "@mui/joy";
import KeyboardIcon from "@mui/icons-material/Keyboard";
import CloseIcon from "@mui/icons-material/Close";

const IPA_SYMBOLS = {
  consonants: [
    ["p", "b", "t", "d", "ʈ", "ɖ", "c", "ɟ", "k", "ɡ", "q", "ɢ", "ʔ"],
    ["m", "ɱ", "n", "ɳ", "ɲ", "ŋ", "ɴ"],
    ["ʙ", "r", "ʀ"],
    ["ⱱ", "ɾ", "ɽ"],
    [
      "ɸ",
      "β",
      "f",
      "v",
      "θ",
      "ð",
      "s",
      "z",
      "ʃ",
      "ʒ",
      "ʂ",
      "ʐ",
      "ç",
      "ʝ",
      "x",
      "ɣ",
      "χ",
      "ʁ",
      "ħ",
      "ʕ",
      "h",
      "ɦ",
    ],
    ["ɬ", "ɮ"],
    ["ʋ", "ɹ", "ɻ", "j", "ɰ"],
    ["l", "ɭ", "ʎ", "ʟ"],
    ["ʍ", "w", "ɥ", "ʜ", "ʢ", "ʡ", "ɕ", "ʑ", "ɺ", "ɧ"],
  ],
  vowels: [
    ["i", "y", "ɨ", "ʉ", "ɯ", "u"],
    ["ɪ", "ʏ", "ɪ̈", "ʊ̈", "ɯ̽", "ʊ"],
    ["e", "ø", "ɘ", "ɵ", "ɤ", "o"],
    ["e̞", "ø̞", "ə", "ɤ̞", "o̞"],
    ["ɛ", "œ", "ɜ", "ɞ", "ʌ", "ɔ"],
    ["æ", "ɐ"],
    ["a", "ɶ", "ä", "ɑ", "ɒ"],
  ],
  diacritics: [
    ["◌̥", "◌̊", "◌̤", "◌̰", "◌̼", "◌̺", "◌̻", "◌̹", "◌̜", "◌̟", "◌̠"],
    ["◌̈", "◌̽", "◌̩", "◌̯", "◌˞", "◌̃", "◌ⁿ", "◌ˡ", "◌̚"],
    ["◌́", "◌̀", "◌̂", "◌̌", "◌̄", "◌̆", "◌̋", "◌̏"],
  ],
  suprasegmentals: [
    ["ˈ", "ˌ", "ː", "ˑ", "̆"],
    ["˥", "˦", "˧", "˨", "˩", "˦˥", "˨˦", "˦˨", "˩˨"],
    ["↗", "↘", "↑", "↓", "→"],
  ],
} as const;

type TabType = keyof typeof IPA_SYMBOLS;

interface IpaProps {
  onSymbolSelect?: (symbol: string) => void;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  showOutput?: boolean;
}

function SymbolButton({
  symbol,
  onClick,
}: {
  symbol: string;
  onClick: (symbol: string) => void;
}) {
  return (
    <Button
      variant="outlined"
      size="sm"
      onClick={() => onClick(symbol)}
      sx={{
        minWidth: "40px",
        height: "40px",
        fontFamily: "Charis SIL, Doulos SIL, Times New Roman, serif",
        fontSize: "md",
        padding: 0,
      }}
    >
      {symbol}
    </Button>
  );
}

function SymbolGrid({
  symbols,
  onSymbolClick,
}: {
  symbols: readonly (readonly string[])[];
  onSymbolClick: (symbol: string) => void;
}) {
  return (
    <Box sx={{maxHeight: "400px", overflow: "auto"}}>
      {symbols.map((row, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            marginBottom: 1,
          }}
        >
          {row.map((symbol, symbolIndex) => (
            <SymbolButton
              key={`${rowIndex}-${symbolIndex}`}
              symbol={symbol}
              onClick={onSymbolClick}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}

function TabNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  const tabs = [
    {key: "consonants" as const, label: "Consonants"},
    {key: "vowels" as const, label: "Vowels"},
    {key: "diacritics" as const, label: "Diacritics"},
    {key: "suprasegmentals" as const, label: "Suprasegmentals"},
  ];

  return (
    <Box sx={{marginBottom: 3}}>
      <Box sx={{display: "flex", gap: 1, flexWrap: "wrap"}}>
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "solid" : "outlined"}
            size="sm"
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}

function OutputDisplay({
  text,
  onClear,
  onCopy,
}: {
  text: string;
  onClear: () => void;
  onCopy: () => void;
}) {
  return (
    <Box sx={{marginBottom: 3}}>
      <Typography level="body-sm" sx={{marginBottom: 1}}>
        Output:
      </Typography>
      <Sheet
        variant="soft"
        sx={{
          padding: 2,
          minHeight: "60px",
          borderRadius: "sm",
          fontSize: "lg",
          fontFamily: "Charis SIL, Doulos SIL, Times New Roman, serif",
          wordBreak: "break-all",
          overflowWrap: "break-word",
        }}
      >
        {text || "Click symbols to add them here..."}
      </Sheet>
      <Box sx={{display: "flex", gap: 1, marginTop: 1}}>
        <Button size="sm" variant="soft" onClick={onClear}>
          Clear
        </Button>
        <Button size="sm" variant="soft" onClick={onCopy}>
          Copy
        </Button>
      </Box>
    </Box>
  );
}

function Ipa({
  onSymbolSelect,
  inputValue,
  onInputChange,
  showOutput = true,
}: IpaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("consonants");
  const [internalText, setInternalText] = useState("");

  const currentText = inputValue !== undefined ? inputValue : internalText;

  const handleSymbolClick = (symbol: string) => {
    if (onSymbolSelect) {
      onSymbolSelect(symbol);
    } else {
      const newValue = currentText + symbol;
      setInternalText(newValue);
      onInputChange?.(newValue);
    }
  };

  const handleClear = () => {
    if (onInputChange) {
      onInputChange("");
    } else {
      setInternalText("");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
  };

  const toggleKeyboard = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box>
      <Button
        variant="outlined"
        startDecorator={<KeyboardIcon />}
        onClick={toggleKeyboard}
        sx={{my: 2}}
      >
        {isOpen ? "Hide" : "Show"} IPA Keyboard
      </Button>

      {isOpen && (
        <Sheet
          variant="outlined"
          sx={{
            padding: 3,
            borderRadius: "md",
            position: "relative",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Typography level="h4">IPA Keyboard</Typography>
            <IconButton variant="plain" onClick={toggleKeyboard} size="sm">
              <CloseIcon />
            </IconButton>
          </Box>

          {showOutput && (
            <OutputDisplay
              text={currentText}
              onClear={handleClear}
              onCopy={handleCopy}
            />
          )}

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <SymbolGrid
            symbols={IPA_SYMBOLS[activeTab]}
            onSymbolClick={handleSymbolClick}
          />
        </Sheet>
      )}
    </Box>
  );
}

export default Ipa;

"use client";

import React, { useState } from "react";
import { useRouter } from 'next/navigation';
import { Box, Button, Typography, Input, Switch, Textarea, IconButton, Divider, Grid, Sheet, Tooltip } from "@mui/joy";
import AlertSuccess from '@/components/Alert/AlertSuccess';
import AlertError from '@/components/Alert/AlertError';
import { useSocketStore } from "@/context/socketStore";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

type TemplateItem = {
  question: string;
  sound: string;
  ipa_key: string;
  group: string;
  consonants: number;
  vowel: number;
  image: string;
  item_number?: number;
};

type SessionItemInput = {
  question?: string;
  sound?: string;
  ipa_key?: string;
  consonant_group?: string;
  consonants_count?: number;
  vowels_count?: number;
  image_url?: string;
  item_number?: number;
};

type TemplateInput = {
  template_id?: number;
  name?: string;
  description?: string;
  is_for_kids?: boolean;
  difficulty_level?: string;
  estimated_duration_minutes?: number;
  session_items?: SessionItemInput[];
};

interface TemplateMakerProps {
  template?: TemplateInput;
}

export default function TemplateMaker({ template }: TemplateMakerProps) {
  const router = useRouter();

  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [isForKids, setIsForKids] = useState<boolean>(template?.is_for_kids ?? false);
  const [difficulty, setDifficulty] = useState<string>(template?.difficulty_level ?? "Standard");
  const [estimatedDuration, setEstimatedDuration] = useState<number | "">(template?.estimated_duration_minutes ?? "");
  const [message, setMessage] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const user = useSocketStore((state) => state.user);
  const [items, setItems] = useState<TemplateItem[]>(
    template?.session_items?.length ? template.session_items.map((it: SessionItemInput) => ({
      question: it.question || '',
      sound: it.sound || '',
      ipa_key: it.ipa_key || '',
      group: it.consonant_group || '',
      consonants: it.consonants_count ?? 0,
      vowel: it.vowels_count ?? 0,
      image: it.image_url || '',
      item_number: it.item_number
    })) : [{ question: "", sound: "", ipa_key: "", group: "", consonants: 0, vowel: 0, image: "" }]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    if (!user) {
      setErrorMsg("You must be logged in to create a template.");
      return;
    }
    if (!items.length || items.some(item => !item.question)) {
      setErrorMsg("Each template must have at least one item/question, and all questions must be filled.");
      return;
    }
    try {
      const payload: {
        name: string;
        description: string;
        is_for_kids: boolean;
        difficulty_level: string;
        items: TemplateItem[];
        estimated_duration_minutes?: number;
      } = {
        name,
        description,
        is_for_kids: isForKids,
        difficulty_level: difficulty,
        items,
      };
      if (typeof estimatedDuration === "number" && !isNaN(estimatedDuration)) {
        payload.estimated_duration_minutes = estimatedDuration;
      }
      const url = template ? `/api/templates/${template.template_id}` : '/api/templates';
      const method = template ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (res.ok) {
        const successText = template ? 'Template updated successfully!' : "Template created successfully!";
        setMessage(successText);
        setSuccessOpen(true);
        // On create, clear the form. On update, keep fields and show success then navigate back to list.
        if (!template) {
          setName("");
          setDescription("");
          setIsForKids(false);
          setDifficulty("Standard");
          setEstimatedDuration("");
          setItems([{ question: "", sound: "", ipa_key: "", group: "", consonants: 0, vowel: 0, image: "" }]);
        } else {
          // small delay then redirect to templates list so the user sees update message
          setTimeout(() => router.push('/clinician-dashboard/templates'), 900);
        }
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Failed to create template.");
      }
    } catch {
      setErrorMsg("Error connecting to server.");
    }
  };

  const handleItemChange = <K extends keyof TemplateItem>(idx: number, field: K, value: TemplateItem[K]) => {
    setItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleImageFile = (idx: number, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string | null;
      if (result) {
        // store base64 data URL in item.image
        handleItemChange(idx, 'image', result);
      }
    };
    reader.readAsDataURL(file);
  };
  const handleAddItem = () => {
    setItems(items => [...items, { question: "", sound: "", ipa_key: "", group: "", consonants: 0, vowel: 0, image: "" }]);
  };
  const handleRemoveItem = (idx: number) => {
    setItems(items => items.length > 1 ? items.filter((_, i) => i !== idx) : items);
  };

  return (
    <Box sx={{ flex: 1, p: { xs: 1, sm: 3 }, maxWidth: 1000, mx: 'auto', width: '100%', minHeight: '100vh' }}>
      <Sheet sx={{ p: { xs: 2, sm: 4 }, borderRadius: 4, boxShadow: 3, bgcolor: 'background.surface', mt: 3 }}>
          <Typography level="h2" sx={{ mb: 1, fontWeight: 700 }}>{template ? 'Edit Assessment Template' : 'Create Assessment Template'}</Typography>
          <Typography level="body-md" sx={{ mb: 1, color: 'neutral.600' }}>
            {template ? 'Update your assessment template details and items below.' : 'Create a new template for your speech assessments. Add items (questions) that will be shown to patients during sessions.'}
          </Typography>
          <Typography level="body-sm" sx={{ mb: 3, color: 'primary.500', fontWeight: 600 }}>
            Tip: Only the question field is required. Other fields help with analysis but are optional.
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.200' }}>
              <Typography level="title-lg" sx={{ mb: 2, color: 'primary.700' }}>Template Information</Typography>
              <Grid container spacing={2}>
                <Grid xs={12} sm={8}>
                  <Typography level="title-sm" sx={{ mb: 0.5 }}>Template Name *</Typography>
                  <Tooltip title="Give your template a clear, descriptive name (e.g., 'Filipino PAT - Kids Edition')" arrow placement="top">
                    <Input fullWidth required placeholder="e.g., Filipino Phonological Assessment" value={name} onChange={e => setName(e.target.value)} />
                  </Tooltip>
                </Grid>
                <Grid xs={12} sm={4}>
                  <Typography level="title-sm" sx={{ mb: 0.5 }}>Difficulty Level *</Typography>
                  <Tooltip title="Indicate the complexity level (e.g., Easy, Standard, Advanced)" arrow placement="top">
                    <Input fullWidth required placeholder="e.g., Standard" value={difficulty} onChange={e => setDifficulty(e.target.value)} />
                  </Tooltip>
                </Grid>
                <Grid xs={12}>
                  <Typography level="title-sm" sx={{ mb: 0.5 }}>Description (Optional)</Typography>
                  <Textarea minRows={2} placeholder="Describe what this template assesses and when to use it..." value={description} onChange={e => setDescription(e.target.value)} />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography level="title-sm">Is this for kids?</Typography>
                    <Tooltip title="Enable child-friendly language and visuals" arrow>
                      <Switch checked={isForKids} onChange={e => setIsForKids(e.target.checked)} />
                    </Tooltip>
                  </Box>
                </Grid>
                <Grid xs={12} sm={6}>
                  <Typography level="title-sm" sx={{ mb: 0.5 }}>Estimated Duration (minutes, optional)</Typography>
                  <Input type="number" fullWidth placeholder="e.g., 30" value={estimatedDuration} onChange={e => setEstimatedDuration(e.target.value === "" ? "" : Number(e.target.value))} />
                </Grid>
              </Grid>
            </Box>
            <Divider sx={{ my: 3 }}>
              <Typography level="title-lg" sx={{ px: 2 }}>Assessment Items</Typography>
            </Divider>
            <Typography level="body-sm" sx={{ mb: 2, color: 'neutral.600', textAlign: 'center' }}>
              Add the questions or prompts you&apos;ll use in sessions. The question field is required, other fields help with detailed analysis.
            </Typography>
            {items.map((item, idx) => (
              <Sheet key={idx} sx={{ mb: 3, p: 3, border: '2px solid', borderColor: 'primary.200', borderRadius: 3, bgcolor: 'background.level1', position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography level="title-lg" sx={{ flex: 1, color: 'primary.700' }}>Item #{idx + 1}</Typography>
                  <Tooltip title="Remove this item" arrow>
                    <span>
                      <IconButton size="sm" color="danger" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <Typography level="title-md" sx={{ mb: 0.5, fontWeight: 600 }}>Question / Prompt *</Typography>
                    <Tooltip title="The main question or instruction the patient will see" arrow placement="top">
                      <Textarea required minRows={2} placeholder="e.g., Sabihin ang 'pusa'" value={item.question} onChange={e => handleItemChange(idx, "question", e.target.value)} sx={{ mb: 1, width: '100%' }} />
                    </Tooltip>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography level="title-sm" sx={{ mb: 0.5 }}>Target Sound (Optional)</Typography>
                    <Tooltip title="The specific sound being assessed (e.g., /p/, /k/)" arrow placement="top">
                      <Input fullWidth placeholder="e.g., /p/" value={item.sound} onChange={e => handleItemChange(idx, "sound", e.target.value)} sx={{ mb: 1 }} />
                    </Tooltip>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography level="title-sm" sx={{ mb: 0.5 }}>IPA Notation (Optional)</Typography>
                    <Tooltip title="International Phonetic Alphabet representation" arrow placement="top">
                      <Input fullWidth placeholder="e.g., /pusa/" value={item.ipa_key} onChange={e => handleItemChange(idx, "ipa_key", e.target.value)} sx={{ mb: 1 }} />
                    </Tooltip>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <Typography level="title-sm" sx={{ mb: 0.5 }}>Sound Group (Optional)</Typography>
                    <Tooltip title="Category of sound (e.g., stops, fricatives, nasals)" arrow placement="top">
                      <Input fullWidth placeholder="e.g., stops" value={item.group} onChange={e => handleItemChange(idx, "group", e.target.value)} sx={{ mb: 1 }} />
                    </Tooltip>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <Typography level="title-sm" sx={{ mb: 0.5 }}>Consonants Count</Typography>
                    <Input type="number" fullWidth placeholder="0" value={item.consonants} onChange={e => handleItemChange(idx, "consonants", Number(e.target.value))} sx={{ mb: 1 }} />
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <Typography level="title-sm" sx={{ mb: 0.5 }}>Vowels Count</Typography>
                    <Input type="number" fullWidth placeholder="0" value={item.vowel} onChange={e => handleItemChange(idx, "vowel", Number(e.target.value))} sx={{ mb: 1 }} />
                  </Grid>
                  <Grid xs={12}>
                    <Typography level="title-sm" sx={{ mb: 0.5 }}>Image (Optional)</Typography>
                    <Typography level="body-xs" sx={{ mb: 1, color: 'neutral.500' }}>
                      Paste an image URL or upload a file. Visual aids help patients understand the task.
                    </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Input fullWidth placeholder="Paste image URL here" value={item.image} onChange={e => handleItemChange(idx, "image", e.target.value)} sx={{ mb: 1, minWidth: '200px', flex: 1 }} />
                        <input
                          id={`template-item-image-${idx}`}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files ? e.target.files[0] : undefined;
                            if (file) handleImageFile(idx, file);
                          }}
                        />
                        <label htmlFor={`template-item-image-${idx}`}>
                          <Button component="span" size="sm" variant="outlined">Upload Image</Button>
                        </label>
                        {item.image ? (
                          <Button size="sm" color="danger" variant="outlined" onClick={() => handleItemChange(idx, 'image', '')}>Clear Image</Button>
                        ) : null}
                      </Box>
                      {item.image ? (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'neutral.50', borderRadius: 2, border: '1px solid', borderColor: 'neutral.200' }}>
                          <Typography level="body-xs" sx={{ mb: 1, color: 'neutral.600' }}>Preview:</Typography>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.image} alt={`item-${idx}-preview`} style={{ maxHeight: 150, maxWidth: '100%', borderRadius: 8, display: 'block' }} />
                        </Box>
                      ) : null}
                  </Grid>
                </Grid>
              </Sheet>
            ))}<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button type="button" variant="soft" color="primary" onClick={handleAddItem} startDecorator={<AddCircleOutlineIcon />} size="lg" sx={{ borderRadius: 2 }}>
                Add Another Item
              </Button>
              <Typography level="body-xs" sx={{ textAlign: 'center', color: 'neutral.500' }}>
                Current items: {items.length}
              </Typography>
            </Box>
            <Button type="submit" fullWidth size="lg" variant="solid" sx={{ mt: 3, py: 1.5 }}>{template ? 'Update Template' : 'Create Template'}</Button>
          </form>
          {message && <Typography color={message.includes("success") ? "success" : "neutral"} mt={3}>{message}</Typography>}
        </Sheet>
      <AlertSuccess isOpen={successOpen} message={message} onClose={() => setSuccessOpen(false)} />
      <AlertError isOpen={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
    </Box>
  );
}

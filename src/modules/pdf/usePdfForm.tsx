"use client";
import {useState, useEffect, useCallback} from "react";
import {Margin, usePDF} from "react-to-pdf";

import {ExportedSessionData} from "@/models/variables";

export function usePdfForm(sessionId: string) {
  const [isSave, setIsSave] = useState(false);
  const [formData, setFormData] = useState<ExportedSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState(`session_${sessionId}.pdf`);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [downloadMessage, setDownloadMessage] = useState('');

  const {toPDF, targetRef} = usePDF({
    filename: `session_${sessionId}.pdf`,
    page: {margin: Margin.MEDIUM, format: "letter", orientation: "portrait"},
  });

  const buildPdfFilename = useCallback((data: ExportedSessionData | null) => {
    const safe = (value?: string | null) =>
      value
        ? value
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/gi, "_")
            .replace(/^_+|_+$/g, "")
        : undefined;

    if (!data) {
      return `session_${sessionId}.pdf`;
    }

    const lastName = safe(data.patientInfo?.last_name);
    const sessionName = safe(data.sessionInfo?.session_name);
    const sessionUuid = safe(data.sessionInfo?.session_uuid || sessionId);
    const dateStamp = new Date().toISOString().split('T')[0];

    if (lastName && sessionName) {
      return `${lastName}_${sessionName}.pdf`;
    }

    if (sessionUuid) {
      return `${lastName ? `${lastName}_` : ""}${sessionUuid}_${dateStamp}.pdf`;
    }

    return `session_${sessionId}_${dateStamp}.pdf`;
  }, [sessionId]);

  const resetDownloadStatus = useCallback(() => {
    setDownloadStatus('idle');
    setDownloadMessage('');
  }, []);

  const savePdf = async () => {
    try {
      setIsSave(true);
      resetDownloadStatus();
      await toPDF({ filename: pdfFilename });
      setDownloadStatus('success');
      setDownloadMessage(`PDF saved as ${pdfFilename}`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setDownloadStatus('error');
      setDownloadMessage('Failed to generate PDF. Please try again.');
    } finally {
      setIsSave(false);
    }
  };

  // Fetch session data from database
  useEffect(() => {
    if (!sessionId) return;

    const fetchSessionData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sessions/${sessionId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch session: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('[PDF] Session API response:', data);
        console.log('[PDF] Items with responses:', data.items.map((item: any) => ({
          item_id: item.item_id,
          item_number: item.item_number,
          has_response: !!item.response,
          response_text: item.response?.response_text,
          consonants_correct: item.response?.consonants_correct,
          vowels_correct: item.response?.vowels_correct
        })));
        
        // Transform API data to match ExportedSessionData format
        const transformedData: ExportedSessionData = {
          session: data.items.reduce((acc: any, item: any) => {
            // Use actual consonants_correct and vowels_correct from response if available
            // Otherwise fall back to 0
            const consonantsCorrect = item.response?.consonants_correct ?? 0;
            const vowelsCorrect = item.response?.vowels_correct ?? 0;
            
            acc[item.item_number] = {
              target_word: item.target_word || '',
              ipa_key: item.ipa_key || '',
              group: item.consonant_group || '',
              childResponse: item.response?.response_text || '',
              consonantsCorrect,
              vowelsCorrect,
              consonantsCount: item.consonants_count || 0,
              vowelsCount: item.vowels_count || 0,
              score: item.response?.score || 0,
              clinicianNotes: item.response?.clinician_notes || '',
              timeTaken: item.response?.time_taken_seconds || null,
            };
            return acc;
          }, {}),
          meta: {
            totalItems: data.meta.totalItems,
            completedItems: data.meta.completedItems,
            completionPercentage: data.meta.completionPercentage,
          },
          exportedAt: new Date().toISOString(),
          sessionInfo: data.session,
          patientInfo: data.patient,
          clinicianInfo: data.clinician,
          templateInfo: data.template,
        };
        
        setFormData(transformedData);
        setPdfFilename(buildPdfFilename(transformedData));
        setError(null);
      } catch (err) {
        console.error("Failed to fetch session data:", err);
        setError(err instanceof Error ? err.message : "Failed to load session data");
        setFormData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, buildPdfFilename]);

  return {
    formData,
    loading,
    error,

    // pdf
    toPDF,
    targetRef,
    savePdf,
    pdfFilename,
    downloadStatus,
    downloadMessage,
    resetDownloadStatus,

    // states
    isSave,
  };
}

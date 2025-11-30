"use client";
import {useState, useEffect} from "react";
import {Margin, usePDF} from "react-to-pdf";

import {ExportedSessionData} from "@/models/variables";

export function usePdfForm(sessionId: string) {
  const [isSave, setIsSave] = useState(false);
  const [formData, setFormData] = useState<ExportedSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {toPDF, targetRef} = usePDF({
    filename: `session_${sessionId}.pdf`,
    page: {margin: Margin.MEDIUM, format: "letter", orientation: "portrait"},
  });

  const savePdf = () => {
    try {
      setIsSave(true);
      toPDF();
    } catch (error) {
      console.error("Error generating PDF:", error);
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
        
        // Transform API data to match ExportedSessionData format
        const transformedData: ExportedSessionData = {
          session: data.items.reduce((acc: any, item: any) => {
            // Use actual consonants_correct and vowels_correct from response if available
            // Otherwise fall back to 0
            const consonantsCorrect = item.response?.consonants_correct ?? 0;
            const vowelsCorrect = item.response?.vowels_correct ?? 0;
            
            acc[item.item_number] = {
              ipa_key: item.ipa_key || '',
              group: item.consonant_group || '',
              childResponse: item.response?.response_text || '',
              consonantsCorrect,
              vowelsCorrect,
              score: item.response?.score || 0,
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
        };
        
        setFormData(transformedData);
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
  }, [sessionId]);

  return {
    formData,
    loading,
    error,

    // pdf
    toPDF,
    targetRef,
    savePdf,

    // states
    isSave,
  };
}

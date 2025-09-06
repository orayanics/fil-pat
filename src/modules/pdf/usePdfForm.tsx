"use client";
import {useState, useEffect} from "react";
import {Margin, usePDF} from "react-to-pdf";

import {sampleData} from "@/data/data";
import {ExportedSessionData} from "@/models/variables";

export function usePdfForm(sessionId: string) {
  const [isSave, setIsSave] = useState(false);

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

  // helper function to get formdata from localstorage with session id
  const getFormDataFromLocalStorage = (sessionId: string) => {
    try {
      const localData = localStorage.getItem(`session_${sessionId}_formData`);
      const parsedData = localData ? JSON.parse(localData) : null;

      // get total items from localData
      const totalItems = sampleData.length;
      // count parsedData object
      const completedItems = parsedData ? Object.keys(parsedData).length : 0;

      const meta = {
        totalItems,
        completedItems,
        completionPercentage:
          totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      };

      if (localData) {
        return {
          session: parsedData,
          meta,
          exportedAt: new Date().toISOString(),
        };
      }
    } catch {
      console.error("Failed to parse PDF form data from localStorage");
    }

    return null;
  };

  const [formData, setFormData] = useState<ExportedSessionData | null>(null);

  useEffect(() => {
    setFormData(getFormDataFromLocalStorage(sessionId));
  }, [sessionId]);

  return {
    formData,

    // pdf
    toPDF,
    targetRef,
    savePdf,

    // states
    isSave,

    getFormDataFromLocalStorage,
  };
}

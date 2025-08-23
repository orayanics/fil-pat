import {useState, useEffect, useCallback} from "react";
import {useSocketContext} from "@/context/SocketProvider";

export interface ItemFormData {
  childResponse: string;
  consonantsCorrect: number;
  vowelsCorrect: number;
  score: number;
}

const createDefaultFormData = (): ItemFormData => ({
  childResponse: "",
  consonantsCorrect: 0,
  vowelsCorrect: 0,
  score: 0,
});

export function useSessionForm(currentItemId?: number) {
  const {formData: contextFormData, updateFormData: updateContextFormData} =
    useSocketContext();
  const [formDataMap, setFormDataMap] = useState<Map<number, ItemFormData>>(
    new Map()
  );

  // sync: formdata from context to localstorage
  // this happens on mount and when formdata from context changes
  // parse item huahua
  useEffect(() => {
    if (contextFormData && typeof contextFormData === "object") {
      const newMap = new Map<number, ItemFormData>();

      Object.entries(contextFormData).forEach(([key, value]) => {
        const itemId = parseInt(key);
        if (!isNaN(itemId) && value && typeof value === "object") {
          const itemData = value as ItemFormData;
          newMap.set(itemId, itemData);
        }
      });

      setFormDataMap(newMap);
    }
  }, [contextFormData]);

  function getCurrentFormData(): ItemFormData {
    if (!currentItemId) return createDefaultFormData();
    return formDataMap.get(currentItemId) || createDefaultFormData();
  }

  const data = getCurrentFormData();
  const hasData = Boolean(
    data.childResponse ||
      data.consonantsCorrect > 0 ||
      data.vowelsCorrect > 0 ||
      data.score > 0
  );

  const updateFormData = useCallback(
    (field: keyof ItemFormData, value: string | number) => {
      if (!currentItemId) return;

      setFormDataMap((prev) => {
        const newMap = new Map(prev);
        const currentData =
          newMap.get(currentItemId) || createDefaultFormData();

        const updatedData = {...currentData};
        if (field === "childResponse") {
          updatedData[field] = String(value);
        } else {
          updatedData[field] = Number(value) || 0;
        }

        newMap.set(currentItemId, updatedData);

        // sync to context from local
        const formDataObj = Object.fromEntries(newMap);
        updateContextFormData(formDataObj);

        return newMap;
      });
    },
    [currentItemId, updateContextFormData]
  );

  // child response, consonant, vowel, score update helpers for form
  const updateChildResponse = useCallback(
    (response: string) => {
      updateFormData("childResponse", response);
    },
    [updateFormData]
  );

  const updateConsonantsCorrect = useCallback(
    (count: number) => {
      updateFormData("consonantsCorrect", count);
    },
    [updateFormData]
  );

  const updateVowelsCorrect = useCallback(
    (count: number) => {
      updateFormData("vowelsCorrect", count);
    },
    [updateFormData]
  );

  const updateScore = useCallback(
    (score: number) => {
      updateFormData("score", score);
    },
    [updateFormData]
  );

  const calculateScore = useCallback(
    (
      consonantsCorrect: number,
      consonantsTotal: number,
      vowelsCorrect: number,
      vowelsTotal: number
    ): number => {
      const consonantsPerfect = consonantsCorrect === consonantsTotal;
      const vowelsPerfect = vowelsCorrect === vowelsTotal;

      return consonantsPerfect && vowelsPerfect ? 1 : 0;
    },
    []
  );

  // returns the object array
  function getAllFormData(): Map<number, ItemFormData> {
    return new Map(formDataMap);
  }

  // returns meta of total items, completed items, completion percentage
  function getCompletionStats() {
    const totalItems = formDataMap.size;
    const completedItems = Array.from(formDataMap.values()).filter(
      (data) =>
        data.childResponse.length > 0 ||
        data.consonantsCorrect > 0 ||
        data.vowelsCorrect > 0
    ).length;

    return {
      totalItems,
      completedItems,
      completionPercentage:
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  }

  // helper function for json export
  function exportFormData() {
    const allData = Object.fromEntries(getAllFormData());
    return {
      session: allData,
      meta: getCompletionStats(),
      exportedAt: new Date().toISOString(),
    };
  }

  return {
    formData: getCurrentFormData(),
    hasData,

    // Update functions
    updateChildResponse,
    updateConsonantsCorrect,
    updateVowelsCorrect,
    updateScore,

    // Scoring function
    calculateScore,

    // Utility functions
    getAllFormData,
    getCompletionStats,
    exportFormData,

    // Raw form data map for advanced use cases
    formDataMap,
  };
}

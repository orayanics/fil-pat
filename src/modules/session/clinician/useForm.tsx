"use client";

import {useState, useEffect, useCallback} from "react";
import {useSocketState, useSocketDispatch} from "@/context/SocketProvider";
import {sampleData} from "@/data/data";

export interface ItemFormData {
  ipa_key: string;
  group: string;
  childResponse: string;
  consonantsCorrect: number;
  vowelsCorrect: number;
  score: number;
}

const createDefaultFormData = (): ItemFormData => ({
  ipa_key: "",
  group: "",
  childResponse: "",
  consonantsCorrect: 0,
  vowelsCorrect: 0,
  score: 0,
});

export function useSessionForm(currentItemId?: number) {
  const {formData: contextFormData} = useSocketState();
  const {updateFormData: updateContextFormData} = useSocketDispatch();
  const [formDataMap, setFormDataMap] = useState<Map<number, ItemFormData>>(
    new Map()
  );

  useEffect(() => {
    if (!currentItemId) return;

    const itemKey = String(currentItemId);
    const sampleItem = sampleData.find((s) => s.item === Number(currentItemId));

    const ctxEntry = (contextFormData as Record<string, unknown>)?.[itemKey];
    const baseData = createDefaultFormData();
    let updatedData: ItemFormData = {...baseData};
    let needsContextUpdate = false;

    if (ctxEntry && typeof ctxEntry === "object") {
      updatedData = {...baseData, ...(ctxEntry as ItemFormData)};

      if (!updatedData.ipa_key && sampleItem?.ipa_key) {
        updatedData.ipa_key = sampleItem.ipa_key;
        needsContextUpdate = true;
      }

      if (!updatedData.group && sampleItem?.group) {
        updatedData.group = sampleItem.group;
        needsContextUpdate = true;
      }
    } else {
      if (sampleItem) {
        updatedData.ipa_key = sampleItem.ipa_key || "";
        updatedData.group = sampleItem.group || "";
      }
      needsContextUpdate = true;
    }

    setFormDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(currentItemId as number, updatedData);

      if (needsContextUpdate) {
        updateContextFormData(Object.fromEntries(newMap));
      }

      return newMap;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItemId, contextFormData, sampleData, updateContextFormData]);

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

    const existing = formDataMap.get(currentItemId);
    if (existing) return existing;

    // seed ipa_key and group from sampleData for the current item when no entry exists yet
    const sampleItem = sampleData.find(
      (s) => s.item === (currentItemId as number)
    );
    if (sampleItem) {
      const seeded = createDefaultFormData();
      seeded.ipa_key = sampleItem.ipa_key || "";
      seeded.group = sampleItem.group || "";
      return seeded;
    }

    return createDefaultFormData();
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
        // treat text fields as strings, numeric fields as numbers
        if (
          field === "childResponse" ||
          field === "ipa_key" ||
          field === "group"
        ) {
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
    const totalItems = sampleData.length;
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
    const meta = getCompletionStats();

    const allAnswered =
      meta.totalItems > 0 && meta.completedItems === meta.totalItems;

    if (!allAnswered) {
      return false;
    }

    return {
      session: allData,
      meta,
      exportedAt: new Date().toISOString(),
    };
  }

  // helpfer function to get formdata from localstorage with session id
  const getFormDataFromLocalStorage = (sessionId: string) => {
    if (typeof window === "undefined") return null;

    //

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
      console.error("Failed to parse form data from localStorage");
    }

    return null;
  };

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
    getFormDataFromLocalStorage,

    // Raw form data map for advanced use cases
    formDataMap,
  };
}

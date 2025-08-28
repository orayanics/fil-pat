// session formdata
export type ExportedSessionData = {
  session: {
    [key: string]: {
      ipa_key: string;
      group: string;
      childResponse: string;
      consonantsCorrect: number;
      vowelsCorrect: number;
      score: number;
    };
  };
  meta: {
    totalItems: number;
    completedItems: number;
    completionPercentage: number;
  };
  exportedAt: string;
};

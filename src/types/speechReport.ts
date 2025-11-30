/**
 * Speech-Language Pathology Assessment Report Structure
 * Based on ASHA (American Speech-Language-Hearing Association) guidelines
 * and Filipino PAT (Phonological Assessment Tool) requirements
 */

export interface SpeechAssessmentReport {
  // 1. IDENTIFYING INFORMATION
  clientInformation: {
    fullName: string;
    dateOfBirth: string;
    age: number;
    gender: string;
    dateOfAssessment: string;
    fileNumber?: string;
    parentGuardian?: string;
    contactInformation?: string;
  };

  // 2. REASON FOR REFERRAL
  referralInformation: {
    referralSource?: string;
    referralDate?: string;
    chiefConcerns: string[]; // e.g., "Difficulty producing certain sounds", "Unclear speech"
    reportedBy?: string; // Parent, teacher, etc.
  };

  // 3. BACKGROUND INFORMATION
  backgroundHistory: {
    developmentalHistory?: string;
    medicalHistory?: string;
    educationalHistory?: string;
    languageBackground: {
      primaryLanguage: string;
      otherLanguages?: string[];
      languageExposure?: string;
    };
    previousTherapy?: {
      type: string;
      duration: string;
      outcome: string;
    }[];
  };

  // 4. ASSESSMENT PROCEDURES
  assessmentProcedures: {
    testsAdministered: {
      name: string; // e.g., "Filipino Phonological Assessment Tool (Fil-PAT)"
      version?: string;
      date: string;
      duration?: string;
    }[];
    assessmentSetting: string; // e.g., "Quiet room", "Clinical setting"
    assessmentMode: string; // "In-person", "Telepractice"
    clientCooperation: string; // e.g., "Excellent", "Good", "Required encouragement"
    reliability: string; // e.g., "Results are considered valid and reliable"
  };

  // 5. ASSESSMENT RESULTS
  assessmentResults: {
    // Phonological Analysis
    phonologicalFindings: {
      overallAccuracy: number; // Percentage
      consonantAccuracy: number;
      vowelAccuracy: number;
      totalItemsAssessed: number;
      totalItemsCorrect: number;
      
      // Error patterns
      errorPatterns: {
        pattern: string; // e.g., "Final consonant deletion", "Cluster reduction"
        frequency: string; // "Consistent", "Occasional", "Rare"
        examples: string[];
      }[];
      
      // Phoneme-level analysis
      consonantInventory: {
        phoneme: string;
        positions: {
          initial?: "correct" | "incorrect" | "inconsistent";
          medial?: "correct" | "incorrect" | "inconsistent";
          final?: "correct" | "incorrect" | "inconsistent";
        };
        errorType?: string; // e.g., "Substitution", "Omission", "Distortion"
      }[];
      
      vowelInventory: {
        phoneme: string;
        accuracy: "correct" | "incorrect" | "inconsistent";
        errorType?: string;
      }[];
    };

    // Stimulability
    stimulability?: {
      phoneme: string;
      stimulable: boolean;
      context: string; // "Isolation", "Syllable", "Word"
      notes?: string;
    }[];

    // Intelligibility
    intelligibility: {
      rating: string; // e.g., "Highly intelligible", "Mostly intelligible", "Difficult to understand"
      percentage?: number; // 0-100
      contextDescription: string; // e.g., "to unfamiliar listeners in connected speech"
      impactOnCommunication: string;
    };
  };

  // 6. CLINICAL IMPRESSIONS & ANALYSIS
  clinicalImpressions: {
    summary: string; // Overall summary of findings
    severityLevel: "Within normal limits" | "Mild" | "Moderate" | "Severe" | "Profound";
    diagnosticImpression: string; // e.g., "Phonological disorder", "Articulation disorder"
    strengths: string[]; // Client's areas of strength
    areasOfConcern: string[]; // Areas needing intervention
    prognosticIndicators: string; // "Good", "Fair", "Guarded" with reasoning
  };

  // 7. RECOMMENDATIONS
  recommendations: {
    interventionRecommended: boolean;
    interventionType?: string; // e.g., "Individual speech therapy", "Group therapy"
    frequency?: string; // e.g., "2x per week, 45 minutes per session"
    duration?: string; // e.g., "6-12 months with quarterly reassessment"
    
    goals: {
      longTerm: string[];
      shortTerm: string[];
    };
    
    // Specific recommendations
    therapyApproaches?: string[]; // e.g., "Cycles approach", "Minimal pairs therapy"
    homeActivities?: string[];
    collaborationRecommendations?: string[]; // Parent training, teacher collaboration
    referrals?: {
      specialist: string; // e.g., "Audiologist", "Psychologist"
      reason: string;
    }[];
    
    reassessmentDate?: string;
  };

  // 8. CLINICIAN INFORMATION & SIGNATURE
  clinicianInformation: {
    name: string;
    credentials: string; // e.g., "CCC-SLP", "Licensed Speech-Language Pathologist"
    licenseNumber?: string;
    institution?: string;
    contactInformation?: string;
    signature?: string; // Digital signature or base64 image
    dateReported: string;
  };

  // 9. ADDITIONAL NOTES
  additionalNotes?: {
    observations?: string;
    familyInput?: string;
    culturalConsiderations?: string;
    limitationsOfAssessment?: string;
    confidentialityStatement?: string;
  };

  // METADATA
  metadata: {
    reportId: string;
    reportGeneratedDate: string;
    reportVersion: string;
    sessionIds: number[]; // Associated assessment sessions
    templateUsed: string;
    isForKids: boolean;
  };
}

// Helper type for form data collection
export interface ReportFormData {
  // Basic info (from patient record)
  patientId: number;
  patientName: string;
  dateOfBirth: string;
  age: number;
  gender: string;
  
  // Additional info to collect
  parentGuardianName?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  // Referral
  referralSource?: string;
  chiefConcerns: string;
  
  // Background
  developmentalHistory?: string;
  medicalHistory?: string;
  primaryLanguage: string;
  otherLanguages?: string;
  previousTherapy?: string;
  
  // Assessment context
  assessmentDate: string;
  assessmentDuration?: string;
  clientCooperation: string;
  
  // Clinical impressions
  clinicalSummary: string;
  severityLevel: string;
  diagnosticImpression: string;
  strengths: string;
  areasOfConcern: string;
  prognosis: string;
  
  // Intelligibility
  intelligibilityRating: string;
  intelligibilityImpact: string;
  
  // Recommendations
  interventionRecommended: boolean;
  interventionType?: string;
  frequency?: string;
  duration?: string;
  longTermGoals: string;
  shortTermGoals: string;
  therapyApproaches?: string;
  homeActivities?: string;
  referrals?: string;
  
  // Additional
  observations?: string;
  familyInput?: string;
  culturalConsiderations?: string;
  limitations?: string;
}

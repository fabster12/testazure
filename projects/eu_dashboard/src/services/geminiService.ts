

import { GoogleGenAI } from "@google/genai";
import { Application } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a fallback for development environments where the key might not be set.
  // In a real production environment, the key should always be available.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateApplicationSummary = async (app: Application): Promise<string> => {
  if (!API_KEY) {
    return "Error: Gemini API key is not configured.";
  }
  
  try {
    const model = 'gemini-2.5-flash';
    
    // Sanitize the application data to remove the AI summary itself if it exists
    const appDataForPrompt = { ...app };

    const prompt = `
      Based on the following JSON data for an application that is being retired, provide a concise summary for an IT executive. 
      Focus on three key areas:
      1.  **Business Impact:** Briefly describe its function, criticality, and why it's being archived.
      2.  **Technical Snapshot:** Mention the core technology stack and its complexity.
      3.  **Archiving Risk:** Highlight the most significant risks associated with archiving this application (e.g., data loss impact, dependencies on specific people, technical challenges).

      Keep the summary professional, clear, and under 200 words.

      Application JSON data:
      ${JSON.stringify(appDataForPrompt, null, 2)}
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `An error occurred while generating the summary: ${error.message}`;
    }
    return "An unknown error occurred while generating the summary.";
  }
};

export const getArchiveStrategyRecommendation = async (answers: any): Promise<string> => {
    if (!API_KEY) {
        return "Error: Gemini API key is not configured.";
    }

    const readableAnswers = `
- Is the data transactional (shipments, manifests, invoicing, tracking events)? ${answers.isTransactional || 'Not answered'}
- Is the data non-transactional (telematics logs, route metadata, performance dashboards, reference data)? ${answers.isNonTransactional || 'Not answered'}
- Is retention mandated by law or regulation (customs, safety, financial reporting, GDPR in EU contexts)? ${answers.isRegulated || 'Not answered'}
- Does the data include personal or sensitive information (PII, customer data, driver identifiers) that needs special handling? ${answers.hasPii || 'Not answered'}
- Is immutable/WORM storage required for audits or compliance? ${answers.isWormRequired || 'Not answered'}
- Who needs access to archived data? ${Object.entries(answers.accessNeeds).filter(([,v]) => v).map(([k]) => k).join(', ') || 'Not specified'}
- Expected retrieval frequency: ${answers.retrievalFrequency || 'Not answered'}
- Minimum retention required: ${answers.retentionPeriod || 'Not answered'}
- Is phased data lifecycle needed (move from active -> nearline -> cold storage over time)? ${answers.isPhasedLifecycle || 'Not answered'}
- Primary purpose for keeping data: ${Object.entries(answers.dataPurpose).filter(([,v]) => v).map(([k]) => k).join(', ') || 'Not specified'}
- Can data be anonymized/pseudonymized (while keeping useful operational value)? ${answers.canBeAnonymized || 'Not answered'}
- Data owner / data steward: ${answers.dataOwner || 'Not answered'}
- Do we have a metadata catalog or data lineage owner to align with? ${answers.hasMetadataCatalog || 'Not answered'}
- Expected data volume: ${answers.dataVolume || 'Not answered'}
- Is there a preference for faster recall vs cost savings (Tiering: hot/warm/cold)? ${answers.recallPreference || 'Not answered'}
- Do we require integration with existing platforms in archives? ${answers.needsIntegration || 'Not answered'}
- Any known data quality issues? ${answers.hasQualityIssues || 'Not answered'}
`;

    const prompt = `
      An IT department is planning to archive an application. Based on the answers to the following questionnaire, recommend one of the six provided archiving patterns and provide a detailed justification for your choice.

      **Questionnaire Answers:**
      ${readableAnswers}

      **Archiving Patterns:**
      1.  **Pattern 1: "The data can remain and be accessed from the application as read only"**
          Implies long-term storage that remains accessible in-place, with read-only protection to preserve integrity.
      2.  **Pattern 2: "Leverage existing archive capability for my application"**
          Suggests reusing or piggybacking on the application’s current archiving capability rather than building a new one.
      3.  **Pattern 3: "I need an interim solution to archive my data for a non regulatory period to allow the application to be retired"**
          Focuses on a temporary archival approach to support a sunset or retirement window.
      4.  **Pattern 4: "I have regulatory need to store my data in a lifecycle managed archive"**
          Indicates compliance-driven retention with lifecycle management and persistence requirements.
      5.  **Pattern 5: "The nature of my application requires a specialist hybrid solution"**
          Recognizes that some workloads need a tailored, mixed approach (hybrid archiving).
      6.  **Pattern 6: "No archive solution needed, the data can be extracted to common self-service formats and managed by the business function"**
          Proposes exporting data to self-service formats for business units to own lifecycle outside a formal archive.

      **Your Task:**
      1.  Select the single best-fit pattern from the list above (1-6).
      2.  Provide a clear, executive-level recommendation.
      3.  Explain your reasoning in detail, referencing specific answers from the questionnaire to justify why the chosen pattern is the most appropriate and why other patterns are less suitable.

      Format your response using Markdown as follows:

      ### Recommended Pattern
      **Pattern [Number]: [Pattern Name]**

      ### Justification
      [Your detailed explanation here, using bullet points for clarity]
    `;

    try {
        const model = 'gemini-2.5-flash';
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API for strategy recommendation:", error);
        if (error instanceof Error) {
            return `An error occurred while generating the recommendation: ${error.message}`;
        }
        return "An unknown error occurred while generating the recommendation.";
    }
};

import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

const DEFAULT_CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
].filter(Boolean) as string[];

/**
 * Executes a Gemini generateContent request with automatic fallback across multiple candidate models
 * (e.g. gemini-1.5-flash, gemini-1.5-flash-latest, gemini-2.0-flash, gemini-pro) if a 404/Not Found error occurs.
 */
export async function generateContentWithFallback(
    genAI: GoogleGenerativeAI,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contents: any,
    options?: {
        generationConfig?: GenerationConfig;
        candidateModels?: string[];
    }
) {
    const modelsToTry = options?.candidateModels?.length
        ? options.candidateModels
        : DEFAULT_CANDIDATE_MODELS;

    // Remove duplicates while keeping order
    const uniqueModels = Array.from(new Set(modelsToTry));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lastError: any = null;

    for (const modelName of uniqueModels) {
        try {
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: options?.generationConfig,
            });

            const result = await model.generateContent(contents);
            return { result, modelName };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const errStr = String(err?.message || err);

            const isNotFound =
                errStr.includes('404') ||
                errStr.includes('not found') ||
                errStr.includes('ModelService.ListModels') ||
                errStr.includes('is not found for API version');

            const isMimeTypeError =
                errStr.includes('responseMimeType') ||
                errStr.includes('generationConfig');

            if (isMimeTypeError && options?.generationConfig) {
                // Retry without generationConfig if responseMimeType isn't supported by this model
                try {
                    const fallbackModel = genAI.getGenerativeModel({ model: modelName });
                    const result = await fallbackModel.generateContent(contents);
                    return { result, modelName };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (retryErr: any) {
                    lastError = retryErr;
                }
            }

            if (isNotFound) {
                console.warn(`[Gemini Fallback] Model '${modelName}' not found (404). Trying next model candidate...`);
                lastError = err;
                continue;
            }

            // For rate limits (429) or other fatal errors, throw immediately or save lastError
            lastError = err;
            if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
                throw err;
            }
        }
    }

    throw lastError || new Error(`All candidate Gemini models failed (${uniqueModels.join(', ')}).`);
}

import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

const DEFAULT_CANDIDATE_MODELS = [
    process.env.GEMINI_MODEL,
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const errStr = String(err?.message || err);
            const isApiKeyError =
                errStr.includes('API_KEY_INVALID') ||
                errStr.includes('API key not valid') ||
                errStr.includes('API_KEY_SERVICE_BLOCKED') ||
                errStr.includes('UNAUTHENTICATED') ||
                errStr.includes('403');

            if (isApiKeyError) {
                throw new Error(`Gemini API Key Error: ${err?.message || 'Invalid or unauthorized GEMINI_API_KEY.'}`);
            }

            const isNotFound =
                errStr.includes('404') ||
                errStr.includes('not found') ||
                errStr.includes('is not found') ||
                errStr.includes('is not supported') ||
                errStr.includes('ModelService.ListModels') ||
                errStr.includes('API version');

            const isMimeTypeError =
                errStr.includes('responseMimeType') ||
                errStr.includes('generationConfig') ||
                errStr.includes('INVALID_ARGUMENT');

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
                console.warn(`[Gemini Fallback] Model '${modelName}' not found or unsupported. Trying next candidate...`);
                lastError = err;
                continue;
            }

            // For rate limits (429) or other fatal errors, save lastError and try next if not 429
            lastError = err;
            if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
                throw err;
            }
        }
    }

    throw lastError || new Error(`All candidate Gemini models failed (${uniqueModels.join(', ')}).`);
}

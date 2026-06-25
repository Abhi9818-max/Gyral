/**
 * Input validation and sanitization utilities for production security hardening.
 */

/**
 * Sanitizes a string by trimming whitespace, removing non-printable/control characters,
 * and truncating it to a maximum length to prevent buffer/memory exploitation or database bloat.
 */
export function sanitizeString(input: unknown, maxLength: number): string {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Remove control characters (ASCII 0-31 and 127) and trim
    // eslint-disable-next-line no-control-regex
    const sanitized = input.replace(/[\x00-\x1F\x7F]/g, '').trim();
    
    // Enforce maximum length
    return sanitized.slice(0, maxLength);
}

/**
 * Validates whether a string is a properly formatted email.
 */
export function validateEmail(email: unknown): boolean {
    if (typeof email !== 'string' || email.length > 254) {
        return false;
    }
    
    // Standard secure RFC 5322 regex for email validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
}

/**
 * Validates a redirect path against open redirect vulnerabilities.
 * Only allows relative paths that start with '/' and do not start with '//' (which browsers interpret as protocol-relative).
 */
export function isValidPath(path: unknown): boolean {
    if (typeof path !== 'string') {
        return false;
    }
    
    // Must start with '/' and NOT with '//' or '\' or '//'
    return path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') && !path.includes('..');
}

/**
 * Strips potential prompt injection markers and dangerous formatting characters
 * from user inputs that will be interpolated into AI/LLM system prompts.
 */
export function sanitizeForPrompt(input: unknown, maxLength: number = 1000): string {
    const basicSanitized = sanitizeString(input, maxLength);
    
    // Strip common prompt injection markers (e.g. "Ignore instructions", "System Prompt:")
    return basicSanitized
        .replace(/system\s*prompt/gi, '')
        .replace(/ignore\s*previous/gi, '')
        .replace(/ignore\s*instructions/gi, '')
        .replace(/assistant\s*role/gi, '')
        .replace(/translate\s*to/gi, '')
        .replace(/<\/s>/g, '') // Strip end of sequence tokens
        .trim();
}

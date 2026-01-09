/**
 * Utility functions for formatting and validating appointment fields
 */

/**
 * Format ID field to match requirements:
 * - At least 1 and at most 2 capital alphabet characters
 * - Followed by exactly 3 digits
 * - Auto-trims to match the format
 * 
 * @param {string} value - The input value to format
 * @returns {string} - Formatted ID value
 */
export function formatIdField(value) {
  if (!value) return '';
  
  // Convert to string and trim whitespace
  const trimmed = String(value).trim().toUpperCase();
  
  // Extract letters and digits separately
  const letters = trimmed.match(/[A-Z]/g) || [];
  const digits = trimmed.match(/\d/g) || [];
  
  // Take at most 2 letters and exactly 3 digits
  const formattedLetters = letters.slice(0, 2).join('');
  const formattedDigits = digits.slice(0, 3).join('');
  
  // Return formatted value (letters + digits)
  // Only return if we have at least 1 letter and at least 1 digit
  if (formattedLetters.length > 0 && formattedDigits.length > 0) {
    return formattedLetters + formattedDigits;
  }
  
  // If we only have letters or only digits, return what we have
  // This allows partial input during typing
  return formattedLetters + formattedDigits;
}

/**
 * Format Phone field to match requirements:
 * - Exactly 4 digits only
 * - Auto-trims to match the format
 * 
 * @param {string} value - The input value to format
 * @returns {string} - Formatted phone value
 */
export function formatPhoneField(value) {
  if (!value) return '';
  
  // Convert to string and extract only digits
  const digits = String(value).match(/\d/g) || [];
  
  // Take exactly 4 digits
  return digits.slice(0, 4).join('');
}

/**
 * Validate ID field format
 * 
 * @param {string} value - The value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidIdFormat(value) {
  if (!value) return true; // Empty is valid
  
  // Pattern: 1-2 capital letters followed by exactly 3 digits
  const pattern = /^[A-Z]{1,2}\d{3}$/;
  return pattern.test(value);
}

/**
 * Validate Phone field format
 * 
 * @param {string} value - The value to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidPhoneFormat(value) {
  if (!value) return true; // Empty is valid
  
  // Pattern: exactly 4 digits
  const pattern = /^\d{4}$/;
  return pattern.test(value);
}


/**
 * Formats a date string from YYYY-MM-DD to a more human-readable format
 * Example: 2023-01-15 → Jan 2023
 * 
 * @param dateString Date string in ISO format (YYYY-MM-DD)
 * @returns Formatted date string (Month Year)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Invalid date, return original
    
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    return `${month} ${year}`;
  } catch (error) {
    // If any error in parsing, return the original string
    return dateString;
  }
}
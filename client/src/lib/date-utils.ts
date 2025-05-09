/**
 * Formats a date string in a consistent way
 * @param dateStr Date string to format
 * @returns Formatted date string (e.g. "Jan 2022")
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (e) {
    return dateStr;
  }
}
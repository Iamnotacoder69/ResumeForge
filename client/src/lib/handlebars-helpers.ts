import Handlebars from 'handlebars';
import { formatDate } from './date-utils';

/**
 * Register all handlebars helpers used in CV templates
 */
export function registerHelpers() {
  // Helper to format dates with safe handling of undefined/null
  Handlebars.registerHelper('formatDate', function(dateStr) {
    if (!dateStr) return '';
    try {
      return formatDate(dateStr);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateStr; // Return original if formatting fails
    }
  });
  
  // Helper to check equality
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });
  
  // Helper to check if array has items
  Handlebars.registerHelper('hasItems', function(array) {
    return Array.isArray(array) && array.length > 0;
  });
  
  // Helper to safely get array length with null/undefined check
  Handlebars.registerHelper('length', function(array) {
    return Array.isArray(array) ? array.length : 0;
  });
  
  // Helper for debug logging during template rendering
  Handlebars.registerHelper('log', function(value) {
    console.log('Template debug:', value);
    return '';
  });
}
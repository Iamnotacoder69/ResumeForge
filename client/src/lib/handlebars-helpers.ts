import Handlebars from 'handlebars';
import { formatDate } from './date-utils';

/**
 * Register all handlebars helpers used in CV templates
 */
export function registerHelpers() {
  // Helper to format dates
  Handlebars.registerHelper('formatDate', function(dateStr) {
    return formatDate(dateStr);
  });
  
  // Helper to check equality
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });
  
  // Helper to check if array has items
  Handlebars.registerHelper('hasItems', function(array) {
    return Array.isArray(array) && array.length > 0;
  });
}
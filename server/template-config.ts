/**
 * CV Template Configuration
 * 
 * This file defines fixed configuration values for all CV templates.
 * These settings ensure absolute consistency across all CV sections.
 * Values should not be modified or calculated dynamically during runtime.
 */

export const TEMPLATE_CONFIG = {
  // Page dimensions for A4 in points (1 inch = 72 points)
  PAGE: {
    WIDTH: 595.28,
    HEIGHT: 841.89,
    MARGIN: {
      TOP: 30,
      RIGHT: 40, 
      BOTTOM: 30,
      LEFT: 40
    }
  },
  
  // Typography configuration
  TYPOGRAPHY: {
    FONTS: {
      PRIMARY: "Helvetica", 
      PRIMARY_BOLD: "Helvetica-Bold",
      PRIMARY_ITALIC: "Helvetica-Oblique",
      PRIMARY_BOLD_ITALIC: "Helvetica-BoldOblique"
    },
    SIZES: {
      NAME: 18,          // Main name at the top of CV
      SECTION_TITLE: 12, // Section headings like "Experience", "Education"
      ENTRY_TITLE: 10,   // Job titles, degree names
      NORMAL: 10,        // Regular text
      SMALL: 9           // Dates, minor text
    },
    COLORS: {
      PRIMARY: "#333333",
      SECONDARY: "#666666",
      MUTED: "#999999",
      ACCENT: "#333333"
    },
    LINE_HEIGHT: {
      TIGHT: 1.2,
      NORMAL: 1.3,
      RELAXED: 1.5
    }
  },
  
  // Fixed spacing values
  SPACING: {
    // Spacing between sections (fixed values)
    SECTION_SPACING: 15, // Always 15pts between major sections
    
    // Spacing after elements
    AFTER_NAME: 3,
    AFTER_CONTACT: 8,
    AFTER_SECTION_TITLE: 5,
    AFTER_PARAGRAPH: 5,
    
    // Spacing between entries within sections
    BETWEEN_ENTRIES: 8,
    
    // Spacing for list items
    LIST_ITEM_SPACING: 2,
    
    // Indentation
    BULLET_INDENT: 15
  },
  
  // Section order (visual order in the CV)
  SECTION_ORDER: [
    "personal",
    "summary",
    "keyCompetencies",
    "experience", 
    "education",
    "certificates",
    "extracurricular",
    "additional"
  ],
  
  // Layout settings
  LAYOUT: {
    SECTION_SEPARATOR: {
      WIDTH: 1,        // Separator line width
      COLOR: "#cccccc" // Separator line color
    },
    BULLET_POINT: "•",  // Bullet character
    DATE_FORMAT: "MMM yyyy" // Standard date format
  }
};

/**
 * Helper function to enforce fixed spacing between sections
 * This function always returns the exact same spacing value
 * for consistency throughout the document.
 * 
 * @returns Fixed section spacing value
 */
export function getSectionSpacing(): number {
  return TEMPLATE_CONFIG.SPACING.SECTION_SPACING;
}

/**
 * Helper to get content width (page width minus margins)
 * This ensures all components have the same width measurement.
 * 
 * @returns Fixed content width
 */
export function getContentWidth(): number {
  return TEMPLATE_CONFIG.PAGE.WIDTH - TEMPLATE_CONFIG.PAGE.MARGIN.LEFT - TEMPLATE_CONFIG.PAGE.MARGIN.RIGHT;
}

/**
 * Helper to calculate text height consistently
 * @param text Text content
 * @param width Available width
 * @param fontSize Font size
 * @param lineHeight Line height multiplier
 * @returns Text block height
 */
export function calculateTextHeight(text: string, width: number, fontSize: number, lineHeight: number = TEMPLATE_CONFIG.TYPOGRAPHY.LINE_HEIGHT.NORMAL): number {
  if (!text || text.trim() === '') return 0;
  
  // Approximate height calculation based on text length and width
  const charactersPerLine = Math.floor(width / (fontSize * 0.6));
  const numberOfLines = Math.ceil(text.length / charactersPerLine);
  return numberOfLines * fontSize * lineHeight;
}
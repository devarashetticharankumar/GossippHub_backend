// Standard CommonJS import for bad-words v3
const Filter = require("bad-words");

function initializeFilter() {
  try {
    filter = new Filter();
    // Add custom words for filtering (e.g., platform-specific or Telugu terms)
    filter.addWords("ni amma", "lanjakodaka");
  } catch (err) {
    console.error("Failed to initialize bad-words filter:", err);
    // Fallback to a dummy filter that allows all content
    filter = { isProfane: () => false };
  }
}

// Initialize the filter
initializeFilter();

module.exports = {
  filterContent: (text) => {
    try {
      // Validate input
      if (typeof text !== "string" || text.trim() === "") {
        console.warn("Invalid input for filterContent:", text);
        return true; // Allow empty or non-string input (no profanity possible)
      }
      // Check for profanity
      return !filter.isProfane(text.trim());
    } catch (err) {
      console.error("Content filtering error:", err);
      return false; // Reject content on error to be safe
    }
  },
};

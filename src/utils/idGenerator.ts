// ID Generation Utility

export const generateId = (): string => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: Generate a simple unique ID
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

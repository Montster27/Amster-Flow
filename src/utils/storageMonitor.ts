// localStorage Monitoring Utility

export interface StorageInfo {
  used: number; // bytes
  available: number; // bytes (approximate)
  percentage: number; // 0-100
  isNearLimit: boolean; // true if > 80%
}

export const getStorageInfo = (): StorageInfo => {
  try {
    // Calculate used storage
    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    // Approximate localStorage limit (typically 5-10MB, we'll use 5MB as conservative estimate)
    const estimatedLimit = 5 * 1024 * 1024; // 5MB in bytes
    const available = estimatedLimit - used;
    const percentage = (used / estimatedLimit) * 100;

    return {
      used,
      available,
      percentage,
      isNearLimit: percentage > 80,
    };
  } catch (error) {
    console.error('Failed to calculate storage info:', error);
    return {
      used: 0,
      available: 0,
      percentage: 0,
      isNearLimit: false,
    };
  }
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const checkStorageWarning = (): string | null => {
  const info = getStorageInfo();

  if (info.percentage > 90) {
    return `Storage is ${Math.round(info.percentage)}% full (${formatBytes(info.used)} used). Consider exporting and clearing old data.`;
  } else if (info.isNearLimit) {
    return `Storage is ${Math.round(info.percentage)}% full. You may want to export your data soon.`;
  }

  return null;
};

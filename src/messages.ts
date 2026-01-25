// Messages configuration loader
const MESSAGES_CACHE: Map<string, string> = new Map();

// Load messages from configuration file
export const loadMessages = async (): Promise<void> => {
  try {
    const response = await fetch('/messages.txt');
    const text = await response.text();

    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }

      // Parse key = value format
      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmedLine.substring(0, separatorIndex).trim();
      const value = trimmedLine.substring(separatorIndex + 1).trim();

      MESSAGES_CACHE.set(key, value);
    }

    console.log('Messages loaded:', MESSAGES_CACHE.size);
  } catch (error) {
    console.error('Failed to load messages:', error);
  }
};

// Get a message by key, with optional parameter substitution
export const getMessage = (key: string, params?: Record<string, string | number>): string => {
  let message = MESSAGES_CACHE.get(key) || key;

  // Replace parameters in the format {paramName}
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      message = message.replace(`{${paramKey}}`, String(paramValue));
    });
  }

  return message;
};

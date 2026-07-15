import { useCountryCodes } from './useCountryCodes';

/**
 * Hook for phone number validation based on country code.
 * Returns a validatePhone function that checks length and digits-only.
 */
export const usePhoneValidation = () => {
  const { getPhoneConfig } = useCountryCodes();

  const validatePhone = (countryCode, phoneNumber) => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      return 'Phone required';
    }
    if (!/^\d+$/.test(trimmed)) {
      return 'Only digits are allowed';
    }
    const config = getPhoneConfig(countryCode);
    if (config.minLength === config.maxLength) {
      if (trimmed.length !== config.minLength) {
        return `${config.minLength} digits required`;
      }
    } else {
      if (trimmed.length < config.minLength || trimmed.length > config.maxLength) {
        return `Must be between ${config.minLength} and ${config.maxLength} digits`;
      }
    }
    return '';
  };

  return { validatePhone };
};

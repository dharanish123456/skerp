/**
 * Country codes with their phone number length rules.
 */
const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91', country: 'India', minLength: 10, maxLength: 10 },
  { code: '+1', label: '🇺🇸 +1', country: 'USA', minLength: 10, maxLength: 10 },
  { code: '+44', label: '🇬🇧 +44', country: 'UK', minLength: 10, maxLength: 10 },
  { code: '+971', label: '🇦🇪 +971', country: 'UAE', minLength: 9, maxLength: 9 },
  { code: '+65', label: '🇸🇬 +65', country: 'Singapore', minLength: 8, maxLength: 8 },
  { code: '+61', label: '🇦🇺 +61', country: 'Australia', minLength: 9, maxLength: 9 },
  { code: '+49', label: '🇩🇪 +49', country: 'Germany', minLength: 10, maxLength: 11 },
  { code: '+81', label: '🇯🇵 +81', country: 'Japan', minLength: 10, maxLength: 10 },
  { code: '+86', label: '🇨🇳 +86', country: 'China', minLength: 11, maxLength: 11 },
  { code: '+966', label: '🇸🇦 +966', country: 'Saudi Arabia', minLength: 9, maxLength: 9 },
];

/**
 * Hook for country phone codes and phone number length configuration.
 * Returns the list of country codes and a helper to get config for a code.
 */
export const useCountryCodes = () => {
  const getPhoneConfig = (countryCode) => {
    return COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];
  };

  return { countryCodes: COUNTRY_CODES, getPhoneConfig };
};

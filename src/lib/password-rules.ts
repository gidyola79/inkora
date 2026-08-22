export const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { label: "Contains a letter", test: (value: string) => /[A-Za-z]/.test(value) },
  { label: "Contains a number", test: (value: string) => /[0-9]/.test(value) },
  {
    label: "Contains a special character",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
];

export function passwordMeetsPolicy(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

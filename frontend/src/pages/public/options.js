// Shared choices for the public forms.
export const STATES = ["Lagos", "Ogun", "Oyo", "Osun", "Ondo", "Ekiti"];

// Builds select options with an empty first choice: choose("Select state", STATES).
export const choose = (placeholder, values) => [
  { value: "", label: placeholder },
  ...values.map((value) => ({ value, label: value })),
];

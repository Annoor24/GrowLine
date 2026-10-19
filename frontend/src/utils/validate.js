// Small input checks shared by the forms. Each returns true when the value looks valid.

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

// Nigerian mobile numbers: 0803 123 4567, 08031234567, +234 803 123 4567, 2348031234567.
export function isNigerianPhone(value) {
  const digits = String(value).replace(/[\s()-]/g, "");
  return /^(\+234|234|0)[789][01]\d{8}$/.test(digits);
}

// The design asks for 12+ characters mixing letters, numbers and symbols.
// Returns the list of rules the password still breaks (empty list = fine).
export function passwordProblems(password, min = 12) {
  const problems = [];
  if (password.length < min) problems.push(`at least ${min} characters`);
  if (!/[A-Za-z]/.test(password)) problems.push("a letter");
  if (!/\d/.test(password)) problems.push("a number");
  if (!/[^A-Za-z0-9]/.test(password)) problems.push("a symbol");
  return problems;
}

export function passwordMessage(password) {
  const problems = passwordProblems(password);
  return problems.length ? `Password needs: ${problems.join(", ")}.` : "";
}

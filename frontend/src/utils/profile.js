import { api } from "../api/index.js";
import { ApiError } from "../api/client.js";
import { isEmail, isNigerianPhone, toE164 } from "./validate.js";

// Shared by the agent and super admin "Edit profile" forms.
// values: { name, email, phone }; saved: the profile as loaded. Returns field errors ({} when saved).
export async function saveProfile(values, saved) {
  const errors = {};
  if (!values.name.trim()) errors.name = "Enter your full name.";
  if (!isEmail(values.email)) errors.email = "Enter a valid email address.";
  // The saved number is in +234 form, so only check it once it has been changed.
  if (values.phone !== saved.phone && !isNigerianPhone(values.phone)) {
    errors.phone = "Use a Nigerian mobile number, e.g. 0803 123 4567.";
  }
  if (Object.keys(errors).length > 0) return errors;

  try {
    await api.updateProfile({
      fullname: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      ...(values.phone ? { phone: toE164(values.phone) } : {}),
    });
    return {};
  } catch (err) {
    // The backend reports field problems as one text "error", e.g. a duplicate email.
    const text = err instanceof ApiError ? JSON.stringify(err.data || "") : "";
    if (/email/i.test(text) && /already exists/i.test(text)) return { email: "Another account already uses this email address." };
    if (/phone/i.test(text)) return { phone: "This phone number could not be saved. Check it and try again." };
    return {
      form: err instanceof ApiError && err.status === 0
        ? "We could not reach GrowLine. Check your internet connection and try again."
        : "Your profile could not be saved. Please try again.",
    };
  }
}

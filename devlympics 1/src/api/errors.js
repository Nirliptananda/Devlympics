export function normalizeError(error) {
  if (!error?.response) {
    return {
      detail: "Cannot reach the server. Check your connection.",
      fieldErrors: {},
    };
  }

  const data = error.response.data || {};
  const fieldErrors = {};
  if (data.errors && typeof data.errors === "object") {
    Object.entries(data.errors).forEach(([field, messages]) => {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[field] = String(messages[0]);
      } else if (typeof messages === "string") {
        fieldErrors[field] = messages;
      }
    });
  }

  return {
    detail: typeof data.detail === "string" && data.detail
      ? data.detail
      : "Something went wrong. Please try again.",
    fieldErrors,
  };
}

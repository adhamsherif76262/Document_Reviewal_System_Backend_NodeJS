/**
 * Determines which fields can be edited during resubmission
 */
module.exports.resolveResubmissionFields = (document, template) => {
  const editableFields = new Map();
  const lockedFields = new Set();

  const stateTemplate = template.states[document.state];

  for (const tab of stateTemplate.tabs) {
    for (const field of tab.fields) {
      const existing = document.fields[field.name];

      // Field never existed (should not happen, but safe)
      if (!existing) continue;

      if (existing.review?.status === 'approved') {
        lockedFields.add(field.name);
      }

      if (existing.review?.status === 'rejected') {
        editableFields.set(field.name, {
          type: field.type,
          tab: tab.key,
          required: field.required || false,
        });
      }
    }
  }

  return { editableFields, lockedFields };
};

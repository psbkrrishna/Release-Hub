import React from "react";
import PropTypes from "prop-types";

/**
 * ErrorMessage - inline validation error text.
 * Vendored verbatim from zm-manage-new-setting-development. Note: unused by
 * any real production page per the codebase survey, but it's the correct,
 * accessible pattern (AGENTS.md requires errors "descriptive, near the
 * relevant field, and screen-reader friendly") so this rebuild uses it
 * deliberately in the Create/Edit Feature sheet.
 */
const ErrorMessage = ({ message, className = "" }) => {
  if (!message) return null;
  return <p className={`mt-1 text-sm text-red-600 ${className}`} role="alert">{message}</p>;
};

ErrorMessage.propTypes = {
  message: PropTypes.string,
  className: PropTypes.string,
};

export default ErrorMessage;

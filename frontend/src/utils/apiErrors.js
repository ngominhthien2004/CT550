export function getApiErrorMessage(error, fallbackMessage) {
  if (error && error.response && error.response.data && error.response.data.message) {
    return error.response.data.message
  }
  return fallbackMessage
}

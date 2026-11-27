export interface NewsletterSubscriptionResult {
  success: boolean
  message: string
  messageKey?: string
}

/**
 * Service function stub for newsletter subscription.
 * Performs client-side validation and returns a simulated response.
 */
export const subscribeToNewsletter = async (
  email: string
): Promise<NewsletterSubscriptionResult> => {
  const trimmed = email.trim()

  if (!trimmed) {
    return {
      success: false,
      message: 'Please enter your email address.',
      messageKey: 'footer.newsletterErrorEmpty',
    }
  }

  // Client-side email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return {
      success: false,
      message: 'Please enter a valid email address.',
      messageKey: 'footer.newsletterErrorInvalid',
    }
  }

  // Stub simulating successful subscription (no backend call yet)
  return {
    success: true,
    message: 'Thank you for subscribing to our newsletter!',
    messageKey: 'footer.newsletterSuccess',
  }
}


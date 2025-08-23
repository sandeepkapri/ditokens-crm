/**
 * Utility functions for handling user avatars
 */

/**
 * Returns the appropriate avatar URL for a user
 * @param profilePicture - The user's profile picture URL (can be null/undefined)
 * @returns The avatar URL to use (either the user's picture or default avatar)
 */
export function getAvatarUrl(profilePicture?: string | null): string {
  return profilePicture || "/images/avatars/default-avatar.svg";
}

/**
 * Returns initials from a user's name for fallback display
 * @param name - The user's full name
 * @returns The user's initials (first letter of first and last name)
 */
export function getInitials(name?: string | null): string {
  if (!name) return "U";
  
  const names = name.trim().split(" ");
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Validates if a file is a valid image for profile pictures
 * @param file - The file to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Check file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { isValid: false, error: "File size must be less than 2MB" };
  }

  // Check file type
  if (!file.type.startsWith("image/")) {
    return { isValid: false, error: "Please select an image file" };
  }

  // Check file type is supported
  const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: "Supported formats: JPG, PNG, GIF, WebP" };
  }

  return { isValid: true };
}

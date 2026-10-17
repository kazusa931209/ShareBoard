const USER_ID_PATTERN = /^[a-zA-Z0-9_]{3,32}$/;

export function validateUserId(userId: unknown): string | null {
  if (typeof userId !== "string") {
    return "User ID is required.";
  }
  const trimmed = userId.trim();
  if (!USER_ID_PATTERN.test(trimmed)) {
    return "User ID must be 3–32 characters (letters, numbers, underscore).";
  }
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string") {
    return "Password is required.";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  return null;
}

export function validatePostContent(content: unknown): string | null {
  if (typeof content !== "string") {
    return "Content is required.";
  }
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return "Post cannot be empty.";
  }
  if (trimmed.length > 2000) {
    return "Post must be at most 2,000 characters.";
  }
  return null;
}

export function normalizeUserId(userId: string): string {
  return userId.trim();
}

export type BoardInput = {
  title: string;
  url?: string | null;
  content: string;
  other?: string | null;
};

export function validateBoardInput(input: BoardInput): string | null {
  if (typeof input.title !== "string" || input.title.trim().length === 0) {
    return "Title is required.";
  }
  if (input.title.trim().length > 500) {
    return "Title must be at most 500 characters.";
  }

  if (input.url != null && input.url !== "") {
    if (typeof input.url !== "string") {
      return "URL must be a string.";
    }
    if (input.url.trim().length > 2000) {
      return "URL must be at most 2,000 characters.";
    }
  }

  if (typeof input.content !== "string") {
    return "Content is required.";
  }
  const content = input.content.trim();
  if (content.length === 0) {
    return "Content is required.";
  }
  if (content.length > 10000) {
    return "Content must be at most 10,000 characters.";
  }

  if (input.other != null && input.other !== "") {
    if (typeof input.other !== "string") {
      return "Other must be a string.";
    }
    if (input.other.trim().length > 10000) {
      return "Other must be at most 10,000 characters.";
    }
  }

  return null;
}

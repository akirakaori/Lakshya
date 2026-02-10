# Toast Notification Color Guide

This guide shows which toast type to use for different actions in the application.

## Color Scheme

### 🟢 Success (Green) - `handleSuccess()` or `toast.success()`
Use for positive, successful actions:
- ✅ Login success
- ✅ Registration success
- ✅ Profile updated successfully
- ✅ Data saved successfully
- ✅ Post created/updated successfully
- ✅ Upload completed
- ✅ Any successful CRUD operation

**Example:**
```tsx
handleSuccess("Login successful!");
handleSuccess("Registered successfully! Welcome aboard.");
```

### 🔵 Info (Blue) - `handleInfo()` or `toast.info()`
Use for informational, neutral messages:
- ℹ️ Logout
- ℹ️ Processing started
- ℹ️ Loading data
- ℹ️ Session expired
- ℹ️ General information messages

**Example:**
```tsx
handleInfo("You have been logged out.");
handleInfo("Processing your request...");
```

### 🟠 Warning (Orange) - `handleWarning()` or `toast.warning()`
Use for important notices and confirmations:
- ⚠️ Before delete operations
- ⚠️ Important notices
- ⚠️ Action confirmations needed
- ⚠️ Permission issues
- ⚠️ Incomplete data warnings

**Example:**
```tsx
handleWarning("Are you sure you want to delete this?");
handleWarning("Please fill all required fields.");
```

### 🔴 Error (Red) - `handleError()` or `toast.error()`
Use for errors and failures:
- ❌ Login/Registration failures
- ❌ API errors
- ❌ Validation errors
- ❌ Delete operation failures
- ❌ Network errors
- ❌ Permission denied
- ❌ Any failed operations

**Example:**
```tsx
handleError("Invalid credentials. Please try again.");
handleError("Failed to delete user.");
```

## Quick Reference Table

| Action | Toast Type | Color | Function |
|--------|-----------|-------|----------|
| Login Success | Success | Green | `handleSuccess()` |
| Register Success | Success | Green | `handleSuccess()` |
| Logout | Info | Blue | `handleInfo()` |
| Delete Confirmation | Warning | Orange | `handleWarning()` |
| Delete Error | Error | Red | `handleError()` |
| Update Success | Success | Green | `handleSuccess()` |
| API Failure | Error | Red | `handleError()` |
| Form Validation Error | Error | Red | `handleError()` |
| Data Saved | Success | Green | `handleSuccess()` |
| Processing Info | Info | Blue | `handleInfo()` |

## Implementation Examples

### Login Page
```tsx
// Success case
onSuccess: (data) => {
  handleSuccess("Login successful!");
  navigate("/dashboard");
}

// Error case
onError: (error) => {
  handleError("Invalid credentials. Please try again.");
}
```

### Registration Page
```tsx
// Success case
onSuccess: () => {
  handleSuccess("Registered successfully! Please login.");
  navigate("/login");
}

// Error case
onError: (error) => {
  handleError(error.message || "Registration failed.");
}
```

### Logout Action
```tsx
const handleLogout = () => {
  localStorage.clear();
  handleInfo("You have been logged out.");
  navigate("/login");
};
```

### Delete Operation
```tsx
// Before delete (warning)
const confirmDelete = () => {
  handleWarning("This action cannot be undone!");
  // Show confirmation dialog
};

// On successful delete
onSuccess: () => {
  handleSuccess("User deleted successfully.");
  queryClient.invalidateQueries(['users']);
}

// On delete error
onError: (error) => {
  handleError("Failed to delete user.");
}
```

## Visual Features

- **Width:** 380px - 550px (responsive)
- **Position:** Top-center
- **Duration:** 3 seconds auto-close
- **Progress Bar:** Visible at bottom
- **Close Button:** White, positioned inside container
- **Animation:** Smooth slide-in from top
- **Hover:** Pauses auto-close, subtle lift effect
- **Shadow:** Professional depth with rgba shadows
- **Gradients:** Subtle gradients for each color type

## Best Practices

1. **Be Specific:** Use clear, actionable messages
   - ✅ "Login successful!"
   - ❌ "Success"

2. **Match Color to Action:** Follow the guide consistently
   - Login success → Green
   - Logout → Blue
   - Delete error → Red

3. **Keep Messages Short:** Aim for 5-10 words maximum

4. **Use Appropriate Emotion:**
   - Success = Positive, encouraging
   - Info = Neutral, informative
   - Warning = Cautious, important
   - Error = Clear, helpful

5. **Avoid Toast Spam:** Don't show multiple toasts for the same action

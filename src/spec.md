# Specification

## Summary
**Goal:** Add a full-page, in-app file preview experience in the Files tab so users can preview common formats (images, PDFs, video) before choosing to download.

**Planned changes:**
- Replace the current Files tab right-hand file detail panel with a preview-focused view when a file is selected, including a clear Back/Close action to return to the list.
- Implement inline previews for images and PDFs using Blob URLs created from (decrypted when needed) file bytes, with cleanup of Blob URLs on navigation/file change.
- Add in-browser video playback via an HTML5 `<video controls>` player using a Blob URL, and show a fallback message if the browser can’t play the video type.
- For unsupported file types or preview failures, show an English fallback/error state with retry (for load/decrypt failures) and never auto-download.
- Keep existing file actions accessible from the preview view: Download for all users; and for owners only, Share, Delete, and Edit name/description.

**User-visible outcome:** Selecting a file opens a full preview view in the Files tab where users can view images, PDFs, and supported videos in-browser, or see a clear “preview not available” fallback for other types—while still having a manual Download button and existing owner-only controls.

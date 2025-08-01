# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome Extension (Manifest V3) called "미니 도구 모음" (Mini Tool Collection) that provides various bookmarklet tools through a side panel interface. The extension allows users to perform various actions on web pages such as image extraction, text processing, and page manipulation.

## Architecture

### Core Components

1. **Service Worker** (`background.js`)
   - Handles message passing between side panel and content scripts
   - Manages bookmarklet execution via `chrome.scripting.executeScript`
   - Special handling for image downloads and ZIP file generation
   - Uses ES6 modules (`type: "module"`)

2. **Side Panel** (`sidepanel.html`, `sidepanel.js`, `sidepanel.css`)
   - Main UI for the extension
   - Displays tool categories: 이미지 도구, 텍스트 도구, 페이지 도구, 개발자 도구
   - Handles user interactions and communicates with background script

3. **Bookmarklets** (`bookmarklets.js`)
   - Contains all tool functions as exportable modules
   - Each bookmarklet has a `func` property that executes in the page context
   - Special return values trigger actions in background script:
     - `{ action: 'downloadImagesAsZip', images: [...] }` - triggers ZIP download
     - `{ action: 'downloadZip', base64Data: ..., filename: ... }` - handles ZIP file download

### Key Features Implementation

**Image ZIP Download**
- Uses JSZip library (included as `jszip.min.js`)
- Content script collects image URLs
- Background script fetches images and creates ZIP
- Downloads via Chrome Downloads API using data URLs

**Message Flow**
1. User clicks tool button in side panel
2. Side panel sends message to background script with tool name
3. Background script executes bookmarklet function in active tab
4. Result is processed and returned to side panel
5. Side panel displays results in modal or shows success message

## Development Commands

```bash
# Install dependencies (JSZip)
npm install

# No build process - extension loads directly
# Load unpacked extension in Chrome from this directory
```

## Testing

1. Load extension as unpacked in Chrome (chrome://extensions/)
2. Click extension icon to open side panel
3. Navigate to a webpage with images to test image tools
4. Check console for debug logs

## Important Implementation Details

- Service Workers cannot use `URL.createObjectURL()`, use data URLs instead
- CORS issues are handled by trying multiple fetch modes: cors, no-cors, and canvas fallback
- All downloaded files go through Chrome Downloads API
- JSZip must be injected into content scripts before use
- The extension uses Korean language for UI elements
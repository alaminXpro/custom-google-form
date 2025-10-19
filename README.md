# Book a Demo — Multi-Step Form

A lightweight, accessible multi-step web form that collects business lead information and submits it to a Google Form. This repository contains a minimal static site (HTML, CSS, and vanilla JavaScript) focused on accessibility, client-side validation, autosave, and a clean mobile-friendly UI.

This README explains how to configure the Google Forms integration, run the site locally, test, and extend the project.

## Contents

- `index.html` — The multi-step form UI and hidden Google Forms entry inputs.
- `style.css` — Custom styles and accessibility helpers (built on Tailwind CDN classes).
- `script.js` — Form logic: validation, autosave, step navigation, Google Forms submission, analytics hooks, and accessibility helpers.
- `README.md` — Project documentation (this file).

## Features

- Four-step form with a progress bar and keyboard-friendly navigation.
- Client-side validation for required fields, emails, URLs, and word counts.
- Autosave to `localStorage` so users can come back and continue.
- Honeypot and basic time-to-complete checks to reduce spam.
- Google Forms integration via `formResponse` POST (uses `no-cors` mode).
- Accessible UI: aria-live announcements, focus-visible outlines, and reduced-motion support.

## Quick start — preview locally

1. Clone the repository:

```bash
git clone <your-repo-url>
cd "Custom-Google Form"
```

2. Serve the folder locally (recommended to use an HTTP server rather than double-clicking `index.html`):

Python 3:

```bash
python3 -m http.server 8000
```

Node (http-server):

```bash
npx http-server -p 8000
```

Open http://localhost:8000 in your browser.

Notes:

- Using a simple HTTP server gives a more accurate runtime environment, especially for testing POSTs and for browser security contexts.

## Configure Google Forms submission

Before submitting, set the Google Form endpoint in `script.js`.

1. Open `script.js` and find the `GOOGLE_FORM_URL` constant near the top:

```js
const GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/{FORM_ID}/formResponse";
```

2. Replace `{FORM_ID}` with your Google Form's ID (the long ID in the form `action` URL).

3. Verify the mapping in `GOOGLE_FORM_ENTRIES` matches the Google Form entry IDs. The map keys are the local field names; values are the Google Form `entry.<id>` strings.

Important implementation detail:

- The script uses `fetch` with `mode: "no-cors"` to POST to Google Forms. This prevents CORS errors but makes the response opaque — the browser cannot read server-side errors. Use the Google Form's Responses tab to verify delivery.

## Field mappings and hidden inputs

`index.html` contains hidden `<input name="entry.<id>">` elements that correspond to Google Form entry IDs. `script.js` populates these hidden inputs before submission for traceability and easier debugging. If you add/remove questions in your Google Form, update both the `GOOGLE_FORM_ENTRIES` map and the hidden inputs.

## Accessibility & privacy notes

- Screen-reader announcements are provided via the `#sr-announcements` aria-live region.
- The form respects `prefers-reduced-motion` and `prefers-contrast` user settings.
- The form autosaves data to `localStorage` under `multiStepFormData`. If you prefer not to persist user input locally, remove or disable `setupAutosave()` in `script.js`.
- A honeypot input (`website_url`) helps reduce automated spam. Keep it unless you replace it with another anti-spam approach.

## Development notes

- Validation rules and mappings are implemented in `script.js`. If you need to change validation behavior, update or extract the validation functions at the top of the file.
- The form enforces a minimum time-to-complete (10 seconds) to reduce bot submissions. Adjust `formStartTime` logic if necessary.
- Disposable email blocking is based on a small array `DISPOSABLE_DOMAINS`; expand as needed.

Local debugging tips:

- Check browser console for errors.
- Use the Network tab to inspect outgoing `POST` entries. In `no-cors` mode, the request will be opaque but you can confirm that a request was made.

## Troubleshooting

- Submit appears to succeed but no response in Google Forms:

  - Confirm `GOOGLE_FORM_URL` and `GOOGLE_FORM_ENTRIES` IDs are correct.
  - Ensure the Google Form accepts anonymous responses (doesn't require sign-in).

- Validation prevents moving forward:

  - Look for error messages below inputs.
  - Ensure required radio/checkbox groups have at least one selection.

- Form shows JS errors on load:
  - Open DevTools and inspect the console. Most runtime issues are caused by DOM IDs or missing elements if the HTML was modified.

## Tests and CI (suggested)

- Add unit tests for the validation helpers (Jest + jsdom) to cover edge cases.
- Add a simple GitHub Actions workflow to run linting and tests on PRs.

Example `package.json` (optional) for adding a test script:

```json
{
  "name": "multi-step-form",
  "version": "0.1.0",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "jsdom": "^22.0.0"
  }
}
```

## Recommended next steps

- Add automated tests for validation logic.
- Add a serverless proxy (Netlify/Vercel) to forward submissions to Google Forms. This removes the need for `no-cors` and lets you observe server responses and implement retries.
- Add an integration test (Cypress) for the multi-step flow.

## Contributing

Contributions are welcome. Suggested workflow:

1. Open an issue describing the feature or bug.
2. Fork the repo and create a feature branch.
3. Add tests for new logic if applicable.
4. Submit a pull request with a clear description and testing steps.

## License

Add a `LICENSE` file to this repository. If you prefer MIT, create a `LICENSE` containing the MIT license text.

---

If you want, I can:

- Add this README to the repo (done).
- Add a simple GitHub Actions workflow to run lint/tests.
- Create a tiny serverless function to proxy submissions (Netlify/Vercel) and update the code to use it (removes `no-cors`).

Which of the above would you like me to do next?

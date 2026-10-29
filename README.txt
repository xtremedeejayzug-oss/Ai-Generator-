# WHISTER AI Image Studio

## What this provides
- Frontend HTML with phone gallery/file upload, prompt input, image preview, and download.
- Backend endpoint that edits an uploaded image or generates a new image from text.
- The OpenAI API key stays on the backend as an environment variable.

## Deploy backend to Render
1. Create a new GitHub repository and upload `server.js` and `package.json`.
2. In Render, create a **Web Service** from that repository.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable `OPENAI_API_KEY` with your own API key. Never put it in the HTML or share it publicly.
6. Optional environment variable: `OPENAI_IMAGE_MODEL` (default `gpt-image-2.5-sunburst`).
7. Deploy. Test `https://YOUR-SERVICE.onrender.com/health`; it should return JSON with `ok: true`.

## Connect the HTML
Open `WHISTER_AI_IMAGE_STUDIO.html` and change:
`const API_URL = 'http://localhost:3000/api/generate';`
to:
`const API_URL = 'https://YOUR-SERVICE.onrender.com/api/generate';`
Then publish the HTML to Netlify.

## Important
- Image generation/editing uses your OpenAI API account and may incur charges. ChatGPT subscription and API billing are separate.
- Do not put API keys in HTML, GitHub, or screenshots.
- Configure `ALLOWED_ORIGIN` on Render to your website origin, for example `https://your-site.netlify.app`, if you want to restrict browser access.
- This starter returns the generated image as a base64 data URL. For production/high traffic, use object storage for output images.

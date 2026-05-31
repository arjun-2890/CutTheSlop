"use strict";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
// Keeping your preferred model name
const GEMINI_MODEL = "gemini-3.5-flash";
const MAX_OUTPUT_TOKENS = 2048;
const TEMPERATURE = 0.3;

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are a content distillation engine. Your job is to take raw webpage text and return only the essential, meaningful content.

Rules:
- Remove all ads, cookie notices, navigation links, subscription prompts, social sharing buttons, and filler text.
- Keep the core article, blog post, documentation, or factual content.
- Format the final output strictly in clean HTML (using <h2>, <h3>, <p>, <ul>, <li>, <strong>) so it can be injected directly into a webpage.
- Do NOT use markdown. Do NOT wrap the output in \`\`\`html or any codeblocks. Return ONLY the raw HTML elements.
- Do NOT add commentary, opinions, or introductions like "Here is the summary:".
- Do NOT include the page title as a heading unless it is part of the body content.
- Output clean, readable prose. Be concise but complete.`;

// ---------------------------------------------------------------------------
// Helper: Fetch with Automatic Retry Logic for BOTH 503 and 429 Errors
// ---------------------------------------------------------------------------
async function fetchWithRetry(url, options, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);

      // FIXED: Added res.status === 429 to automatically catch and wait during rate limits
      if ((res.status === 429 || res.status === 503) && i < retries - 1) {
        console.warn(
          `Gemini encountered ${res.status}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2.5; // Exponential Backoff (Wait progressively longer)
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
}

// ---------------------------------------------------------------------------
// Gemini API call (UPDATED: Now takes dynamic apiURL based on saved key)
// ---------------------------------------------------------------------------
async function callGeminiAPI(pageTitle, pageText, apiURL) {
  const combinedPrompt = `${SYSTEM_PROMPT}\n\n---\n\nPage title: "${pageTitle}"\n\n---\n\nRaw Text to analyze:\n${pageText}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: combinedPrompt }],
      },
    ],
    generationConfig: {
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    },
  };

  const res = await fetchWithRetry(apiURL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error(
        "Google API Rate limit reached. Please wait 10 seconds and try again.",
      );
    }
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text.trim();
}

// ---------------------------------------------------------------------------
// Message listener (UPDATED: Fetches key dynamically from chrome.storage.local)
// ---------------------------------------------------------------------------
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== "FETCH_GEMINI") return false;

  const { pageTitle = "Untitled", pageText = "" } = message;

  chrome.storage.local.get(["gemini_api_key"], (result) => {
    const savedKey = result.gemini_api_key ? result.gemini_api_key.trim() : "";

    if (
      !savedKey ||
      savedKey === "" ||
      savedKey === "Add YOUR GEMINI API KEY HERE"
    ) {
      sendResponse({
        success: false,
        error:
          "Gemini API key is not set. Please enter your API Key in the extension popup settings.",
      });
      return;
    }

    const dynamicApiURL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${savedKey}`;

    callGeminiAPI(pageTitle, pageText, dynamicApiURL)
      .then((cleanedText) => sendResponse({ success: true, cleanedText }))
      .catch((err) => {
        console.error("[CutTheSlop] background error:", err);
        sendResponse({ success: false, error: err.message });
      });
  });

  return true;
});
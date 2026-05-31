(() => {
  "use strict";

  const cleanBtn = document.getElementById("clean-btn");
  const restoreBtn = document.getElementById("restore-btn");
  const statusText = document.getElementById("status-text");
  const btnLabel = document.getElementById("btn-label");
  const btnIcon = document.getElementById("btn-icon");
  const btnSpinner = document.getElementById("btn-spinner");

  // --- State Helpers (Maintains your exact logic style) ---
  function setLoading(isLoading) {
    cleanBtn.disabled = isLoading;
    if (isLoading) {
      cleanBtn.classList.add("loading");
    } else {
      cleanBtn.classList.remove("loading");
    }
    btnIcon.classList.toggle("hidden", isLoading);
    btnSpinner.classList.toggle("hidden", !isLoading);
    btnLabel.textContent = isLoading ? "Cleaning…" : "Clean Page";
  }

  function setStatus(message, type = "info") {
    const colors = {
      info: "text-gray-400",
      success: "text-emerald-400",
      error: "text-red-400",
      warning: "text-amber-400",
    };
    // Keep your exact class style framework mapping
    statusText.className = `cts-description ${colors[type] ?? colors.info}`;
    statusText.textContent = message;
  }

  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  }

  // --- Main Extraction Action Pipeline ---
  cleanBtn.addEventListener("click", async () => {
    const tab = await getActiveTab();

    if (!tab?.id) {
      setStatus("Could not access the current tab.", "error");
      return;
    }

    if (
      !tab.url ||
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://")
    ) {
      setStatus("This page cannot be cleaned.", "warning");
      return;
    }

    setLoading(true);
    setStatus("Injecting content script…", "info");

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      setStatus("Extracting page content…", "info");

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "CLEAN_PAGE",
      });

      if (response?.success) {
        setStatus("Page cleaned successfully!", "success");
        cleanBtn.classList.add("done");
        btnLabel.textContent = "Page Cleaned!";
        restoreBtn.classList.remove("hidden");
      } else {
        throw new Error(
          response?.error ?? "Unknown error from content script.",
        );
      }
    } catch (err) {
      console.error("[CutTheSlop] popup error:", err);
      const msg = err.message?.includes("Cannot access")
        ? "Cannot access this page type."
        : (err.message ?? "Something went wrong.");
      setStatus(msg, "error");
    } finally {
      setLoading(false);
    }
  });

  // --- Restore Original View Action ---
  restoreBtn.addEventListener("click", async () => {
    const tab = await getActiveTab();
    if (!tab?.id) return;

    try {
      await chrome.tabs.sendMessage(tab.id, { action: "RESTORE_PAGE" });
      restoreBtn.classList.add("hidden");
      cleanBtn.classList.remove("done");
      btnLabel.textContent = "Clean Page";
      setStatus("Original page restored.", "info");
    } catch (err) {
      console.error("[CutTheSlop] restore error:", err);
    }
  });

  document.addEventListener("DOMContentLoaded", async () => {
    const apiKeyInput = document.getElementById("api-key-input");
    const saveKeyBtn = document.getElementById("save-key-btn");
    const apiKeyStatus = document.getElementById("api-key-status");

    chrome.storage.local.get(["gemini_api_key"], (result) => {
      if (result.gemini_api_key) {
        apiKeyInput.value = result.gemini_api_key;
        setKeyStatus("Key is configured", "success");
      } else {
        setKeyStatus("Please enter your Gemini API Key", "warning");
      }
    });

    saveKeyBtn.addEventListener("click", () => {
      const key = apiKeyInput.value.trim();
      if (!key) {
        setKeyStatus("Key cannot be empty!", "error");
        return;
      }

      chrome.storage.local.set({ gemini_api_key: key }, () => {
        setKeyStatus("Key saved successfully!", "success");
        setTimeout(() => {
          setKeyStatus("Key is configured", "success");
        }, 2000);
      });
    });

    function setKeyStatus(message, type) {
      const colors = {
        success: "text-emerald-400",
        error: "text-red-400",
        warning: "text-amber-400",
      };
      apiKeyStatus.className = `cts-description ${colors[type] || "text-gray-400"}`;
      apiKeyStatus.textContent = message;
    }
  });
})();
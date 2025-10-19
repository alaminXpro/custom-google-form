(function () {
  "use strict";

  const GOOGLE_FORM_URL =
    "https://docs.google.com/forms/d/e/{FORM_ID}/formResponse";

  const GOOGLE_FORM_ENTRIES = {
    name: "entry.631000131",
    business_name: "entry.1981656635",
    business_email: "entry.1146736747",
    website: "entry.1783536233",
    facebook: "entry.823750113",
    instagram: "entry.1172185507",
    other_platforms: "entry.692704042",
    business_details: "entry.1219352153",
    business_type: "entry.117546879",
    core_category: "entry.1354342209",
    sales_channels: "entry.1495825747",
    avg_daily_orders: "entry.397747529",
    avg_ticket_size: "entry.1258084637",
    ai_timeline: "entry.103247370",
  };

  const DISPOSABLE_DOMAINS = [
    "tempmail.com",
    "throwaway.email",
    "guerrillamail.com",
    "mailinator.com",
    "10minutemail.com",
    "trashmail.com",
    "temp-mail.org",
    "fakeinbox.com",
  ];

  let currentStep = 1;
  const totalSteps = 4;
  let formStartTime = Date.now();

  window.dataLayer = window.dataLayer || [];

  const form = document.getElementById("multi-step-form");
  const steps = document.querySelectorAll(".form-step");
  const progressBar = document.querySelector(".progress__bar");
  const stepCounter = document.getElementById("current-step");
  const nextBtn = document.getElementById("next-btn");
  const backBtn = document.getElementById("back-btn");
  const submitBtn = document.getElementById("submit-btn");
  const successMessage = document.getElementById("success-message");
  const srAnnouncements = document.getElementById("sr-announcements");

  init();

  function init() {
    restoreFormData();
    setupEventListeners();
    setupAutosave();
    fireAnalyticsEvent("form_step_view", { step: 1, path: "/book-demo" });
  }

  function setupEventListeners() {
    nextBtn.addEventListener("click", handleNext);
    backBtn.addEventListener("click", handleBack);
    form.addEventListener("submit", handleSubmit);

    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (currentStep < totalSteps) {
          handleNext();
        } else {
          handleSubmit(e);
        }
      }
    });

    const businessDetails = document.getElementById("business_details");
    businessDetails.addEventListener("input", updateWordCount);

    form.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => clearError(field));
    });

    form
      .querySelectorAll('input[type="radio"], input[type="checkbox"]')
      .forEach((field) => {
        field.addEventListener("change", () => {
          const fieldName = field.name || field.id;
          clearErrorByName(fieldName);
        });
      });
  }

  function setupAutosave() {
    form.querySelectorAll("input, textarea, select").forEach((field) => {
      field.addEventListener("input", () => {
        saveFormData();
      });
    });
  }

  function saveFormData() {
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
      if (key === "sales_channels") {
        data[key] = data[key] || [];
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    localStorage.setItem("multiStepFormData", JSON.stringify(data));
  }

  function restoreFormData() {
    const savedData = localStorage.getItem("multiStepFormData");
    if (!savedData) return;

    try {
      const data = JSON.parse(savedData);

      for (let [key, value] of Object.entries(data)) {
        if (key === "sales_channels" && Array.isArray(value)) {
          value.forEach((val) => {
            const checkbox = form.querySelector(
              `input[name="sales_channels"][value="${val}"]`
            );
            if (checkbox) checkbox.checked = true;
          });
        } else {
          const field = form.querySelector(`[name="${key}"]`);
          if (field) {
            if (field.type === "radio") {
              const radio = form.querySelector(
                `input[name="${key}"][value="${value}"]`
              );
              if (radio) radio.checked = true;
            } else {
              field.value = value;
            }
          }
        }
      }

      const businessDetails = document.getElementById("business_details");
      if (businessDetails.value) {
        updateWordCount.call(businessDetails);
      }
    } catch (e) {
      console.error("Error restoring form data:", e);
    }
  }

  function handleNext() {
    if (!validateCurrentStep()) {
      announceToScreenReader("Please fix the errors before proceeding");
      return;
    }

    if (currentStep < totalSteps) {
      fireAnalyticsEvent("form_step_next", {
        from: currentStep,
        to: currentStep + 1,
      });
      currentStep++;
      updateStepDisplay();
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      currentStep--;
      updateStepDisplay();
    }
  }

  function validateCurrentStep() {
    const currentStepEl = document.querySelector(
      `.form-step[data-step="${currentStep}"]`
    );
    const fields = currentStepEl.querySelectorAll("input, textarea, select");
    let isValid = true;

    const validatedGroups = new Set();

    fields.forEach((field) => {
      const fieldName = field.name || field.id;
      if (field.type === "radio" || field.type === "checkbox") {
        if (!validatedGroups.has(fieldName)) {
          validatedGroups.add(fieldName);
          if (!validateFieldGroup(fieldName, field.type)) {
            isValid = false;
          }
        }
      } else {
        if (!validateField(field)) {
          isValid = false;
        }
      }
    });

    return isValid;
  }

  function validateFieldGroup(fieldName, fieldType) {
    const fields = document.querySelectorAll(`[name="${fieldName}"]`);
    const firstField = fields[0];
    if (!firstField) return true;

    if (
      fieldName !== "sales_channels" &&
      !firstField.hasAttribute("required")
    ) {
      clearError(firstField);
      return true;
    }

    const isSelected = Array.from(fields).some((field) => {
      if (fieldType === "checkbox") {
        return field.checked;
      } else if (fieldType === "radio") {
        return field.checked;
      }
      return false;
    });

    if (!isSelected) {
      let errorMessage = "This field is required";
      if (fieldName === "sales_channels") {
        errorMessage = "Please select at least one sales channel";
      } else if (fieldName === "business_type") {
        errorMessage = "Please select a business type";
      } else if (fieldName === "ai_timeline") {
        errorMessage = "Please select a timeline";
      }

      showError(fieldName, errorMessage);
      return false;
    }

    clearError(firstField);
    return true;
  }

  function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name || field.id;

    if (field.type === "hidden" || fieldName === "website_url") {
      return true;
    }
    if (field.type === "radio" || field.type === "checkbox") {
      return true;
    }

    // Required field validation
    if (field.hasAttribute("required") && !value) {
      showError(fieldName, "This field is required");
      return false;
    }

    // Name validation (letters and spaces only)
    if (fieldName === "name") {
      const namePattern = /^[a-zA-Z\s]+$/;
      if (value && !namePattern.test(value)) {
        showError(fieldName, "Name should contain only letters and spaces");
        return false;
      }
      if (value.length < 2 || value.length > 60) {
        showError(fieldName, "Name must be between 2 and 60 characters");
        return false;
      }
    }

    // Business name validation
    if (fieldName === "business_name") {
      if (value.length < 2 || value.length > 80) {
        showError(
          fieldName,
          "Business name must be between 2 and 80 characters"
        );
        return false;
      }
    }

    // Email validation
    if (fieldName === "business_email" && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        showError(fieldName, "Please enter a valid email address");
        return false;
      }

      // Block disposable domains
      const domain = value.split("@")[1];
      if (DISPOSABLE_DOMAINS.includes(domain)) {
        showError(fieldName, "Please use a business email address");
        return false;
      }
    }

    // URL validation
    if (
      (fieldName === "website" ||
        fieldName === "facebook" ||
        fieldName === "instagram") &&
      value
    ) {
      if (!value.startsWith("http://") && !value.startsWith("https://")) {
        showError(fieldName, "URL must start with http:// or https://");
        return false;
      }

      // Platform-specific validation
      if (fieldName === "facebook" && !value.includes("facebook.com")) {
        showError(fieldName, "Please enter a valid Facebook URL");
        return false;
      }
      if (fieldName === "instagram" && !value.includes("instagram.com")) {
        showError(fieldName, "Please enter a valid Instagram URL");
        return false;
      }
    }

    // Business details word count
    if (fieldName === "business_details" && value) {
      const wordCount = value.split(/\s+/).filter((w) => w.length > 0).length;
      if (wordCount < 10) {
        showError(fieldName, "Please provide at least 10 words");
        return false;
      }
      if (wordCount > 300) {
        showError(fieldName, "Please keep it under 300 words");
        return false;
      }
    }

    // Average daily orders
    if (fieldName === "avg_daily_orders" && value) {
      const num = parseInt(value);
      if (isNaN(num) || num < 0 || num > 10000) {
        showError(fieldName, "Please enter a number between 0 and 10,000");
        return false;
      }
    }

    // Average ticket size
    if (fieldName === "avg_ticket_size" && value) {
      if (value.length < 1) {
        showError(fieldName, "Please enter the average ticket size");
        return false;
      }
    }

    clearError(field);
    return true;
  }

  // Show Error
  function showError(fieldName, message) {
    const errorEl = document.getElementById(`${fieldName}-error`);
    const fields = form.querySelectorAll(`[name="${fieldName}"]`);

    if (errorEl) {
      errorEl.textContent = message;
    }

    // Mark all fields with this name as invalid (for radio/checkbox groups)
    if (fields.length > 0) {
      fields.forEach((field) => {
        field.classList.add("error");
        field.setAttribute("aria-invalid", "true");
      });
    }

    // Fire analytics event
    fireAnalyticsEvent("form_validation_error", {
      step: currentStep,
      field: fieldName,
      message: message,
    });
  }

  // Clear Error
  function clearError(field) {
    const fieldName = field.name || field.id;
    clearErrorByName(fieldName);

    field.classList.remove("error");
    field.setAttribute("aria-invalid", "false");
  }

  // Clear Error by Field Name (useful for radio/checkbox groups)
  function clearErrorByName(fieldName) {
    const errorEl = document.getElementById(`${fieldName}-error`);
    if (errorEl) {
      errorEl.textContent = "";
    }

    // Clear error class from all fields with this name
    const fields = document.querySelectorAll(`[name="${fieldName}"]`);
    fields.forEach((field) => {
      field.classList.remove("error");
      field.setAttribute("aria-invalid", "false");
    });
  }

  // Update Step Display
  function updateStepDisplay() {
    // Hide all steps
    steps.forEach((step) => {
      step.classList.remove("form-step--active");
    });

    // Show current step
    const currentStepEl = document.querySelector(
      `.form-step[data-step="${currentStep}"]`
    );
    currentStepEl.classList.add("form-step--active");

    // Update progress bar
    const progress = (currentStep / totalSteps) * 100;
    progressBar.style.width = `${progress}%`;

    // Update step counter
    stepCounter.textContent = currentStep;

    // Update buttons
    backBtn.classList.toggle("hidden", currentStep === 1);
    nextBtn.classList.toggle("hidden", currentStep === totalSteps);
    submitBtn.classList.toggle("hidden", currentStep !== totalSteps);

    // Announce to screen reader
    announceToScreenReader(`Step ${currentStep} of ${totalSteps}`);

    // Fire analytics
    fireAnalyticsEvent("form_step_view", {
      step: currentStep,
      path: "/book-demo",
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Update Word Count
  function updateWordCount() {
    const text = this.value.trim();
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
    const countEl = document.getElementById("business_details-count");

    if (countEl) {
      if (wordCount === 0) {
        countEl.textContent = `0 words (optional)`;
        countEl.classList.add("text-gray-500");
        countEl.classList.remove("text-red-500");
      } else {
        countEl.textContent = `${wordCount} words (min 10, max 300 if provided)`;

        if (wordCount < 10 || wordCount > 300) {
          countEl.classList.add("text-red-500");
          countEl.classList.remove("text-gray-500");
        } else {
          countEl.classList.add("text-gray-500");
          countEl.classList.remove("text-red-500");
        }
      }
    }
  }

  // 'Others' free-text input removed

  // Handle Form Submit
  async function handleSubmit(e) {
    e.preventDefault();

    // Check honeypot
    if (document.getElementById("website_url").value !== "") {
      return;
    }

    // Check time-to-complete (minimum 10 seconds to prevent bots)
    const timeToComplete = (Date.now() - formStartTime) / 1000;
    if (timeToComplete < 10) {
      showToast("Please take your time to fill out the form", "error");
      return;
    }

    // Validate all steps
    if (!validateCurrentStep()) {
      announceToScreenReader("Please fix the errors before submitting");
      return;
    }

    // Show loading state
    setLoadingState(true);

    // Collect form data
    const formData = collectFormData();

    try {
      // Populate hidden entry inputs (so local form reflects what will be sent)
      populateHiddenEntries(formData);
      // Submit to Google Form
      await submitToGoogleForm(formData);

      // Success
      handleSuccess(formData);
    } catch (error) {
      console.error("Submission error:", error);
      handleError();
    } finally {
      setLoadingState(false);
    }
  }

  // Submit to Google Form
  async function submitToGoogleForm(data) {
    // Create FormData for Google Form submission
    const formDataToSubmit = new FormData();

    // Helper to append only non-empty values
    const appendIfExists = (entryKey, value) => {
      if (value !== null && value !== undefined && value !== "") {
        formDataToSubmit.append(entryKey, value);
      }
    };

    // Map each field to its Google Form entry ID (required fields)
    formDataToSubmit.append(GOOGLE_FORM_ENTRIES.name, data.name || "");
    formDataToSubmit.append(
      GOOGLE_FORM_ENTRIES.business_name,
      data.business_name || ""
    );
    formDataToSubmit.append(
      GOOGLE_FORM_ENTRIES.business_email,
      data.business_email || ""
    );
    formDataToSubmit.append(GOOGLE_FORM_ENTRIES.website, data.website || "");
    formDataToSubmit.append(
      GOOGLE_FORM_ENTRIES.business_type,
      data.business_type || ""
    );
    formDataToSubmit.append(
      GOOGLE_FORM_ENTRIES.core_category,
      data.core_category || ""
    );
    formDataToSubmit.append(
      GOOGLE_FORM_ENTRIES.avg_daily_orders,
      data.avg_daily_orders || ""
    );
    formDataToSubmit.append(
      GOOGLE_FORM_ENTRIES.ai_timeline,
      data.ai_timeline || ""
    );

    // Optional fields (only append if they have values)
    appendIfExists(GOOGLE_FORM_ENTRIES.facebook, data.facebook);
    appendIfExists(GOOGLE_FORM_ENTRIES.instagram, data.instagram);
    appendIfExists(GOOGLE_FORM_ENTRIES.other_platforms, data.other_platforms);
    appendIfExists(GOOGLE_FORM_ENTRIES.business_details, data.business_details);
    appendIfExists(GOOGLE_FORM_ENTRIES.avg_ticket_size, data.avg_ticket_size);

    // Sales channels: append each selected channel as a separate field entry
    // so Google Forms records each checkbox selection individually
    if (Array.isArray(data.sales_channels) && data.sales_channels.length > 0) {
      data.sales_channels.forEach((channel) => {
        formDataToSubmit.append(GOOGLE_FORM_ENTRIES.sales_channels, channel);
      });
    }

    // submit

    // Submit to Google Form (using no-cors mode for cross-origin)
    const response = await fetch(GOOGLE_FORM_URL, {
      method: "POST",
      mode: "no-cors", // Required for Google Forms CORS
      body: formDataToSubmit,
    });

    // Using 'no-cors' for Google Forms; cannot inspect response
    return response;
  }

  // Populate hidden `entry.*` inputs in the local form for traceability (optional)
  function populateHiddenEntries(data) {
    try {
      const map = GOOGLE_FORM_ENTRIES;

      // Simple mapping: set the hidden input value if it exists in DOM
      const setIfExists = (entryName, value) => {
        const el = document.querySelector(`input[name="${entryName}"]`);
        if (el) el.value = value || "";
      };

      setIfExists(map.name, data.name);
      setIfExists(map.business_name, data.business_name);
      setIfExists(map.business_email, data.business_email);
      setIfExists(map.website, data.website);
      setIfExists(map.facebook, data.facebook);
      setIfExists(map.instagram, data.instagram);
      setIfExists(map.other_platforms, data.other_platforms);
      setIfExists(map.business_details, data.business_details);
      setIfExists(map.business_type, data.business_type);
      setIfExists(map.core_category, data.core_category);
      // For sales channels, join with comma for the hidden input; checkboxes are submitted separately
      setIfExists(map.sales_channels, data.sales_channels.join(", "));
      setIfExists(map.avg_daily_orders, data.avg_daily_orders);
      setIfExists(map.avg_ticket_size, data.avg_ticket_size);
      setIfExists(map.ai_timeline, data.ai_timeline);

      // UTM and meta
      if (map.utm_source) setIfExists(map.utm_source, data.utm.source);
      if (map.utm_medium) setIfExists(map.utm_medium, data.utm.medium);
      if (map.utm_campaign) setIfExists(map.utm_campaign, data.utm.campaign);
      if (map.referrer) setIfExists(map.referrer, data.meta.referrer);
    } catch (e) {
      // ignore populate hidden entries errors
    }
  }

  // Collect Form Data
  function collectFormData() {
    const formDataObj = new FormData(form);
    const data = {
      name: formDataObj.get("name") || "",
      business_name: formDataObj.get("business_name") || "",
      business_email: formDataObj.get("business_email") || "",
      website: formDataObj.get("website") || "",
      facebook: formDataObj.get("facebook") || "",
      instagram: formDataObj.get("instagram") || "",
      other_platforms: formDataObj.get("other_platforms") || "",
      business_details: formDataObj.get("business_details") || "",
      business_type: formDataObj.get("business_type") || "",
      core_category: formDataObj.get("core_category") || "",
      sales_channels: [],
      avg_daily_orders: formDataObj.get("avg_daily_orders") || "",
      avg_ticket_size: formDataObj.get("avg_ticket_size") || "",
      ai_timeline: formDataObj.get("ai_timeline") || "",
      utm: {
        source: formDataObj.get("utm_source") || "",
        medium: formDataObj.get("utm_medium") || "",
        campaign: formDataObj.get("utm_campaign") || "",
        content: formDataObj.get("utm_content") || "",
        term: formDataObj.get("utm_term") || "",
      },
      meta: {
        referrer: formDataObj.get("referrer") || "",
        page_path: formDataObj.get("page_path") || "/book-demo",
        timestamp: new Date().toISOString(),
      },
    };

    // Collect sales channels
    const checkboxes = form.querySelectorAll(
      'input[name="sales_channels"]:checked'
    );
    checkboxes.forEach((cb) => {
      data.sales_channels.push(cb.value);
    });

    return data;
  }

  // Handle Success
  function handleSuccess(formData) {
    // Update progress to 100%
    progressBar.style.width = "100%";

    // Hide form, show success message
    form.classList.add("hidden");
    successMessage.classList.remove("hidden");

    fireAnalyticsEvent("form_submit", {
      valid: true,
      lead_type: formData.business_type,
    });

    // Clear localStorage
    localStorage.removeItem("multiStepFormData");

    // Announce success
    announceToScreenReader("Form submitted successfully! Thank you.");
  }

  // Handle Error
  function handleError() {
    showToast("Could not submit. Please try again.", "error");
  }

  // Set Loading State
  function setLoadingState(isLoading) {
    const submitBtnText = document.getElementById("submit-btn-text");
    const submitBtnSpinner = document.getElementById("submit-btn-spinner");

    if (isLoading) {
      submitBtn.disabled = true;
      submitBtnText.classList.add("hidden");
      submitBtnSpinner.classList.remove("hidden");
    } else {
      submitBtn.disabled = false;
      submitBtnText.classList.remove("hidden");
      submitBtnSpinner.classList.add("hidden");
    }
  }

  // Show Toast Notification
  function showToast(message, type = "error") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    if (type === "success") {
      toast.style.background = "#10b981";
    }

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  // Fire Analytics Event
  function fireAnalyticsEvent(eventName, eventData) {
    if (window.dataLayer) {
      window.dataLayer.push({
        event: eventName,
        ...eventData,
      });
    }
  }

  // Announce to Screen Reader
  function announceToScreenReader(message) {
    if (srAnnouncements) {
      srAnnouncements.textContent = message;
      setTimeout(() => {
        srAnnouncements.textContent = "";
      }, 1000);
    }
  }

  // end
})();

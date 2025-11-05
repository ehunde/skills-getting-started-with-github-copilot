// Main client-side logic for activities page
document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("email-error");

  // Helper to create initials from an email (before '@')
  function getInitials(email) {
    const namePart = (email || "").split("@")[0];
    const parts = namePart.split(/[._-]+/).filter(Boolean);
    const initials = parts.length
      ? parts.map(p => p[0].toUpperCase()).slice(0, 2).join("")
      : (namePart[0] || "?").toUpperCase();
    return initials;
  }

  // Function to fetch activities from API and populate UI
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and previous content
      activitiesList.innerHTML = "";

      // Reset activity select (preserve default option)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = Array.isArray(details.participants) ? details.participants : [];
        let participantsHTML;
        if (participants.length) {
          participantsHTML = `
            <div class="participants-section">
              <h5>Participants <span class="participant-count">${participants.length}</span></h5>
              <ul class="participants-list">
                ${participants
                  .map(
                    (p) => `
                    <li class="participant-item">
                      <span class="avatar">${getInitials(p)}</span>
                      <span class="participant-email">${p}</span>
                    </li>`
                  )
                  .join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <h5>Participants <span class="participant-count">0</span></h5>
              <p class="info">No participants yet. Be the first to sign up!</p>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Email input validation
  emailInput.addEventListener("input", () => {
    if (!emailInput.value.endsWith("@mergington.edu")) {
      emailError.textContent = "Please use your Mergington school email";
      emailError.classList.remove("hidden");
    } else {
      emailError.classList.add("hidden");
    }
  });

  // Handle sign-up form submission and show feedback
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = event.target.querySelector("button[type=submit]");
    const originalText = submitButton.textContent;

    submitButton.disabled = true;
    submitButton.innerHTML = `<span class="loading-spinner"></span> ${submitButton.dataset.loadingText}`;

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh activities to show new participant immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });

  // Initialize app by loading activities
  fetchActivities();
});

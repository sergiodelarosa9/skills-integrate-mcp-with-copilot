document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const loginForm = document.getElementById("login-form");
  const authInfo = document.getElementById("auth-info");
  const currentUserLabel = document.getElementById("current-user");
  const logoutButton = document.getElementById("logout-btn");
  const emailInput = document.getElementById("email");

  const authState = {
    token: localStorage.getItem("auth_token") || null,
    user: null,
  };

  function authHeaders() {
    if (!authState.token) {
      return {};
    }

    return {
      Authorization: `Bearer ${authState.token}`,
    };
  }

  function canManageParticipants() {
    return ["teacher", "admin", "leader"].includes(authState.user?.role);
  }

  function updateAuthUI() {
    if (authState.user) {
      loginForm.classList.add("hidden");
      authInfo.classList.remove("hidden");
      currentUserLabel.textContent = `${authState.user.username} (${authState.user.role})`;

      signupForm.querySelector("button[type='submit']").disabled = false;
      activitySelect.disabled = false;
      emailInput.disabled = false;

      if (authState.user.role === "student") {
        emailInput.value = authState.user.email;
        emailInput.disabled = true;
      }
    } else {
      loginForm.classList.remove("hidden");
      authInfo.classList.add("hidden");
      currentUserLabel.textContent = "";
      signupForm.querySelector("button[type='submit']").disabled = true;
      activitySelect.disabled = true;
      emailInput.disabled = true;
      emailInput.value = "";
    }
  }

  async function loadCurrentUser() {
    if (!authState.token) {
      authState.user = null;
      updateAuthUI();
      return;
    }

    try {
      const response = await fetch("/auth/me", {
        headers: {
          ...authHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error("Session expired");
      }

      const result = await response.json();
      authState.user = result.user;
      updateAuthUI();
    } catch (error) {
      authState.token = null;
      authState.user = null;
      localStorage.removeItem("auth_token");
      updateAuthUI();
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        canManageParticipants()
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      if (canManageParticipants()) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!authState.user) {
      messageDiv.textContent = "Please login first.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: {
            ...authHeaders(),
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!authState.user) {
      messageDiv.textContent = "Please login before signing up students.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            ...authHeaders(),
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        if (authState.user.role !== "student") {
          signupForm.reset();
        }

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        messageDiv.textContent = result.detail || "Login failed.";
        messageDiv.className = "error";
      } else {
        authState.token = result.access_token;
        authState.user = result.user;
        localStorage.setItem("auth_token", authState.token);
        updateAuthUI();
        fetchActivities();
        loginForm.reset();
        messageDiv.textContent = `Logged in as ${result.user.username} (${result.user.role}).`;
        messageDiv.className = "success";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Login failed. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      if (authState.token) {
        await fetch("/auth/logout", {
          method: "POST",
          headers: {
            ...authHeaders(),
          },
        });
      }
    } finally {
      authState.token = null;
      authState.user = null;
      localStorage.removeItem("auth_token");
      updateAuthUI();
      fetchActivities();
      messageDiv.textContent = "Logged out.";
      messageDiv.className = "info";
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 3000);
    }
  });

  // Initialize app
  loadCurrentUser().then(fetchActivities);
});

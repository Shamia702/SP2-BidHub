import { AUCTION_URL, API_KEY } from "../api/config.js";
import { getUser, getToken, updateUser } from "../utils/storage.js";

const form = document.querySelector("#editProfileForm");
const alertBox = document.querySelector("#editProfileAlert");
const submitBtn = document.querySelector("#editProfileSubmit");

function requireAuth() {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    window.location.href = "/auth/login.html";
    return null;
  }

  return user;
}

function showAlert(type, message) {
  if (!alertBox) return;
  alertBox.className = `alert alert-${type}`;
  alertBox.textContent = message;
  alertBox.classList.remove("d-none");
}

function clearAlert() {
  if (!alertBox) return;
  alertBox.classList.add("d-none");
  alertBox.textContent = "";
}

async function fetchProfile(name, token) {
  const res = await fetch(
    `${AUCTION_URL}/profiles/${encodeURIComponent(name)}`,
    {
      headers: {
        "X-Noroff-API-Key": API_KEY,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.errors?.[0]?.message || "Could not load profile."
    );
  }

  return json.data;
}

function fillForm(profile) {
  if (!form) return;

  const avatarInput = form.avatarUrl;
  const bannerInput = form.bannerUrl;
  const bioInput = form.bio;

  if (avatarInput) {
    if (profile.avatar && typeof profile.avatar === "string") {
      avatarInput.value = profile.avatar;
    } else if (
      profile.avatar &&
      typeof profile.avatar === "object" &&
      profile.avatar.url
    ) {
      avatarInput.value = profile.avatar.url;
    }
  }

  if (bannerInput) {
    if (profile.banner && typeof profile.banner === "string") {
      bannerInput.value = profile.banner;
    } else if (
      profile.banner &&
      typeof profile.banner === "object" &&
      profile.banner.url
    ) {
      bannerInput.value = profile.banner.url;
    }
  }

  if (bioInput) {
    bioInput.value = profile.bio || "";
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  clearAlert();

  const user = requireAuth();
  const token = getToken();
  if (!user || !token) return;

  if (!form || !submitBtn) return;

  const avatarUrl = form.avatarUrl.value.trim();
  const bannerUrl = form.bannerUrl.value.trim();
  const bio = form.bio.value.trim();

  const payload = {};

  if (avatarUrl) {
    payload.avatar = {
      url: avatarUrl,
      alt: `${user.name}'s avatar`,
    };
  } else {
    payload.avatar = null;
  }

  if (bannerUrl) {
    payload.banner = {
      url: bannerUrl,
      alt: `${user.name}'s banner`,
    };
  } else {
    payload.banner = null;
  }

  payload.bio = bio || null;

  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  try {
    const res = await fetch(
      `${AUCTION_URL}/profiles/${encodeURIComponent(user.name)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Noroff-API-Key": API_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message ||
        "Could not update profile. Please try again.";
      showAlert("danger", message);
      return;
    }

    const updatedProfile = json.data;
    updateUser({
      name: updatedProfile.name,
      email: updatedProfile.email,
      avatar: updatedProfile.avatar,
      banner: updatedProfile.banner,
      credits: updatedProfile.credits,
      bio: updatedProfile.bio,
    });

    showAlert("success", "Profile updated! Redirecting…");

    setTimeout(() => {
      window.location.href = "/profile/profile.html";
    }, 900);
  } catch (error) {
    console.error(error);
    showAlert(
      "danger",
      "Something went wrong while updating your profile. Please try again."
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save changes";
  }
}

async function initEditProfile() {
  const user = requireAuth();
  const token = getToken();
  if (!user || !token) return;

  try {
    const profile = await fetchProfile(user.name, token);
    fillForm(profile);
  } catch (error) {
    console.error(error);
    showAlert("danger", error.message);
  }

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

document.addEventListener("DOMContentLoaded", initEditProfile);

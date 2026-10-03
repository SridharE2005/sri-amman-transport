// src/services/api.js
import axios from "axios";
import { finishRequest, startRequest } from "./requestTracker";

export function resolveLoadingDetails(config) {
  if (config.loadingTitle || config.loadingMessage) {
    return {
      title: config.loadingTitle || "Working on it",
      message: config.loadingMessage || "Please wait while we complete your request.",
    };
  }

  const method = (config.method || "get").toLowerCase();
  const rawUrl = (config.url || "").toLowerCase();
  const url = rawUrl.split("?")[0];

  // 1. Authentication
  if (url.includes("/auth/login")) {
    return {
      title: "Signing In",
      message: "Verifying your credentials and signing you in…",
    };
  }
  if (url.includes("/auth/send-otp")) {
    return {
      title: "Sending OTP",
      message: "Sending verification code to your email…",
    };
  }
  if (url.includes("/auth/verify-otp")) {
    return {
      title: "Verifying OTP",
      message: "Checking verification code and creating account…",
    };
  }
  if (url.includes("/auth/profile")) {
    return {
      title: "Updating Profile",
      message: "Saving your updated account information…",
    };
  }

  // 2. Bookings - Admin decisions
  if (url.includes("/bookings/") && url.includes("/confirm")) {
    return {
      title: "Confirming Booking",
      message: "Approving booking and assigning driver…",
    };
  }
  if (url.includes("/bookings/") && url.includes("/reject")) {
    return {
      title: "Rejecting Booking",
      message: "Processing booking rejection and notifying user…",
    };
  }
  if (url.includes("/bookings/") && url.includes("/revoke")) {
    return {
      title: "Revoking Booking",
      message: "Revoking booking and restoring material stock…",
    };
  }
  if (url.includes("/bookings/") && url.includes("/deliver")) {
    return {
      title: "Marking as Delivered",
      message: "Completing delivery and updating records…",
    };
  }

  // 3. Bookings - Cancellations
  if (url.includes("/cancellation-requests") && url.includes("/review")) {
    return {
      title: "Reviewing Cancellation",
      message: "Processing cancellation review decision…",
    };
  }
  if (url.includes("/cancellation-request")) {
    return {
      title: "Requesting Cancellation",
      message: "Submitting cancellation request to admin…",
    };
  }
  if (url.includes("/bookings/") && url.includes("/cancel")) {
    return {
      title: "Cancelling Booking",
      message: "Cancelling booking and restoring material…",
    };
  }

  // 4. Bookings - Placement
  if (method === "post" && (url === "/bookings" || url.endsWith("/bookings"))) {
    return {
      title: "Booking Material",
      message: "Confirming your transport order…",
    };
  }

  // 5. Admin History
  if (url.includes("/admin-history")) {
    if (method === "delete") {
      return {
        title: "Deleting History",
        message: "Removing booking history record…",
      };
    }
  }

  // 6. Goods / Stock
  if (url.includes("/goods")) {
    if (method === "post") {
      return {
        title: "Adding Material",
        message: "Saving new stock entry to catalog…",
      };
    }
    if (method === "put" || method === "patch") {
      return {
        title: "Updating Material",
        message: "Saving material and stock modifications…",
      };
    }
    if (method === "delete") {
      return {
        title: "Deleting Material",
        message: "Removing material from available inventory…",
      };
    }
  }

  // 7. Drivers
  if (url.includes("/drivers")) {
    if (method === "post") {
      return {
        title: "Adding Driver",
        message: "Adding new driver profile to fleet…",
      };
    }
    if (method === "put" || method === "patch") {
      return {
        title: "Updating Driver",
        message: "Saving driver details and assignment status…",
      };
    }
    if (method === "delete") {
      return {
        title: "Removing Driver",
        message: "Removing driver from active fleet…",
      };
    }
  }

  // 8. Messages / Enquiries
  if (url.includes("/messages")) {
    if (method === "post") {
      return {
        title: "Sending Message",
        message: "Sending your message to Sri Amman Transport…",
      };
    }
    if (method === "put" || method === "patch") {
      return {
        title: "Sending Reply",
        message: "Saving and sending reply to customer…",
      };
    }
    if (method === "delete") {
      return {
        title: "Deleting Message",
        message: "Removing message from your inbox…",
      };
    }
  }

  // 9. Feedback / Reviews
  if (url.includes("/feedback")) {
    return {
      title: "Submitting Feedback",
      message: "Recording your rating and review comments…",
    };
  }

  // Fallback messages by HTTP method
  if (method === "delete") {
    return {
      title: "Deleting Item",
      message: "Please wait while we remove this record…",
    };
  }
  if (method === "post") {
    return {
      title: "Creating Record",
      message: "Please wait while we process your request…",
    };
  }
  if (method === "put" || method === "patch") {
    return {
      title: "Saving Changes",
      message: "Please wait while we save your changes…",
    };
  }

  return {
    title: "Working on it",
    message: "Please wait while we complete your request.",
  };
}

const rawBaseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000/api";

const cleanBaseURL = rawBaseURL.trim().replace(/\/$/, "");
const baseURL = cleanBaseURL.endsWith("/api")
  ? cleanBaseURL
  : `${cleanBaseURL}/api`;

const API = axios.create({
  baseURL,
});

// Attach JWT token and track loading with function-specific message
API.interceptors.request.use((config) => {
  const method = (config.method || "get").toLowerCase();
  config._tracksLoading = ["post", "put", "patch", "delete"].includes(method);
  if (config._tracksLoading) {
    const details = resolveLoadingDetails(config);
    config._loadingRequestId = startRequest(details);
  }
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => {
    if (response.config?._tracksLoading) finishRequest(response.config._loadingRequestId);
    return response;
  },
  (error) => {
    if (error.config?._tracksLoading) finishRequest(error.config._loadingRequestId);
    return Promise.reject(error);
  },
);

export default API;


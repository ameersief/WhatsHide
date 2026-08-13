# WhatsHide & G-Maps Extractor - Master Handoff & Developer Guide

This document serves as the absolute single source of truth for the architecture, security mechanisms, database configurations, and deployment procedures for the **WhatsHide** and **G-Maps Lead Extractor** Chrome Extensions. 

Any developer, AI assistant, or system administrator inheriting these projects can use this guide to fully understand, test, modify, and deploy the codebase.

---

## 📁 Project Structures & Code Maps

### 1. WhatsHide (WhatsApp Web Privacy Extension)
**Location:** `C:\Users\AMEER\Desktop\WhatsHide`
* **`manifest.json`** (Version 5.8): Defines the extension configurations, background service workers, content scripts, and required permissions (including host permissions for WhatsApp Web, Gumroad API, and Supabase database).
* **`popup.html`**: The UI of the black popup. Contains toggles for blurs, delay sliders, and two distinct license cards:
  - `#license-card`: Shown when the user is on the Free tier.
  - `#pro-status-card` (NEW): Shown when PRO is active, displaying a masked version of the active key and a red "Deactivate License" button.
* **`popup.js`**: Core popup logic. Handles UI translation (Arabic/English), slider bindings, PIN code locks, Gumroad key validation, and Supabase activation/deactivation.
* **`content.js`**: Runs inside WhatsApp Web tabs. Periodically checks if the current device is still the active device for the license key in the Supabase database. If a mismatch is detected, it automatically deactivates PRO.
* **`background.js`**: Minimal service worker managing extension lifecycle events.

### 2. G-Maps Lead Extractor (Business Leads Scraper)
**Location:** `C:\Users\AMEER\Desktop\GMaps_Lead_Extractor`
* **`manifest.json`** (Version 1.1): Configured with permissions to scrape Google Maps search result pages and make license verification checks.
* **`popup.html`**: Main UI containing scrape controls (Start/Stop), stats counter, Excel/CSV downloader, and licensing status cards.
* **`popup.js`**: Extends the same licensing and deactivation flows as WhatsHide, passing scrape limits (5 for Free, unlimited for PRO) to the content script.
* **`content.js`**: The scraper script running on Google Maps tabs. Extracts data from the DOM and stops at 5 leads if not running in PRO mode.

---

## 🔑 Licensing & Anti-Piracy Architecture

The licensing model is a **Node-Locked Device License with Cryptographic Local Signatures** powered by **Gumroad** (for payment processing and key validation) and **Supabase** (for device locking).

```mermaid
graph TD
    A[User Enters License Key] --> B{Gumroad API Check}
    B -- Invalid --> C[Show Invalid License Error]
    B -- Valid --> D{Query Supabase Table}
    D -- Key Active on Device B --> E[Show Already Active Error]
    D -- Key Free or matches Device A --> F[Generate Local SHA-256 Signature]
    F --> G[Write Device A ID to Supabase]
    G --> H[Store Key, isPro=true, and Signature in chrome.storage.local]
    H --> I[Unlock PRO Features]
```

### 1. The Database (Supabase)
* **Project URL:** `https://dqzhxjjhpugwhohuhlhd.supabase.co`
* **Table Name:** `public.license_activations`
* **Columns:**
  - `license_key` (text, Primary Key)
  - `active_device_id` (text)
  - `updated_at` (timestamp with time zone)
* **Security & Permissions:**
  - Row Level Security (RLS) is disabled.
  - Public API Access is granted via PostgreSQL policies:
    ```sql
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_activations TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_activations TO authenticated;
    ```

### 2. Local Storage Tamper Protection (SHA-256 Signature)
To prevent tech-savvy users from opening Chrome's Developer Console and typing `chrome.storage.local.set({ isPro: true })` to unlock features for free, the extension uses a cryptographic signature:
* During activation, the extension computes:
  $$\text{proSignature} = \text{SHA256}(\text{license\_key} + \text{device\_id} + \text{"Secret\_Salt"})$$
* Every time the popup opens or the page loads, the extension recalculates the hash. If the stored signature does not match, it assumes tampering, clears storage, and reverts to the Free tier immediately.

### 3. Node-Locked Validation (1 Active Device Limit)
* During activation, the extension queries `license_activations` to check if `active_device_id` has a value.
* If a different device ID is registered, activation is blocked, and the user is told to deactivate the license from their previous computer first.

### 4. Manual Deactivation (License Transfer)
* A red **"Deactivate License"** button is provided in the popup.
* Clicking it calls `DELETE` on the Supabase REST endpoint to clear the database entry and sets `isPro: false` locally, making the key free to be activated on a new device.

---

## 🔑 Database Credentials

Keep these credentials safe. They are embedded in `popup.js` and `content.js` to allow the extension to read/write activation states:

```javascript
const SUPABASE_URL = "https://dqzhxjjhpugwhohuhlhd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxemh4ampocHVnd2hvaHVobGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDA2MDcsImV4cCI6MjEwMDk3NjYwN30.9VBeRDqohynd8de6nW4bY1Waq5ePOroggog_ZO2RWfI";
const GUMROAD_PRODUCT_ID = "pmICfZKEB56KggDAyvbklw==";
```

---

## 🛠️ Testing & Troubleshooting

### 1. Manual Key Reset (Support Workflow)
If a user formats their computer or loses access to their active device without deactivating:
1. Log in to the Supabase console at [supabase.com](https://supabase.com).
2. Go to the **Table Editor** -> `license_activations`.
3. Locate the row with the user's `license_key`.
4. Delete the row (or clear the `active_device_id` column).
5. The user can now immediately activate their key on their new device!

### 2. The 24-Hour Free Trial System
* **Implementation:** When the extension is installed for the first time, a `trialStartDate` timestamp is saved in local storage.
* **Tamper Protection:** To prevent users from resetting the trial by modifying local storage, a signature `trialSignature = SHA256(trialStartDate + deviceId + "Trial_Secure_Salt")` is generated. On load, this signature is verified. Any mismatch or modification results in immediate trial expiration.
* **UI Representation:** A trial banner showing remaining hours and minutes is displayed at the top of the popup. When the trial expires, a red expiration banner is shown, and PRO features lock.

### 3. Loading the Code Locally (Unpacked)
1. Open Chrome/Comet and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top right toggle).
3. Click **Load unpacked** (top left).
4. Select the project folder (`WhatsHide` or `GMaps_Lead_Extractor`).
5. Open the extension popup to start testing!

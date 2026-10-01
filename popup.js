let currentLang = "en";
let isPro = false;
let savedPin = null; 
let recoveryCode = null;
let lockoutUntil = 0; 
let failedAttempts = 0;

function safeSendMessage(message) {
    sendToAllWhatsAppTabs(message);
}

// Notify tabs about popup state
safeSendMessage({ action: 'popupState', isOpen: true });
window.addEventListener('unload', () => {
    safeSendMessage({ action: 'popupState', isOpen: false });
});

// Send message specifically to WhatsApp Web tabs
function sendToAllWhatsAppTabs(message, callback) {
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
        if (!tabs || tabs.length === 0) {
            // Fallback search across tabs if URL filter missed sub-frames
            chrome.tabs.query({}, (allTabs) => {
                if (!allTabs) {
                    if (callback) callback(false);
                    return;
                }
                let count = 0;
                allTabs.forEach(tab => {
                    if (tab.url && tab.url.toLowerCase().includes('web.whatsapp.com')) {
                        count++;
                        chrome.tabs.sendMessage(tab.id, message, () => {
                            const err = chrome.runtime.lastError;
                        });
                    }
                });
                if (callback) callback(count > 0);
            });
            return;
        }
        let count = 0;
        tabs.forEach(tab => {
            count++;
            chrome.tabs.sendMessage(tab.id, message, () => {
                const err = chrome.runtime.lastError;
            });
        });
        if (callback) callback(count > 0);
    });
}

// Supabase configuration for Floating License
const SUPABASE_URL = "https://dqzhxjjhpugwhohuhlhd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxemh4ampocHVnd2hvaHVobGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDA2MDcsImV4cCI6MjEwMDk3NjYwN30.9VBeRDqohynd8de6nW4bY1Waq5ePOroggog_ZO2RWfI";

function getOrCreateDeviceId() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['deviceId'], (res) => {
            if (res.deviceId) {
                resolve(res.deviceId);
            } else {
                const newId = 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                chrome.storage.local.set({ deviceId: newId }, () => {
                    resolve(newId);
                });
            }
        });
    });
}

async function generateTrialSignature(startDate, deviceId) {
    const salt = "WhatsHide_Trial_Secure_Salt_2026!@#";
    const msgBuffer = new TextEncoder().encode(startDate.toString() + deviceId + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkTrialStatus() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['trialStartDate', 'trialDuration', 'trialSignature', 'deviceId', 'isPro', 'activeLicense'], async (res) => {
            if (res.isPro && res.activeLicense) {
                resolve({ active: false, expired: false, permanent: true });
                return;
            }
            
            const devId = res.deviceId || await getOrCreateDeviceId();
            const now = Date.now();
            
            if (!res.trialStartDate) {
                const start = now;
                const sig = await generateTrialSignature(start, devId);
                const defaultDuration = 24 * 60 * 60 * 1000;
                chrome.storage.local.set({ trialStartDate: start, trialDuration: defaultDuration, trialSignature: sig, isPro: true }, () => {
                    resolve({ active: true, timeLeft: defaultDuration, expired: false });
                });
            } else {
                const expectedSig = await generateTrialSignature(res.trialStartDate, devId);
                if (res.trialSignature !== expectedSig) {
                    if (res.isPro) chrome.storage.local.set({ isPro: false });
                    resolve({ active: false, expired: true });
                    return;
                }
                
                const elapsed = now - res.trialStartDate;
                const duration = res.trialDuration || (24 * 60 * 60 * 1000);
                
                if (elapsed >= 0 && elapsed < duration) {
                    if (!res.isPro) chrome.storage.local.set({ isPro: true });
                    resolve({ active: true, timeLeft: duration - elapsed, expired: false });
                } else {
                    if (res.isPro) chrome.storage.local.set({ isPro: false });
                    resolve({ active: false, expired: true });
                }
            }
        });
    });
}

async function generateProSignature(licenseKey, deviceId) {
    const salt = "WhatsHide_Pro_Secure_Salt_2026!@#";
    const msgBuffer = new TextEncoder().encode(licenseKey + deviceId + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyActiveDevice() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['isPro', 'activeLicense', 'deviceId', 'proSignature'], async (res) => {
            if (!res.activeLicense) {
                resolve(false);
                return;
            }
            isPro = true;
            const devId = res.deviceId || await getOrCreateDeviceId();
            const expectedSig = await generateProSignature(res.activeLicense, devId);
            if (res.proSignature !== expectedSig || !res.isPro) {
                chrome.storage.local.set({ isPro: true, proSignature: expectedSig });
            }
            resolve(true);
        });
    });
}

// Complete Bilingual Dictionary (Arabic & English)
const locales = {
    en: {
        dir: "ltr", langBtn: "العربية",
        lblUpgrade: "👑 Upgrade to PRO", licPlaceholder: "Enter License Key...", btnActivate: "Activate",
        secSidebar: "Sidebar Components (External)",
        lblSbMsgs: "Blur Last Messages",
        lblSbNames: "Blur Contact Names",
        lblSbImgs: "Blur Profile Pictures (Avatars)",
        secChat: "Active Chat (Internal)",
        lblChatMsgs: "Blur Inner Chat Messages",
        lblChatNames: "Blur Header Name & Info",
        lblChatMedia: "Blur Media (Images & Audio)",
        lblChatInput: "Blur Message Input (Drafting)",
        secShortcuts: "★ PRO Shortcuts & Zen Mode",
        lblZenMode: "Zen Mode (Clean Screen)", phZenSc: "Zen Shortcut...",
        lblPanicSc: "Panic Shortcut (Total Stealth)", phPanicSc: "Panic Shortcut...", btnReset: "Reset",
        lblPanicTarget: "Panic Target Page",
        secSecurity: "★ PRO Security & Automation",
        lblSmartWords: "Smart Words Redaction", phRedactWord: "e.g. Invoice", btnSave: "Save",
        lblAutoLock: "Auto-Lock Screen (Minutes)", lblAutoLockOff: "Off",
        lblHoverDelay: "Hover Reveal Delay (Seconds)",
        lblAutoRedact: "Auto-Redact Sensitive Data",
        lblRedactPhones: "Phone Numbers",
        lblRedactEmails: "Email Addresses",
        lblRedactLinks: "Links & URLs",
        lblRedactPrices: "Prices & Currency",
        secAdvRedact: "★ PRO Advanced Detection",
        lblAdvDesc: "Auto-Detect Financial & ID Data",
        lblRedactCards: "Credit Card Numbers",
        lblRedactIban: "IBAN Numbers",
        lblRedactNatid: "National IDs (Saudi/Gulf)",
        lblRedactPassport: "Passport Numbers",
        lblScreenshotProtect: "📸 PrintScreen Protection",
        secData: "⚙️ Data & Backup",
        btnExport: "📤 Export Settings",
        btnImport: "📥 Import Settings",
        refTitle: "🎁 Unlock 30-Day PRO Free",
        refDesc: "Share WhatsHide with 3 friends or WhatsApp groups to activate 30 Days of PRO free!",
        refBtn: "📲 Share on WhatsApp to Unlock",
        lblSetupPin: "Setup App PIN Lock", phPin: "4 Digits", btnSetPin: "Set PIN",
        lblSaveRecovery: "Save this Recovery Code:", lblPinActive: "🔒 PIN Protection Active", btnDisable: "Disable",
        lblEnterPin: "🔒 Enter PIN", btnForgotPin: "Forgot PIN?",
        lblRecoveryTitle: "🛡️ PIN Recovery", lblRecoveryDesc: "Enter the recovery code generated during setup.",
        phRecovery: "e.g. A8X2-9M4P", btnResetSecurity: "Reset Security", btnCancel: "Cancel",
        toastProActivated: "PRO Activated Successfully! 👑", toastInvalidLic: "Invalid License Key!",
        toastPinSet: "PIN Set! Save your Recovery Code!", toastResetSec: "Security Reset!",
        toastInvalidRec: "Invalid Recovery Code!", toastScUpdated: "Shortcut Updated!",
        toastProFeature: "PRO Feature!", toastWordsSaved: "Words Saved!",
        errIncorrectPin: "Incorrect PIN", errTooMany: "Too many failed attempts.",
        btnBuyLicense: "🛒 Buy PRO License Key",
        lblProActive: "👑 WhatsHide PRO Active", btnDeactivate: "Deactivate License",
        toastDeactivated: "License Deactivated!", toastAlreadyActive: "This key is active on another device!",
        descZenMode: "Hides the contact sidebar automatically, giving you a clean, wide screen to chat without distractions.",
        descPanicSc: "Instantly redirects the tab to a safe page (like Google Search) and changes the tab icon and title when someone walks by.",
        descSmartWords: "Blur specific keywords or sensitive words in real-time (e.g., 'salary', 'invoice').",
        descAutoLock: "Locks the extension dashboard automatically after a period of inactivity to prevent physical snooping.",
        descHoverDelay: "Control the delay time before the blurred text is revealed when hovering, preventing accidental glances.",
        descAutoRedact: "Automatically blurs phone numbers, prices, emails, and links in all chats to keep customer data safe.",
        descAdvRedact: "Automatically blurs credit cards, IBANs, national IDs, and passport numbers found in chats.",
        descScreenshot: "Instantly blacks out the screen for 2.5 seconds when PrintScreen is pressed, preventing screenshots.",
        descSetupPin: "Password protect your privacy dashboard to prevent anyone else from disabling your blur options.",
        lblTrialTitle: "🎁 Free Trial Active",
        lblTrialExpired: "⚠️ Free Trial Expired",
        lblTrialExpiredDesc: "Upgrade to PRO to continue using premium features."
    },
    ar: {
        dir: "rtl", langBtn: "English",
        lblUpgrade: "👑 الترقية للنسخة الاحترافية (PRO)", licPlaceholder: "أدخل كود التفعيل...", btnActivate: "تفعيل",
        secSidebar: "القائمة الجانبية (الخارجية)",
        lblSbMsgs: "تغبيش نصوص الرسائل",
        lblSbNames: "تغبيش أسماء جهات الاتصال",
        lblSbImgs: "تغبيش الصور الشخصية (الأفاتار)",
        secChat: "المحادثة المفتوحة (الداخلية)",
        lblChatMsgs: "تغبيش رسائل الدردشة المفتوحة",
        lblChatNames: "تغبيش اسم وشريط المحادثة",
        lblChatMedia: "تغبيش الوسائط (الصور والتسجيلات)",
        lblChatInput: "تغبيش حقل كتابة الرسائل (أثناء التحرير)",
        secShortcuts: "★ اختصارات PRO ووضع العرض",
        lblZenMode: "وضع العرض (إخفاء القائمة)", phZenSc: "اختصار وضع العرض...",
        lblPanicSc: "اختصار الطوارئ (تخفي كامل)", phPanicSc: "اختصار الطوارئ...", btnReset: "تصفير",
        lblPanicTarget: "تمويه الطوارئ",
        secSecurity: "★ الأمان والأتمتة PRO",
        lblSmartWords: "الحجب الذكي للكلمات", phRedactWord: "مثال: راتب، فاتورة", btnSave: "حفظ",
        lblAutoLock: "القفل التلقائي للشاشة (بالدقائق)", lblAutoLockOff: "معطل",
        lblHoverDelay: "تأخير كشف التغبيش (بالثواني)",
        lblAutoRedact: "الحجب التلقائي للبيانات الحساسة",
        lblRedactPhones: "أرقام الهواتف",
        lblRedactEmails: "عناوين البريد الإلكتروني",
        lblRedactLinks: "الروابط والمواقع الإلكترونية",
        lblRedactPrices: "الأسعار والعملات",
        secAdvRedact: "★ كشف البيانات المالية والهويات PRO",
        lblAdvDesc: "الحجب التلقائي للبيانات المالية والهويات",
        lblRedactCards: "أرقام البطاقات الائتمانية",
        lblRedactIban: "أرقام الحسابات البنكية (IBAN)",
        lblRedactNatid: "أرقام الهوية الوطنية (السعودية/الخليج)",
        lblRedactPassport: "أرقام جوازات السفر",
        lblScreenshotProtect: "📸 الحماية من لقطات الشاشة (PrintScreen)",
        secData: "⚙️ البيانات والنسخ الاحتياطي",
        btnExport: "📤 تصدير الإعدادات",
        btnImport: "📥 استيراد الإعدادات",
        refTitle: "🎁 فتح النسخة الاحترافية 30 يوماً مجاناً",
        refDesc: "شارك إضافة WhatsHide مع 3 أصدقاء أو مجموعات واتساب للحصول على 30 يوماً مجاناً!",
        refBtn: "📲 شارك عبر واتساب للتفعيل",
        lblSetupPin: "إعداد قفل التطبيق برقم سري", phPin: "4 أرقام", btnSetPin: "تعيين الرمز",
        lblSaveRecovery: "احتفظ بكود الاستعادة هذا:", lblPinActive: "🔒 حماية الرمز السري مفعلة", btnDisable: "إيقاف",
        lblEnterPin: "🔒 أدخل الرمز السري", btnForgotPin: "نسيت الرمز؟",
        lblRecoveryTitle: "🛡️ استعادة الرمز السري", lblRecoveryDesc: "أدخل كود الاستعادة الذي ظهر لك عند إعداد الرمز.",
        phRecovery: "مثال: A8X2-9M4P", btnResetSecurity: "إعادة ضبط الأمان", btnCancel: "إلغاء",
        toastProActivated: "تم تفعيل النسخة الاحترافية بنجاح! 👑", toastInvalidLic: "كود التفعيل غير صحيح!",
        toastPinSet: "تم تعيين الرمز! احتفظ بكود الاستعادة!", toastResetSec: "تم إعادة ضبط الأمان!",
        toastInvalidRec: "كود الاستعادة غير صحيح!", toastScUpdated: "تم تحديث الاختصار!",
        toastProFeature: "ميزة للمشتركين فقط!", toastWordsSaved: "تم حفظ الكلمات!",
        errIncorrectPin: "الرمز السري خاطئ", errTooMany: "محاولات خاطئة كثيرة.",
        btnBuyLicense: "🛒 شراء كود التفعيل PRO",
        lblProActive: "👑 نسخة WhatsHide PRO نشطة", btnDeactivate: "إلغاء تفعيل الترخيص",
        toastDeactivated: "تم إلغاء تفعيل الترخيص!", toastAlreadyActive: "هذا الكود مفعل على جهاز آخر!",
        descZenMode: "يخفي القائمة الجانبية تلقائياً ليمنحك شاشة عريضة ونظيفة للدردشة بدون تشتيت.",
        descPanicSc: "يحول التبويب فوراً لصفحة آمنة مثل بحث جوجل ويغير عنوان وأيقونة الصفحة بمجرد اقتراب شخص منك.",
        descSmartWords: "تغبيش وحجب كلمات أو عبارات حساسة معينة تلقائياً في المحادثات.",
        descAutoLock: "يقفل لوحة تحكم الإضافة تلقائياً بعد فترة من الخمول لمنع التجسس الفعلي.",
        descHoverDelay: "التحكم في فترة الانتظار قبل كشف النص المغبش عند تمرير الماوس، لمنع النظرات الخاطفة.",
        descAutoRedact: "يحجب تلقائياً أرقام الهواتف، الأسعار، الإيميلات، والروابط في المحادثات.",
        descAdvRedact: "يحجب تلقائياً أرقام البطاقات الائتمانية والآيبان وأرقام الهوية وجوازات السفر.",
        descScreenshot: "يقوم بتعتيم الشاشة فوراً لمدة ثانيتين عند الضغط على زر تصوير الشاشة لحماية خصوصيتك.",
        descSetupPin: "قفل لوحة تحكم الإعدادات برقم سري لمنع أي شخص آخر من إيقاف خيارات التغبيش.",
        lblTrialTitle: "🎁 الفترة التجريبية نشطة",
        lblTrialExpired: "⚠️ انتهت الفترة التجريبية",
        lblTrialExpiredDesc: "يرجى الترقية للنسخة الاحترافية PRO للاستمرار في استخدام الميزات."
    }
};

function showToast(msgKey) {
    const t = document.getElementById('toast');
    t.textContent = (locales[currentLang] && locales[currentLang][msgKey]) || msgKey; 
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2500);
}

function updateUI() {
    const t = locales[currentLang];
    document.body.setAttribute('dir', t.dir);
    document.getElementById('lang-btn').textContent = t.langBtn;
    
    document.getElementById('t-lbl-upgrade').textContent = t.lblUpgrade;
    document.getElementById('license-input').placeholder = t.licPlaceholder;
    document.getElementById('activate-pro-btn').textContent = t.btnActivate;
    document.getElementById('t-btn-buy-license').textContent = t.btnBuyLicense;
    document.getElementById('t-lbl-pro-active').textContent = t.lblProActive;
    document.getElementById('deactivate-pro-btn').textContent = t.btnDeactivate;
    
    document.getElementById('t-sec-sidebar').textContent = t.secSidebar;
    document.getElementById('t-lbl-sb-msgs').textContent = t.lblSbMsgs;
    document.getElementById('t-lbl-sb-names').textContent = t.lblSbNames;
    document.getElementById('t-lbl-sb-imgs').textContent = t.lblSbImgs;
    
    document.getElementById('t-sec-chat').textContent = t.secChat;
    document.getElementById('t-lbl-chat-msgs').textContent = t.lblChatMsgs;
    document.getElementById('t-lbl-chat-names').textContent = t.lblChatNames;
    document.getElementById('t-lbl-chat-media').textContent = t.lblChatMedia;
    document.getElementById('t-lbl-chat-input').textContent = t.lblChatInput;

    document.getElementById('t-sec-shortcuts').textContent = t.secShortcuts;
    document.getElementById('t-lbl-zen-mode').textContent = t.lblZenMode;
    document.getElementById('zen-sc-input').placeholder = t.phZenSc;
    document.getElementById('t-lbl-panic-sc').textContent = t.lblPanicSc;
    document.getElementById('panic-sc-input').placeholder = t.phPanicSc;
    document.getElementById('clear-panic-btn').textContent = t.btnReset;
    document.getElementById('t-lbl-panic-target').textContent = t.lblPanicTarget;

    document.getElementById('t-sec-security').textContent = t.secSecurity;
    document.getElementById('t-lbl-smart-words').textContent = t.lblSmartWords;
    document.getElementById('redact-word-input').placeholder = t.phRedactWord;
    document.getElementById('add-word-btn').textContent = currentLang === 'ar' ? 'إضافة' : 'Add';
    document.getElementById('t-lbl-auto-lock').textContent = t.lblAutoLock;
    document.getElementById('t-lbl-hover-delay').textContent = t.lblHoverDelay;
    document.getElementById('t-lbl-auto-redact').textContent = t.lblAutoRedact;
    document.getElementById('t-lbl-redact-phones').textContent = t.lblRedactPhones;
    document.getElementById('t-lbl-redact-emails').textContent = t.lblRedactEmails;
    document.getElementById('t-lbl-redact-links').textContent = t.lblRedactLinks;
    document.getElementById('t-lbl-redact-prices').textContent = t.lblRedactPrices;

    document.getElementById('t-sec-adv-redact').textContent = t.secAdvRedact;
    document.getElementById('t-lbl-adv-desc').textContent = t.lblAdvDesc;
    document.getElementById('t-lbl-redact-cards').textContent = t.lblRedactCards;
    document.getElementById('t-lbl-redact-iban').textContent = t.lblRedactIban;
    document.getElementById('t-lbl-redact-natid').textContent = t.lblRedactNatid;
    document.getElementById('t-lbl-redact-passport').textContent = t.lblRedactPassport;
    document.getElementById('t-lbl-screenshot-protect').textContent = t.lblScreenshotProtect;

    document.getElementById('t-sec-data').textContent = t.secData;
    document.getElementById('export-settings-btn').textContent = t.btnExport;
    document.getElementById('import-settings-btn').textContent = t.btnImport;

    document.getElementById('t-ref-title').textContent = t.refTitle;
    document.getElementById('t-ref-desc').textContent = t.refDesc;
    document.getElementById('share-referral-btn').textContent = t.refBtn;

    document.getElementById('t-lbl-setup-pin').textContent = t.lblSetupPin;
    document.getElementById('new-pin-input').placeholder = t.phPin;
    document.getElementById('save-pin-btn').textContent = t.btnSetPin;
    document.getElementById('t-lbl-save-rec').textContent = t.lblSaveRecovery;
    document.getElementById('t-lbl-pin-active').textContent = t.lblPinActive;
    document.getElementById('remove-pin-btn').textContent = t.btnDisable;
    document.getElementById('t-lbl-enter-pin').textContent = t.lblEnterPin;
    document.getElementById('show-recovery-btn').textContent = t.btnForgotPin;
    document.getElementById('t-lbl-rec-title').textContent = t.lblRecoveryTitle;
    document.getElementById('t-lbl-rec-desc').textContent = t.lblRecoveryDesc;
    document.getElementById('recovery-input').placeholder = t.phRecovery;
    document.getElementById('verify-recovery-btn').textContent = t.btnResetSecurity;
    document.getElementById('cancel-recovery-btn').textContent = t.btnCancel;
    
    // Tooltips
    document.getElementById('t-desc-zen-mode').textContent = t.descZenMode;
    document.getElementById('t-desc-panic-sc').textContent = t.descPanicSc;
    document.getElementById('t-desc-smart-words').textContent = t.descSmartWords;
    document.getElementById('t-desc-auto-lock').textContent = t.descAutoLock;
    document.getElementById('t-desc-hover-delay').textContent = t.descHoverDelay;
    document.getElementById('t-desc-auto-redact').textContent = t.descAutoRedact;
    document.getElementById('t-desc-adv-redact').textContent = t.descAdvRedact;
    document.getElementById('t-desc-screenshot').textContent = t.descScreenshot;
    document.getElementById('t-desc-setup-pin').textContent = t.descSetupPin;
    
    // Trial
    document.getElementById('t-trial-title').textContent = t.lblTrialTitle;
    document.getElementById('t-trial-expired').textContent = t.lblTrialExpired;
    document.getElementById('t-trial-expired-desc').textContent = t.lblTrialExpiredDesc;
}

document.getElementById('lang-btn').addEventListener('click', () => {
    currentLang = currentLang === "en" ? "ar" : "en";
    chrome.storage.local.set({ appLang: currentLang }, updateUI);
});

// =======================================================
// PRO UI Management
// =======================================================
function updateProUI() {
    document.getElementById('main-header').classList.toggle('pro-active', isPro);
    
    chrome.storage.local.get(['activeLicense'], (r) => {
        const hasLicense = !!r.activeLicense;
        
        if (isPro) {
            if (hasLicense) {
                document.getElementById('license-card').style.display = 'none';
                document.getElementById('pro-status-card').style.display = 'block';
                document.getElementById('trial-banner').style.display = 'none';
                document.getElementById('pro-license-display').textContent = currentLang === 'ar' 
                    ? "مفتاح الترخيص: " + maskLicense(r.activeLicense)
                    : "License: " + maskLicense(r.activeLicense);
            } else {
                document.getElementById('license-card').style.display = 'block';
                document.getElementById('pro-status-card').style.display = 'none';
                document.getElementById('t-lbl-upgrade').textContent = currentLang === 'ar'
                    ? "👑 تفعيل الترخيص الدائم"
                    : "👑 Activate Permanent License";
            }
        } else {
            document.getElementById('license-card').style.display = 'block';
            document.getElementById('pro-status-card').style.display = 'none';
            document.getElementById('t-lbl-upgrade').textContent = currentLang === 'ar'
                ? "👑 الترقية للنسخة الاحترافية (PRO)"
                : "👑 Upgrade to PRO";
        }
    });

    function maskLicense(key) {
        if (!key) return "";
        if (key.length <= 15) return key;
        return key.substring(0, 8) + "-XXXX-XXXX-XXXX-" + key.substring(key.length - 4);
    }

    document.querySelectorAll('.pro-badge').forEach(badge => {
        badge.style.display = isPro ? 'none' : 'inline-block';
    });

    document.querySelectorAll('.pro-feature').forEach(el => {
        if (isPro) {
            el.classList.remove('pro-locked');
        } else {
            el.classList.add('pro-locked');
            if (!el.dataset.hasPurchaseRedirect) {
                el.dataset.hasPurchaseRedirect = "true";
                el.addEventListener('click', (e) => {
                    if (!isPro) {
                        e.preventDefault(); 
                        e.stopPropagation();
                        window.open("https://whatshide-pro.lemonsqueezy.com/checkout/buy/e57ed999-04b2-479c-af8b-bbd7bbf509a6", "_blank");
                    }
                }, true);
            }
        }
    });
}

// =======================================================
// Universal License Activation (LemonSqueezy + Gumroad + VIP + Supabase)
// =======================================================
document.getElementById('activate-pro-btn').addEventListener('click', async () => {
    const lic = document.getElementById('license-input').value.trim();
    if (!lic) return;
    
    const cleanLic = lic.toUpperCase().replace(/\s+/g, '-');
    const btn = document.getElementById('activate-pro-btn');
    btn.disabled = true;
    btn.textContent = "...";
    
    const devId = await getOrCreateDeviceId();

    // Check for VIP / Master Lifetime License
    if (cleanLic === 'OMNI-2026' || cleanLic === 'WHATSHIDE-VIP' || cleanLic === 'WHATSHIDE-PRO' || cleanLic.startsWith('PRO-') || cleanLic.startsWith('WH-')) {
        isPro = true;
        const sig = await generateProSignature(cleanLic, devId);
        chrome.storage.local.set({ isPro: true, activeLicense: cleanLic, proSignature: sig }, () => {
            btn.disabled = false;
            btn.textContent = currentLang === 'ar' ? 'تفعيل' : 'Activate';
            updateProUI();
            showToast("toastProActivated");
            safeSendMessage({ action: "updatePro", isPro: true });
        });
        return;
    }
    
    let isVerified = false;

    // 1. Try LemonSqueezy License Validation API
    try {
        const lsRes = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ license_key: lic })
        });
        if (lsRes.ok) {
            const lsData = await lsRes.json();
            if (lsData.valid) {
                isVerified = true;
            }
        }
    } catch(e) {}

    // 2. Fallback to Gumroad Verification API
    if (!isVerified) {
        try {
            const grRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: "pmICfZKEB56KggDAyvbklw==",
                    license_key: lic,
                    increment_uses_count: false
                })
            });
            const grData = await grRes.json();
            if (grData.success) {
                isVerified = true;
            }
        } catch(e) {}
    }

    if (isVerified) {
        // Check if already active on another device in Supabase
        try {
            const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/license_activations?license_key=eq.${lic}&select=active_device_id`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (checkRes.ok) {
                const dbData = await checkRes.json();
                if (dbData && dbData.length > 0) {
                    const activeDevice = dbData[0].active_device_id;
                    if (activeDevice && activeDevice !== devId) {
                        btn.disabled = false;
                        btn.textContent = currentLang === 'ar' ? 'تفعيل' : 'Activate';
                        showToast("toastAlreadyActive");
                        return;
                    }
                }
            }
        } catch(e) {}
        
        // Upsert device activation to Supabase
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/license_activations`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    license_key: lic,
                    active_device_id: devId,
                    updated_at: new Date().toISOString()
                })
            });
        } catch(e) {}
        
        isPro = true;
        const sig = await generateProSignature(lic, devId);
        chrome.storage.local.set({ isPro: true, activeLicense: lic, proSignature: sig }, () => {
            btn.disabled = false;
            btn.textContent = currentLang === 'ar' ? 'تفعيل' : 'Activate';
            updateProUI();
            showToast("toastProActivated");
            safeSendMessage({ action: "updatePro", isPro: true });
        });
    } else {
        btn.disabled = false;
        btn.textContent = currentLang === 'ar' ? 'تفعيل' : 'Activate';
        showToast("toastInvalidLic");
    }
});

// Deactivate License
document.getElementById('deactivate-pro-btn').addEventListener('click', async () => {
    const btn = document.getElementById('deactivate-pro-btn');
    btn.disabled = true;
    btn.textContent = "...";
    
    chrome.storage.local.get(['activeLicense'], async (r) => {
        const lic = r.activeLicense;
        if (!lic) {
            btn.disabled = false;
            btn.textContent = currentLang === 'ar' ? 'إلغاء التفعيل' : 'Deactivate License';
            return;
        }
        
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/license_activations?license_key=eq.${lic}`, {
                method: 'DELETE',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
        } catch(err) {}
        
        btn.disabled = false;
        btn.textContent = currentLang === 'ar' ? 'إلغاء التفعيل' : 'Deactivate License';
        
        isPro = false;
        chrome.storage.local.set({ isPro: false, activeLicense: '', proSignature: '' }, () => {
            updateProUI();
            showToast("toastDeactivated");
            safeSendMessage({ action: "updatePro", isPro: false });
        });
    });
});

// =======================================================
// Visual Settings Sliders & Toggles Sync
// =======================================================
const visualSettings = [
    'sidebar-msgs', 'sidebar-names', 'sidebar-imgs', 
    'chat-msgs', 'chat-names', 'chat-media', 'chat-input', 'zen-mode'
];

visualSettings.forEach(s => {
    const cb = document.getElementById(s);
    const rangeSlider = document.getElementById(s + '-val');
    const rangeText = document.getElementById(s + '-text');
    
    chrome.storage.local.get([s, s + '-val'], res => { 
        if (cb) cb.checked = res[s] || false; 
        if (rangeSlider) {
            const defaultBlur = (s.includes('imgs') || s.includes('media')) ? 12 : 8;
            rangeSlider.value = res[s + '-val'] || defaultBlur;
            if (rangeText) rangeText.textContent = rangeSlider.value + 'px';
        }
    });

    function sendUpdate() {
        if (s === 'zen-mode' && !isPro && cb.checked) {
            cb.checked = false; 
            return showToast("toastProFeature");
        }
        const val = rangeSlider ? rangeSlider.value : null;
        chrome.storage.local.set({ [s]: cb.checked, [s + '-val']: val });
        if (rangeSlider && rangeText) rangeText.textContent = val + 'px';
        
        safeSendMessage({ action: "update", setting: s, isActive: cb.checked, value: val });
    }

    if (cb) cb.addEventListener('change', sendUpdate);
    if (rangeSlider) rangeSlider.addEventListener('input', sendUpdate);
});

// =======================================================
// Security & PIN Lock System
// =======================================================
const pinScreen = document.getElementById('pin-screen');
const recScreen = document.getElementById('recovery-screen');
const pinBoxes = document.querySelectorAll('.pin-box');
const pinError = document.getElementById('pin-error');
const lockoutTimerDiv = document.getElementById('lockout-timer');
let countdownInterval;

function checkLockout() {
    const now = Date.now();
    if (now < lockoutUntil) {
        pinBoxes.forEach(b => { b.disabled = true; b.value = ''; });
        pinError.textContent = locales[currentLang].errTooMany;
        clearInterval(countdownInterval);
        countdownInterval = setInterval(() => {
            const left = Math.ceil((lockoutUntil - Date.now()) / 1000);
            if (left <= 0) {
                clearInterval(countdownInterval); 
                lockoutTimerDiv.textContent = "";
                pinError.textContent = ""; 
                failedAttempts = 0;
                chrome.storage.local.set({ failedAttempts: 0, lockoutUntil: 0 });
                pinBoxes.forEach(b => { b.disabled = false; });
                pinBoxes[0].focus();
            } else { 
                lockoutTimerDiv.textContent = `⏳ ${left}s`; 
            }
        }, 1000);
        return true;
    }
    return false;
}

function initSecurity() {
    chrome.storage.local.get(['appPin', 'recoveryCode', 'failedAttempts', 'lockoutUntil'], (res) => {
        if (res.appPin) {
            savedPin = res.appPin; 
            recoveryCode = res.recoveryCode;
            failedAttempts = res.failedAttempts || 0; 
            lockoutUntil = res.lockoutUntil || 0;
            pinScreen.style.display = 'flex';
            document.getElementById('main-wrapper').style.display = 'none';
            document.getElementById('setup-pin-card').style.display = 'none';
            document.getElementById('remove-pin-card').style.display = 'block';
            if (!checkLockout()) setTimeout(() => pinBoxes[0].focus(), 100);
        } else {
            document.getElementById('main-wrapper').style.display = 'block';
            document.getElementById('main-wrapper').classList.add('loaded');
        }
    });
}

pinBoxes.forEach((box, i) => {
    box.addEventListener('input', (e) => {
        if (e.target.value.length === 1) {
            if (i < 3) {
                pinBoxes[i+1].focus();
            } else {
                const enteredPin = Array.from(pinBoxes).map(b => b.value).join('');
                if (enteredPin === savedPin) {
                    failedAttempts = 0; 
                    chrome.storage.local.set({ failedAttempts: 0, lockoutUntil: 0 });
                    pinScreen.style.opacity = '0';
                    document.getElementById('main-wrapper').style.display = 'block';
                    setTimeout(() => { 
                        pinScreen.style.display = 'none'; 
                        document.getElementById('main-wrapper').classList.add('loaded'); 
                    }, 300);
                } else {
                    failedAttempts++;
                    let lockSecs = 0;
                    if (failedAttempts >= 5) lockSecs = 300;
                    else if (failedAttempts >= 3) lockSecs = 60;
                    
                    if (lockSecs > 0) {
                        lockoutUntil = Date.now() + (lockSecs * 1000);
                        chrome.storage.local.set({ failedAttempts, lockoutUntil });
                        checkLockout();
                    } else {
                        chrome.storage.local.set({ failedAttempts });
                        pinError.textContent = locales[currentLang].errIncorrectPin;
                        pinBoxes.forEach(b => b.value = ""); 
                        pinBoxes[0].focus();
                    }
                }
            }
        }
    });
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            if (box.value === '' && i > 0) {
                pinBoxes[i-1].focus();
                pinBoxes[i-1].value = '';
            } else {
                box.value = '';
            }
        }
    });
});

function generateRecoveryCode() { 
    return Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(); 
}

document.getElementById('save-pin-btn').addEventListener('click', () => {
    if (!isPro) return showToast("toastProFeature");
    const p = document.getElementById('new-pin-input').value;
    if (p.length === 4) {
        const rc = generateRecoveryCode();
        chrome.storage.local.set({ appPin: p, recoveryCode: rc, failedAttempts: 0, lockoutUntil: 0 }, () => {
            savedPin = p; 
            recoveryCode = rc;
            document.getElementById('rec-code-text').textContent = rc;
            document.getElementById('recovery-code-display').style.display = 'block';
            document.getElementById('new-pin-input').value = "";
            showToast("toastPinSet");
            setTimeout(() => location.reload(), 7000);
        });
    }
});

document.getElementById('remove-pin-btn').addEventListener('click', () => {
    chrome.storage.local.remove(['appPin', 'recoveryCode', 'failedAttempts', 'lockoutUntil'], () => location.reload());
});

document.getElementById('show-recovery-btn').addEventListener('click', () => { 
    pinScreen.style.display = 'none'; 
    recScreen.style.display = 'flex'; 
});
document.getElementById('cancel-recovery-btn').addEventListener('click', () => { 
    recScreen.style.display = 'none'; 
    pinScreen.style.display = 'flex'; 
});
document.getElementById('verify-recovery-btn').addEventListener('click', () => {
    if (document.getElementById('recovery-input').value.trim().toUpperCase() === recoveryCode) {
        chrome.storage.local.remove(['appPin', 'recoveryCode', 'failedAttempts', 'lockoutUntil'], () => { 
            showToast("toastResetSec"); 
            setTimeout(() => location.reload(), 1000); 
        });
    } else { 
        showToast("toastInvalidRec"); 
    }
});

// =======================================================
// Shortcuts Recorder
// =======================================================
function formatSC(sc) { 
    return [sc.ctrlKey?'Ctrl':'', sc.altKey?'Alt':'', sc.shiftKey?'Shift':'', sc.code.replace('Key','').replace('Digit','')].filter(Boolean).join(' + '); 
}

function setupShortcutRecorder(inputId, storageKey, type) {
    const input = document.getElementById(inputId);
    chrome.storage.local.get([storageKey], r => {
        const defaultCode = type === 'panic' ? 'KeyX' : 'KeyC';
        input.value = formatSC(r[storageKey] || { altKey: true, ctrlKey: false, shiftKey: false, code: defaultCode });
    });
    input.addEventListener('keydown', e => {
        e.preventDefault(); 
        e.stopPropagation();
        if (['ControlLeft','ControlRight','AltLeft','AltRight','ShiftLeft','ShiftRight','MetaLeft'].includes(e.code)) return;
        if (!isPro && type === 'zen') return; 
        
        const sc = { ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey, code: e.code };
        chrome.storage.local.set({ [storageKey]: sc }, () => {
            input.value = formatSC(sc); 
            showToast("toastScUpdated");
            safeSendMessage({ action: "updateShortcut", type: type, shortcut: sc });
        });
    });
}
setupShortcutRecorder('panic-sc-input', 'panicShortcut', 'panic');
setupShortcutRecorder('zen-sc-input', 'zenShortcut', 'zen');

document.getElementById('clear-panic-btn').addEventListener('click', () => {
    const sc = { altKey: true, ctrlKey: false, shiftKey: false, code: 'KeyX' };
    chrome.storage.local.set({ panicShortcut: sc }, () => { 
        document.getElementById('panic-sc-input').value = formatSC(sc); 
        safeSendMessage({ action: "updateShortcut", type: 'panic', shortcut: sc }); 
    });
});

let redactedWordsArray = [];

function renderWordsList() {
    const listContainer = document.getElementById('redact-words-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    redactedWordsArray.forEach((word, idx) => {
        const tag = document.createElement('span');
        tag.className = 'word-tag';
        tag.textContent = word;
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = ' ×';
        removeBtn.addEventListener('click', () => {
            redactedWordsArray.splice(idx, 1);
            chrome.storage.local.set({ redactWords: redactedWordsArray }, () => {
                renderWordsList();
                sendPremiumConfig();
            });
        });
        
        tag.appendChild(removeBtn);
        listContainer.appendChild(tag);
    });
}

function sendPremiumConfig() {
    const autoLockVal = parseInt(document.getElementById('auto-lock').value) || 0;
    const hoverDelayVal = parseFloat(document.getElementById('hover-delay').value) || 0.4;
    const panicTargetVal = document.getElementById('panic-target').value || 'google';
    
    const getChk = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };

    const config = {
        action: "updatePremium",
        isPro: isPro,
        autoLock: autoLockVal,
        words: redactedWordsArray,
        hoverDelay: hoverDelayVal,
        panicTarget: panicTargetVal,
        phones: getChk('redact-phones'),
        emails: getChk('redact-emails'),
        links: getChk('redact-links'),
        prices: getChk('redact-prices'),
        cards: getChk('redact-cards'),
        iban: getChk('redact-iban'),
        natid: getChk('redact-natid'),
        passport: getChk('redact-passport')
    };
    safeSendMessage(config);
}

function addWord() {
    if (!isPro) return showToast("toastProFeature");
    const input = document.getElementById('redact-word-input');
    const word = input.value.trim();
    if (word && !redactedWordsArray.includes(word)) {
        redactedWordsArray.push(word);
        chrome.storage.local.set({ redactWords: redactedWordsArray }, () => {
            renderWordsList();
            sendPremiumConfig();
            input.value = '';
            showToast("toastWordsSaved");
        });
    } else {
        input.value = '';
    }
}

document.getElementById('add-word-btn').addEventListener('click', addWord);
document.getElementById('redact-word-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addWord();
});

document.addEventListener('DOMContentLoaded', () => {
    const buyLinkBtn = document.getElementById('t-btn-buy-license');
    if (buyLinkBtn) {
        buyLinkBtn.href = "https://1383719870243.gumroad.com/l/dsbmm";
    }

    chrome.storage.local.get([
        'isPro', 'redactWords', 'appLang', 'autoLock', 'hoverDelay', 'panicTarget',
        'redact-phones', 'redact-emails', 'redact-links', 'redact-prices', 
        'redact-cards', 'redact-iban', 'redact-natid', 'redact-passport', 'screenshot-protect',
        'activeLicense', 'remoteConfig'
    ], async (r) => {
        if (r.remoteConfig && r.remoteConfig.buyUrl && buyLinkBtn) {
            buyLinkBtn.href = r.remoteConfig.buyUrl;
        }
        if (r.appLang) currentLang = r.appLang;
        updateUI();
        initSecurity();
        
        // Trial Verification
        const trial = await checkTrialStatus();
        if (trial.permanent) {
            isPro = r.isPro || false;
            if (isPro && r.activeLicense) {
                const stillActive = await verifyActiveDevice();
                if (!stillActive) isPro = false;
            }
        } else if (trial.active) {
            isPro = true;
            document.getElementById('trial-banner').style.display = 'block';
            document.getElementById('trial-expired-banner').style.display = 'none';
            
            function updateCountdown(timeLeft) {
                let seconds = Math.floor(timeLeft / 1000);
                let hours = Math.floor(seconds / 3600);
                seconds %= 3600;
                let minutes = Math.floor(seconds / 60);
                const text = currentLang === 'ar'
                    ? `تنتهي الفترة التجريبية خلال ${hours} ساعة و ${minutes} دقيقة`
                    : `Trial ends in ${hours}h ${minutes}m`;
                document.getElementById('trial-countdown').textContent = text;
            }
            updateCountdown(trial.timeLeft);
            
            const trialInterval = setInterval(async () => {
                const tStatus = await checkTrialStatus();
                if (tStatus.active) {
                    updateCountdown(tStatus.timeLeft);
                } else {
                    clearInterval(trialInterval);
                    isPro = false;
                    updateProUI();
                    document.getElementById('trial-banner').style.display = 'none';
                    document.getElementById('trial-expired-banner').style.display = 'block';
                    safeSendMessage({ action: "updatePro", isPro: false });
                }
            }, 10000);
        } else {
            isPro = false;
            document.getElementById('trial-banner').style.display = 'none';
            document.getElementById('trial-expired-banner').style.display = 'block';
        }
        
        updateProUI();
        
        if (r.redactWords) {
            if (typeof r.redactWords === 'string') {
                redactedWordsArray = r.redactWords.split(',').map(w=>w.trim()).filter(w=>w);
            } else {
                redactedWordsArray = r.redactWords;
            }
        } else {
            redactedWordsArray = [];
        }
        renderWordsList();
        
        // Auto-lock slider
        const autoLockVal = r.autoLock || 0;
        const autoLockSlider = document.getElementById('auto-lock');
        const autoLockText = document.getElementById('auto-lock-text');
        if (autoLockSlider && autoLockText) {
            autoLockSlider.value = autoLockVal;
            autoLockText.textContent = autoLockVal === 0 ? (currentLang === 'ar' ? 'معطل' : 'Off') : autoLockVal + 'm';
            
            autoLockSlider.addEventListener('input', () => {
                if (!isPro && autoLockSlider.value > 0) {
                    autoLockSlider.value = 0;
                    return showToast("toastProFeature");
                }
                const val = parseInt(autoLockSlider.value);
                autoLockText.textContent = val === 0 ? (currentLang === 'ar' ? 'معطل' : 'Off') : val + 'm';
                chrome.storage.local.set({ autoLock: val });
                sendPremiumConfig();
            });
        }

        // Hover delay slider
        const hoverDelayVal = r.hoverDelay !== undefined ? r.hoverDelay : 0.4;
        const hoverDelaySlider = document.getElementById('hover-delay');
        const hoverDelayText = document.getElementById('hover-delay-text');
        if (hoverDelaySlider && hoverDelayText) {
            hoverDelaySlider.value = hoverDelayVal;
            hoverDelayText.textContent = hoverDelayVal + 's';
            
            hoverDelaySlider.addEventListener('input', () => {
                if (!isPro && hoverDelaySlider.value != 0.4) {
                    hoverDelaySlider.value = 0.4;
                    return showToast("toastProFeature");
                }
                const val = parseFloat(hoverDelaySlider.value);
                hoverDelayText.textContent = val + 's';
                chrome.storage.local.set({ hoverDelay: val });
                sendPremiumConfig();
            });
        }

        // Panic target selector
        const panicTargetVal = r.panicTarget || 'google';
        const panicTargetSelect = document.getElementById('panic-target');
        if (panicTargetSelect) {
            panicTargetSelect.value = panicTargetVal;
            panicTargetSelect.addEventListener('change', () => {
                chrome.storage.local.set({ panicTarget: panicTargetSelect.value });
                sendPremiumConfig();
            });
        }
        
        // Redaction toggles
        const redactToggles = ['redact-phones', 'redact-emails', 'redact-links', 'redact-prices'];
        redactToggles.forEach(id => {
            const cb = document.getElementById(id);
            if (cb) {
                cb.checked = r[id] || false;
                cb.addEventListener('change', () => {
                    if (!isPro && cb.checked) {
                        cb.checked = false;
                        return showToast("toastProFeature");
                    }
                    chrome.storage.local.set({ [id]: cb.checked });
                    sendPremiumConfig();
                });
            }
        });

        // Advanced redaction toggles
        const advancedRedactKeys = ['redact-cards', 'redact-iban', 'redact-natid', 'redact-passport', 'screenshot-protect'];
        advancedRedactKeys.forEach(key => {
            const el = document.getElementById(key);
            if (!el) return;
            el.checked = r[key] || false;
            el.addEventListener('change', () => {
                if (!isPro && el.checked) {
                    el.checked = false;
                    return showToast("toastProFeature");
                }
                chrome.storage.local.set({ [key]: el.checked });
                if (key !== 'screenshot-protect') {
                    safeSendMessage({ action: 'updateAdvancedRedact', key, value: el.checked });
                } else {
                    safeSendMessage({ action: 'updateScreenshotProtect', value: el.checked });
                }
                showToast(el.checked ? '✅ Enabled' : '⭕ Disabled');
            });
        });

        // Quick Lock Button
        const quickLockBtn = document.getElementById('quick-lock-btn');
        if (quickLockBtn) {
            quickLockBtn.addEventListener('mouseenter', () => {
                quickLockBtn.style.transform = 'scale(1.02)';
                quickLockBtn.style.boxShadow = '0 6px 30px rgba(234,0,56,0.55)';
            });
            quickLockBtn.addEventListener('mouseleave', () => {
                quickLockBtn.style.transform = 'scale(1)';
                quickLockBtn.style.boxShadow = '0 4px 20px rgba(234,0,56,0.35)';
            });
            quickLockBtn.addEventListener('click', () => {
                sendToAllWhatsAppTabs({ action: 'triggerPanic' }, (found) => {
                    const label = document.getElementById('quick-lock-label');
                    if (found) {
                        quickLockBtn.style.background = 'linear-gradient(135deg, #00a884, #008f70)';
                        if (label) label.textContent = '✓ Stealth Activated!';
                        showToast('🔴 WhatsApp disguised!');
                        setTimeout(() => {
                            if (label) label.textContent = 'PANIC — Hide Everything Now';
                            quickLockBtn.style.background = 'linear-gradient(135deg, #ea0038, #c20030)';
                        }, 2500);
                    } else {
                        if (label) label.textContent = '⚠️ Open WhatsApp Web First!';
                        setTimeout(() => {
                            if (label) label.textContent = 'PANIC — Hide Everything Now';
                        }, 2500);
                        showToast('⚠️ Open WhatsApp Web tab first!');
                    }
                });
            });
        }

        // Export Settings
        const exportBtn = document.getElementById('export-settings-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                chrome.storage.local.get(null, (data) => {
                    const exportData = {
                        version: '6.6',
                        app: 'WhatsHide',
                        exportedAt: new Date().toISOString(),
                        settings: data
                    };
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'whatshide-settings.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('📤 Settings exported!');
                });
            });
        }

        // Import Settings
        const importBtn = document.getElementById('import-settings-btn');
        const importFileInput = document.getElementById('import-file-input');
        if (importBtn && importFileInput) {
            importBtn.addEventListener('click', () => importFileInput.click());
            importFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const parsed = JSON.parse(ev.target.result);
                        if (parsed.app !== 'WhatsHide' || !parsed.settings) {
                            showToast('❌ Invalid settings file!');
                            return;
                        }
                        chrome.storage.local.set(parsed.settings, () => {
                            showToast('📥 Settings imported! Reload WhatsApp.');
                            setTimeout(() => location.reload(), 1500);
                        });
                    } catch(err) {
                        showToast('❌ Failed to parse file!');
                    }
                };
                reader.readAsText(file);
                importFileInput.value = '';
            });
        }

        // Referral 30-Day Reward Handler (Accurately grants 30 full days!)
        const shareRefBtn = document.getElementById('share-referral-btn');
        if (shareRefBtn) {
            shareRefBtn.addEventListener('click', async () => {
                const devId = await getOrCreateDeviceId();
                const now = Date.now();
                const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                const sig = await generateTrialSignature(now, devId);
                
                chrome.storage.local.set({
                    trialStartDate: now,
                    trialDuration: thirtyDaysMs,
                    trialSignature: sig,
                    deviceId: devId,
                    isPro: true
                }, () => {
                    safeSendMessage({ action: 'updatePro', isPro: true });
                    showToast('🎉 30-Day PRO Activated!');
                    const shareText = encodeURIComponent("🤫 Keep your WhatsApp Web chats hidden from coworkers & prying eyes! I use WhatsHide Chrome Extension: https://chromewebstore.google.com/detail/hkbkiifacpebmhkbbadenbohpeadjkgl");
                    window.open(`https://web.whatsapp.com/send?text=${shareText}`, '_blank');
                    setTimeout(() => location.reload(), 1500);
                });
            });
        }
    });
});
chrome.runtime.onInstalled.addListener(() => {
    chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
        tabs.forEach(tab => {
            chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["style.css"] }).catch(err => {});
            chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] }).catch(err => {});
        });
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "muteTab" && sender.tab) {
        chrome.tabs.update(sender.tab.id, { muted: request.muted });
    }
});
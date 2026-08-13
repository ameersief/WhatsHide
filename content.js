if (typeof window.omniShieldInit === 'undefined') {
    window.omniShieldInit = true;
    
    const SUPABASE_URL = "https://dqzhxjjhpugwhohuhlhd.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxemh4ampocHVnd2hvaHVobGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDA2MDcsImV4cCI6MjEwMDk3NjYwN30.9VBeRDqohynd8de6nW4bY1Waq5ePOroggog_ZO2RWfI";

    function applySetting(setting, isActive, value) {
        if (isActive) document.body.classList.add(setting);
        else document.body.classList.remove(setting);
        if (value) document.documentElement.style.setProperty(`--${setting}-val`, `${value}px`);
    }

    // الاعتماد على e.code ليعمل على أي لغة كيبورد
    let panicSC = { altKey: true, ctrlKey: false, shiftKey: false, code: 'KeyX' };
    let zenSC = { altKey: true, ctrlKey: false, shiftKey: false, code: 'KeyC' };
    
    let isPanicMode = false; let isZenMode = false;
    let originalTitle = document.title;
    
    let iconLink = document.querySelector("link[rel~='icon']");
    if (!iconLink) { iconLink = document.createElement('link'); iconLink.rel = 'icon'; document.head.appendChild(iconLink); }
    let originalFavicon = iconLink.href;
    const fakeFavicon = "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";

    let autoLockTimer; let autoLockMinutes = 0; let redactedWords = []; let isPro = false;
    let redactPhones = false; let redactEmails = false; let redactLinks = false; let redactPrices = false;
    let redactCards = false; let redactIban = false; let redactNatid = false; let redactPassport = false;
    let screenshotProtect = false;
    
    let redactTimeout;
    let isRedacting = false;
    let isPopupOpen = false;
    
    let panicTarget = 'google';
    const panicTargetsMap = {
        'google': {
            title: "Google",
            favicon: "data:image/x-icon;base64,AAABAAIAEBAAAAEAIABoBAAAJgAAACAgAAABACAAqBAAAI4EAAAoAAAAEAAAACAAAAABACAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///zD9/f2W/f392P39/fn9/f35/f391/39/ZT+/v4uAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v7+Cf39/Zn///////////////////////////////////////////39/ZX///8IAAAAAAAAAAAAAAAA/v7+Cf39/cH/////+v35/7TZp/92ul3/WKs6/1iqOv9yuFn/rNWd//j79v///////f39v////wgAAAAAAAAAAP39/Zn/////7PXp/3G3WP9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP+Or1j//vDo///////9/f2VAAAAAP///zD/////+vz5/3G3V/9TqDT/WKo6/6LQkf/U6cz/1urO/6rUm/+Zo0r/8IZB//adZ////v7///////7+/i79/f2Y/////4nWzf9Lqkj/Vqo4/9Xqzv///////////////////////ebY//SHRv/0hUL//NjD///////9/f2U/f392v////8sxPH/Ebzt/43RsP/////////////////////////////////4roL/9IVC//i1jf///////f391/39/fr/////Cr37/wW8+/+16/7/////////////////9IVC//SFQv/0hUL/9IVC//SFQv/3pnX///////39/fn9/f36/////wu++/8FvPv/tuz+//////////////////SFQv/0hUL/9IVC//SFQv/0hUL/96p7///////9/f35/f392/////81yfz/CrL5/2uk9v///////////////////////////////////////////////////////f392P39/Zn/////ks/7/zdS7P84Rur/0NT6///////////////////////9/f////////////////////////39/Zb+/v4y//////n5/v9WYu3/NUPq/ztJ6/+VnPT/z9L6/9HU+v+WnfT/Ul7t/+Hj/P////////////////////8wAAAAAP39/Z3/////6Or9/1hj7v81Q+r/NUPq/zVD6v/UqDX/U6g0/1OoNP9sdvD////////////9/f2YAAAAAAAAAAD///8K/f39w//////5+f7/paz2/11p7v88Suv/Okfq/1pm7v+iqfX/+fn+///////9/f3B/v7+CQAAAAAAAAAAAAAAAP///wr9/f2d///////////////////////////////////////////9/f2Z/v7+CQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/jL9/f2Z/f392/39/fr9/f36/f392v39/Zj///8wAAAAAAAAAAAAAAAAAAAAAPAPAADAAwAAgAEAAIABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIABAACAAQAAwAMAAPAPAAAoAAAAIAAAAEAAAAABACAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/g3+/v5X/f39mf39/cj9/f3q/f39+f39/fn9/f3q/f39yP39/Zn+/v5W////DAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/iT9/f2c/f399f/////////////////////////////////////////////////////9/f31/f39mv7+/iMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/gn9/f2K/f39+////////////////////////////////////////////////////////////////////////////f39+v39/Yf///8IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+/v4k/f390v////////////////////////////////////////////////////////////////////////////////////////////////39/dD///8iAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////MP39/er//////////////////////////+r05v+v16H/gsBs/2WxSf9Wqjj/Vqk3/2OwRv99vWX/pdKV/97u2P////////////////////////////39/ej+/v4vAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/iT9/f3q/////////////////////+v15/+Pxnv/VKk2/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/36+Z//d7tf///////////////////////39/ej///8iAAAAAAAAAAAAAAAAAAAAAAAAAAD///8K/f390//////////////////////E4bn/XKw+/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/1apN/+x0pv///////////////////////39/dD///8IAAAAAAAAAAAAAAAAAAAAAP39/Yv/////////////////////sdij/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP9TqDT/YKU1/8qOPv/5wZ////////////////////////39/YcAAAAAAAAAAAAAAAD+/v4l/f39+////////////////8Lgt/9TqDT/U6g0/1OoNP9TqDT/U6g0/1OoNP9utlT/n86N/7faqv+426v/pdKV/3u8ZP9UqDX/U6g0/3egN//jiUH/9IVC//SFQv/82MP//////////////////f39+v7+/iMAAAAAAAAAAP39/Z3////////////////q9Ob/W6w+/1OoNP9TqDT/U6g0/1OoNP9nskz/zOXC/////////////////////////////////+Dv2v+osWP/8YVC//SFQv/0hUL/9IVC//WQVP/++fb//////////////////f39mgAAAAD+/v4O/f399v///////////////4LHj/9TqDT/U6g0/1OoNP9TqDT/dblc//L58P/////////////////////////////////////////////8+v/3p3f/9IVC//SFQv/0hUL/9IVC//rIqf/////////////////9/f31////DP7+/ln////////////////f9v7/Cbz2/zOwhv9TqDT/U6g0/2KwRv/v9+z///////////////////////////////////////////////////////738//1kFT/9IVC//SFQv/0hUL/9plg///////////////////////+/v5W/f39nP///////////////4jf/f8FvPv/Bbz7/yG1s/9QqDz/vN2w//////////////////////////////////////////////////////////////////rHqP/0hUL/9IVC//SFQv/0hUL//vDn//////////////////39/Zn9/f3L////////////////R878/wW8+/8FvPv/Bbz7/y7C5P/7/fr//////////////////////////////////////////////////////////////////ere//SFQv/0hUL/9IVC//SFQv/718H//////////////////f39yP39/ez///////////////8cwvv/Bbz7/wW8+/8FvPv/WNL8///////////////////////////////////////0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//rIqv/////////////////9/f3q/f39+v///////////////we9+/8FvPv/Bbz7/wW8+/993P3///////////////////////////////////////SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/+cGf//////////////////39/fn9/f36////////////////B737/wW8+/8FvPv/Bbz7/33c/f//////////////////////////////////////9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/6xaX//////////////////f39+f39/e3///////////////8cwvv/Bbz7/wW8+/8FvPv/WdP8///////////////////////////////////////0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//SFQv/0hUL/9IVC//vVv//////////////////9/f3q/f39y////////////////0bN/P8FvPv/Bbz7/wW8+/8hrvn/+/v///////////////////////////////////////////////////////////////////////////////////////////////////////////////////39/cj9/f2c////////////////ht/9/wW8+/8FvPv/FZP1/zRJ6/+zuPf//////////////////////////////////////////////////////////////////////////////////////////////////////////////////f39mf7+/lr////////////////d9v7/B7n7/yB38f81Q+r/NUPq/0hV7P/u8P3////////////////////////////////////////////////////////////////////////////////////////////////////////////+/v5X////D/39/ff///////////////9tkPT/NUPq/zVD6v81Q+r/NUPq/2Fs7//y8v7////////////////////////////////////////////09f7//////////////////////////////////////////////////f399f7+/g0AAAAA/f39n////////////////+Tm/P89Suv/NUPq/zVD6v81Q+r/NUPq/1Bc7f/IzPn/////////////////////////////////x8v5/0xY7P+MlPP////////////////////////////////////////////9/f2cAAAAAAAAAAD+/v4n/f39/P///////////////7W69/81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v9ZZe7/k5v0/6609/+vtff/lJv0/1pm7v81Q+r/NUPq/zVD6v+GjvL//v7//////////////////////////////f39+/7+/iQAAAAAAAAAAAAAAAD9/f2N/////////////////////6Cn9f81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v+GivL////////////////////////////9/f2KAAAAAAAAAAAAAAAAAAAAAP7+/gv9/f3V/////////////////////7W69/8+S+v/NUPq/zVD6v81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v81Q+r/P0zr/7q/+P///////////////////////f390v7+/gkAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/ib9/f3r/////////////////////+Xn/P94gfH/NkTq/zVD6v81Q+r/NUPq/zVD6v81Q+r/NUPq/zVD6v81Q+r/NkTq/3Z/8f/l5/z///////////////////////39/er+/v4kAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/jL9/f3r///////////////////////////k5vz/nqX1/2p08P9IVez/OEbq/zdF6v9GU+z/aHLv/5qh9f/i5Pz////////////////////////////9/f3q////MAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP7+/ib9/f3V/////////////////////////////////////////////////////////////////////////////////////////////////f390v7+/iQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP///wr9/f2N/f39/P///////////////////////////////////////////////////////////////////////////f39+/39/Yv+/v4JAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD+/v4n/f39n/39/ff//////////////////////////////////////////////////////f399v39/Z3+/v4lAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/v7+Dv7+/lr9/f2c/f39y/39/e39/f36/f39+v39/ez9/f3L/f39nP7+/ln+/v4OAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AA///AAD//AAAP/gAAB/wAAAP4AAAB8AAAAPAAAADgAAAAYAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAABgAAAAcAAAAPAAAAD4AAAB/AAAA/4AAAf/AAAP/8AAP//wAP"
        },
        'google-drive': {
            title: "My Drive - Google Drive",
            favicon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADBklEQVR4AWIgFYwC8QYrHYkGCwcAbeUAZFcMQNHMdG3btlmu7fe3tm3btu32o7Zt27ZtpslMs3z5yerOnPF758ZimA6KdAEVleCVgofX3OQ9SASVcXSt/la4D1iUqzxqUWONEJlwC/HbZmRVqlwyyQv+2q2COVS+o5dKeiE5xPguTPspJrcZEg7vbtH6hgtgfu+uVK9c5KGKXAsk/oSABIdxUcUK9JrjTEZPeAT3AY2yj14mLCJiQsDSTGg5JF/uNjwEvtmuQcT57FEZVCZ5kCwnAgvFcJ0an1dg8TKLP1gowrdv+zQcSj/9MuEYrUCwNOe79fAqsMZYf/hjlwqtAPy5W1VaSrmkHk1O8F2Qeun2Zu0bREZll0rVEsm9Fbk6IXLhEZYwWIcEpxCQwSm4D6jwj14qGcYh/xakyHXBo2PIyVI045JHSLMc8M9ZBdD+GEW+wevMUeIZ3AcMACshshwpx+if4WUi36Af2+AdzyyxR2WUcrlUEsUhh8FyoREoEnzmOWbh1/d96i7i9/2+KBX083McBU4BkeBbD99+HCU2UUaf04xn9PhyApSg+78WQ06OZSIomIB1WQZo7V8xC0iFZYAR/BJy7IVrhY4lXlOeYxe+PMcGMPJzp2oI5yxEARKXwQsGuwxd+Mp58DIoyrAFT0PHb1wTM+LzIh6WD+2/6WN3h6cfOjvBYnRx+vmxp/3ddz2cGwMSi5aXUi1bXYQ07Npdg+jHPxCQh6Shb97fS4yGL2NDqTxPCPEBeRm8TwWJrtEKhPR7wS0nTG457w9N/io2dBcoGsvW5xPF5C4db4pLGCQOf/fnYnqWWIFfZPTFgoTbCsqtWl2CVQa9pYsYdO+yq/jo40JmAVps2l52QeJfpIBnt3tsEYO9klYFC7x7FxWg/D2wanVhHJZbt7kMawz/+KOsBWr1v/P1WVzE/wIh7QArpm2v6Fi2unQoqM/zx9wiBvOaTXr0MjZsFYyK+jdY4UPYEY4tn6qcWr5sdmz7sp8S7NT6eX147b0csOWDEYwCAJuJN71tqVZWAAAAAElFTkSuQmCC"
        },
        'outlook': {
            title: "Mail - Outlook",
            favicon: "data:image/x-icon;base64,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"
        },
        'wikipedia': {
            title: "Wikipedia, the free encyclopedia",
            favicon: "data:image/x-icon;base64,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"
        },
        'blank': {
            title: "New Tab",
            favicon: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        }
    };

    function getCamouflageHTML(target) {
        if (target === 'google') {
            return `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; width: 100%; max-width: 650px; padding: 20px; box-sizing: border-box; font-family: arial, sans-serif !important;">
                    <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google" style="width: 272px; height: 92px; margin-bottom: 30px; object-fit: contain;">
                    <div style="display: flex; align-items: center; width: 100%; max-width: 584px; height: 46px; background: #fff; border: 1px solid #dfe1e5; border-radius: 24px; box-shadow: none; padding: 0 14px; box-sizing: border-box;">
                        <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: #9aa0a6; margin-right: 12px;"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        <input type="text" id="omni-google-search-input" style="flex: 1; border: none; outline: none; font-size: 16px; color: #000; height: 34px; padding: 0; background: transparent; font-family: arial, sans-serif !important;">
                        <svg focusable="false" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px; fill: #4285f4; cursor: pointer; margin-left: 8px;"><path d="m12 15c1.66 0 3-1.34 3-3v-6c0-1.66-1.34-3-3-3s-3 1.34-3 3v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1s-5.3-2.1-5.3-5.1h-1.7c0 3.41 2.72 6.23 6 6.72v3.28h2v-3.28c3.28-.48 6-3.3 6-6.72z"/></svg>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 29px;">
                        <button id="omni-google-search-btn" style="background-color: #f8f9fa; border: 1px solid #f8f9fa; border-radius: 4px; color: #3c4043; font-family: arial,sans-serif; font-size: 14px; margin: 11px 4px; padding: 0 16px; line-height: 27px; height: 36px; min-width: 54px; text-align: center; cursor: pointer;">Google Search</button>
                        <button id="omni-google-lucky-btn" style="background-color: #f8f9fa; border: 1px solid #f8f9fa; border-radius: 4px; color: #3c4043; font-family: arial,sans-serif; font-size: 14px; margin: 11px 4px; padding: 0 16px; line-height: 27px; height: 36px; min-width: 54px; text-align: center; cursor: pointer;">I'm Feeling Lucky</button>
                    </div>
                </div>
                <div style="background: #f2f2f2; width: 100%; border-top: 1px solid #dadce0; display: flex; flex-direction: column; font-size: 14px; color: #70757a; font-family: arial, sans-serif !important; text-align: left !important; direction: ltr !important;">
                    <div style="padding: 15px 30px; border-bottom: 1px solid #dadce0;">Global</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; padding: 15px 30px;">
                        <div style="display: flex; gap: 30px;">
                            <span>About</span><span>Advertising</span><span>Business</span><span>How Search works</span>
                        </div>
                        <div style="display: flex; gap: 30px;">
                            <span>Privacy</span><span>Terms</span><span>Settings</span>
                        </div>
                    </div>
                </div>
            `;
        }
        if (target === 'google-drive') {
            return `
                <div style="display: flex; width: 100%; height: 100%; background: #f8f9fa; font-family: 'Google Sans', Roboto, RobotoDraft, Helvetica, Arial, sans-serif !important; text-align: left !important; direction: ltr !important;">
                    <!-- Top Navigation Bar -->
                    <div style="position: absolute; top: 0; left: 0; right: 0; height: 64px; background: #fff; border-bottom: 1px solid #dadce0; display: flex; align-items: center; padding: 0 20px; justify-content: space-between; box-sizing: border-box;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png" style="width: 40px; height: 40px; object-fit: contain;">
                            <span style="font-size: 22px; color: #5f6368; font-weight: 400;">Drive</span>
                        </div>
                        <div style="display: flex; align-items: center; background: #f1f3f4; border-radius: 8px; width: 100%; max-width: 720px; height: 46px; padding: 0 12px; box-sizing: border-box; margin: 0 20px;">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: #5f6368; margin-right: 12px;"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                            <input type="text" placeholder="Search in Drive" style="flex: 1; border: none; background: transparent; font-size: 16px; outline: none; color: #5f6368;">
                        </div>
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #0078d4; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">A</div>
                    </div>
                    <!-- Sidebar -->
                    <div style="width: 256px; border-right: 1px solid #dadce0; padding-top: 80px; box-sizing: border-box; display: flex; flex-direction: column; gap: 4px; padding-left: 12px; padding-right: 12px; background: #fff;">
                        <div style="display: flex; align-items: center; justify-content: center; width: 120px; height: 48px; border-radius: 24px; background: #fff; box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15); font-weight: 500; font-size: 14px; color: #3c4043; cursor: pointer; margin-bottom: 16px; gap: 8px;">
                            <span style="font-size: 24px; font-weight: bold; color: #34a853;">+</span> New
                        </div>
                        <div style="display: flex; align-items: center; height: 40px; border-radius: 0 20px 20px 0; background: #e8f0fe; color: #1a73e8; font-weight: 500; font-size: 14px; padding-left: 24px; gap: 12px;">
                            My Drive
                        </div>
                        <div style="display: flex; align-items: center; height: 40px; border-radius: 0 20px 20px 0; color: #3c4043; font-weight: 400; font-size: 14px; padding-left: 24px; gap: 12px;">
                            Computers
                        </div>
                        <div style="display: flex; align-items: center; height: 40px; border-radius: 0 20px 20px 0; color: #3c4043; font-weight: 400; font-size: 14px; padding-left: 24px; gap: 12px;">
                            Shared with me
                        </div>
                        <div style="display: flex; align-items: center; height: 40px; border-radius: 0 20px 20px 0; color: #3c4043; font-weight: 400; font-size: 14px; padding-left: 24px; gap: 12px;">
                            Recent
                        </div>
                        <div style="display: flex; align-items: center; height: 40px; border-radius: 0 20px 20px 0; color: #3c4043; font-weight: 400; font-size: 14px; padding-left: 24px; gap: 12px;">
                            Starred
                        </div>
                        <div style="display: flex; align-items: center; height: 40px; border-radius: 0 20px 20px 0; color: #3c4043; font-weight: 400; font-size: 14px; padding-left: 24px; gap: 12px;">
                            Trash
                        </div>
                    </div>
                    <!-- Files Area -->
                    <div style="flex: 1; padding-top: 80px; padding-left: 30px; padding-right: 30px; box-sizing: border-box; display: flex; flex-direction: column;">
                        <div style="font-size: 18px; color: #202124; font-weight: 400; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                            <span>My Drive</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 10px;">
                            <div style="border: 1px solid #dadce0; border-radius: 6px; padding: 12px; background: #fff; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #5f6368;"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                                <span style="font-size: 14px; color: #3c4043; font-weight: 500;">Project Q3</span>
                            </div>
                            <div style="border: 1px solid #dadce0; border-radius: 6px; padding: 12px; background: #fff; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #5f6368;"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                                <span style="font-size: 14px; color: #3c4043; font-weight: 500;">Financial Reports</span>
                            </div>
                            <div style="border: 1px solid #dadce0; border-radius: 6px; padding: 12px; background: #fff; display: flex; align-items: center; gap: 12px; box-sizing: border-box;">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 24px; height: 24px; fill: #1a73e8;"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                <span style="font-size: 14px; color: #3c4043; font-weight: 500;">Marketing Plan.pdf</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        if (target === 'outlook') {
            return `
                <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background: #f3f2f1; font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif !important; text-align: left !important; direction: ltr !important;">
                    <!-- Top Blue Header -->
                    <div style="height: 48px; background: #0078d4; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; box-sizing: border-box; color: #fff;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <span style="font-weight: 600; font-size: 16px;">Outlook</span>
                        </div>
                        <div style="display: flex; align-items: center; background: #c7e0f4; border-radius: 4px; width: 100%; max-width: 480px; height: 32px; padding: 0 8px; box-sizing: border-box;">
                            <input type="text" placeholder="Search" style="flex: 1; border: none; background: transparent; font-size: 14px; outline: none; color: #201f1e;">
                        </div>
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #fff; color: #0078d4; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">U</div>
                    </div>
                    
                    <!-- Main Body -->
                    <div style="display: flex; flex: 1; overflow: hidden;">
                        <!-- Sidebar -->
                        <div style="width: 200px; background: #fff; border-right: 1px solid #edebe9; display: flex; flex-direction: column; padding: 12px 0; box-sizing: border-box; gap: 8px;">
                            <div style="background: #0078d4; color: white; border-radius: 4px; margin: 0 12px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; cursor: pointer;">New message</div>
                            <div style="padding: 8px 24px; font-weight: 600; background: #f3f2f1; color: #0078d4; font-size: 14px; cursor: pointer;">Inbox</div>
                            <div style="padding: 8px 24px; color: #323130; font-size: 14px; cursor: pointer;">Sent Items</div>
                            <div style="padding: 8px 24px; color: #323130; font-size: 14px; cursor: pointer;">Drafts</div>
                            <div style="padding: 8px 24px; color: #323130; font-size: 14px; cursor: pointer;">Deleted Items</div>
                        </div>
                        <!-- Email List -->
                        <div style="flex: 1; background: #fff; display: flex; flex-direction: column; border-right: 1px solid #edebe9;">
                            <div style="height: 48px; border-bottom: 1px solid #edebe9; display: flex; align-items: center; padding: 0 16px; font-weight: 600; font-size: 15px; color: #323130;">Inbox</div>
                            <div style="display: flex; flex-direction: column;">
                                <div style="display: flex; flex-direction: column; padding: 12px 16px; border-bottom: 1px solid #f3f2f1; background: #f3f2f1;">
                                    <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 13.5px; color: #201f1e;">
                                        <span>HR Department</span><span>10:24 AM</span>
                                    </div>
                                    <span style="font-weight: 600; font-size: 13px; color: #0078d4; margin-top: 4px;">Update: Q3 Performance Reviews</span>
                                    <span style="font-size: 12.5px; color: #605e5c; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Please review the updated instructions and deadlines for the upcoming performance review cycle...</span>
                                </div>
                                <div style="display: flex; flex-direction: column; padding: 12px 16px; border-bottom: 1px solid #f3f2f1;">
                                    <div style="display: flex; justify-content: space-between; font-weight: 400; font-size: 13.5px; color: #201f1e;">
                                        <span>IT Helpdesk</span><span>9:15 AM</span>
                                    </div>
                                    <span style="font-weight: 600; font-size: 13px; color: #323130; margin-top: 4px;">Scheduled Server Maintenance</span>
                                    <span style="font-size: 12.5px; color: #605e5c; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Tonight starting at 10:00 PM EST, we will perform scheduled database upgrades. Services will be offline for...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        if (target === 'wikipedia') {
            return `
                <div style="display: flex; flex-direction: column; width: 100%; height: 100%; background: #f6f6f6; color: #202020; font-family: sans-serif !important; overflow-y: auto; text-align: left !important; direction: ltr !important;">
                    <!-- Wikipedia Top Bar -->
                    <div style="height: 56px; background: #fff; border-bottom: 1px solid #a2a9b1; display: flex; align-items: center; padding: 0 24px; justify-content: space-between; box-sizing: border-box;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="https://en.wikipedia.org/static/images/icons/wikipedia.png" style="width: 32px; height: 32px;">
                            <span style="font-family: serif; font-size: 20px; font-weight: normal; color: #000;">WIKIPEDIA</span>
                        </div>
                        <div style="display: flex; align-items: center; background: #fff; border: 1px solid #a2a9b1; border-radius: 2px; width: 280px; height: 32px; padding: 0 8px;">
                            <input type="text" placeholder="Search Wikipedia" style="flex: 1; border: none; font-size: 13px; outline: none; background: transparent; color: #000;">
                        </div>
                    </div>
                    
                    <!-- Content Container -->
                    <div style="display: flex; flex: 1; padding: 24px 50px; background: #fff; max-width: 1200px; margin: 0 auto; box-sizing: border-box; border-left: 1px solid #a2a9b1; border-right: 1px solid #a2a9b1;">
                        <div style="flex: 1;">
                            <h1 style="font-family: serif; font-size: 32px; border-bottom: 1px solid #a2a9b1; padding-bottom: 8px; margin-top: 0; font-weight: normal; color: #000;">Efficiency (productivity)</h1>
                            <p style="font-size: 14px; line-height: 1.6; margin-top: 16px; color: #202020;">
                                <strong>Efficiency</strong> is the peak level of performance that uses the least amount of inputs to achieve the highest amount of output. It minimizes the wasting of resources such as physical materials, energy, and time while accomplishing the desired output.
                            </p>
                            <p style="font-size: 14px; line-height: 1.6; margin-top: 16px; color: #202020;">
                                In economic terms, efficiency is used to describe the relationship between inputs and outputs, focusing on minimizing cost for a given output or maximizing output for a given cost.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        }
        return `
            <div style="width: 100%; height: 100%; background: #ffffff;"></div>
        `;
    }

    function triggerPanic(forceState = null) {
        isPanicMode = forceState !== null ? forceState : !isPanicMode;
        document.body.classList.toggle('panic-mode', isPanicMode);
        
        let overlay = document.getElementById('omni-panic-overlay');
        
        if (isPanicMode) {
            originalTitle = document.title; originalFavicon = iconLink.href;
            const target = panicTargetsMap[panicTarget] || panicTargetsMap['google'];
            document.title = target.title; iconLink.href = target.favicon;
            chrome.runtime.sendMessage({ action: "muteTab", muted: true });
            
            // إظهار التمويه الكامل
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'omni-panic-overlay';
                overlay.style.cssText = `
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    background: #ffffff !important;
                    color: #202124 !important;
                    z-index: 2147483647 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    box-sizing: border-box !important;
                `;
                document.body.appendChild(overlay);
            }
            
            overlay.innerHTML = getCamouflageHTML(panicTarget);
            overlay.style.display = 'flex';
            
            // تفعيل مستمعي البحث في حالة جوجل
            if (panicTarget === 'google') {
                const searchInput = overlay.querySelector('#omni-google-search-input');
                const searchBtn = overlay.querySelector('#omni-google-search-btn');
                const luckyBtn = overlay.querySelector('#omni-google-lucky-btn');
                
                const execSearch = () => {
                    const q = encodeURIComponent(searchInput.value.trim());
                    if (q) window.location.href = `https://www.google.com/search?q=${q}`;
                };
                
                if (searchInput) {
                    searchInput.focus();
                    searchInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') execSearch();
                        e.stopPropagation(); // منع انتقال الحدث للدردشة بالخلفية
                    });
                }
                if (searchBtn) {
                    searchBtn.addEventListener('click', (e) => {
                        execSearch();
                        e.stopPropagation();
                    });
                }
                if (luckyBtn) {
                    luckyBtn.addEventListener('click', (e) => {
                        const q = encodeURIComponent(searchInput.value.trim());
                        if (q) window.location.href = `https://www.google.com/search?btnI=1&q=${q}`;
                        e.stopPropagation();
                    });
                }
            }
        } else {
            document.title = originalTitle; iconLink.href = originalFavicon;
            chrome.runtime.sendMessage({ action: "muteTab", muted: false });
            
            if (overlay) {
                overlay.style.display = 'none';
                overlay.innerHTML = '';
            }
        }
        
        if (!document.getElementById('panic-style')) {
            const style = document.createElement('style'); style.id = 'panic-style';
            style.innerHTML = `body.panic-mode #app { filter: blur(40px) grayscale(100%) !important; opacity: 0.05 !important; transition: all 0.15s ease !important; pointer-events: none !important; }`;
            document.head.appendChild(style);
        }
    }

    function toggleZen() {
        if(!isPro) return; // حصري للمدفوع
        isZenMode = !isZenMode;
        document.body.classList.toggle('zen-mode', isZenMode);
    }

    function resetTimer() {
        clearTimeout(autoLockTimer);
        if (autoLockMinutes > 0 && isPro) {
            autoLockTimer = setTimeout(() => { if (!isPanicMode) triggerPanic(true); }, autoLockMinutes * 60000);
        }
    }
    window.addEventListener('mousemove', resetTimer); window.addEventListener('keydown', resetTimer);

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function restoreRedactions() {
        document.querySelectorAll('.omni-redact-span').forEach(span => {
            const grandParent = span.parentNode;
            if (grandParent) {
                const textNode = document.createTextNode(span.textContent);
                grandParent.replaceChild(textNode, span);
            }
        });
    }

    let _screenshotProtectActive = false;
    function enableScreenshotProtect() {
        if (_screenshotProtectActive) return;
        _screenshotProtectActive = true;

        const applyBlackout = () => {
            if (!screenshotProtect) return;
            document.body.classList.add('screenshot-blur-active');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText('').catch(() => {});
            }
        };

        const removeBlackout = () => {
            document.body.classList.remove('screenshot-blur-active');
        };

        // 1. Instant Keydown & Keyup capture for all screenshot & print hotkeys (PrintScreen, Win+Shift+S, Cmd+Shift+S, Ctrl+P, Ctrl+S)
        const handleScreenshotHotkeys = (e) => {
            if (!screenshotProtect) return;

            const isPrtSc = e.key === 'PrintScreen' || e.code === 'PrintScreen' || e.keyCode === 44;
            // Win + Shift + S (Windows Snipping Tool) or Cmd + Shift + 3/4/S (Mac)
            const isSnippingTool = e.shiftKey && (e.metaKey || e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight' || e.code === 'KeyS' || e.key === 'S' || e.key === 's');
            const isPrintCmd = (e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP');
            const isSaveCmd = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.code === 'KeyS') && !e.shiftKey;

            if (isPrtSc || isSnippingTool || isPrintCmd || isSaveCmd) {
                applyBlackout();
                setTimeout(removeBlackout, 2500);
            }
        };

        window.addEventListener('keydown', handleScreenshotHotkeys, true);
        window.addEventListener('keyup', handleScreenshotHotkeys, true);

        // 2. Tab Visibility Change: Protection when tab is hidden or backgrounded
        document.addEventListener('visibilitychange', () => {
            if (!screenshotProtect) return;
            if (document.hidden) applyBlackout();
            else removeBlackout();
        });
    }

    function applyHoverDelay(delay) {
        const d = delay !== undefined ? delay : 1.5;
        document.documentElement.style.setProperty('--omni-hover-delay', `${d}s`);
    }

    function isEditable(node) {
        let parent = node.parentNode;
        while (parent) {
            if (parent.nodeName === 'INPUT' || parent.nodeName === 'TEXTAREA' || parent.contentEditable === 'true') {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }

    // === Precompiled Regex Patterns (regex literals - safe, no Invalid escape) ===
    const REGEX_EMAIL    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/i;
    const REGEX_PHONE    = /(?:\+|00)\d{1,4}[\-.\s]?\(?\d{1,4}\)?(?:[\-.\s]?\d){4,12}|(?<!\d)0\d{2,3}[\-.\s]?\d{3,4}[\-.\s]?\d{3,5}(?!\d)/;
    const REGEX_LINK     = /https?:\/\/[^\s"'<>()[\]{}|\\^`]+/;
    const REGEX_PRICE    = /[$£€¥₹₩₪₴₺₽]\s?\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*[$£€¥₹₩₪₴₺₽]|\d+(?:[.,]\d+)?\s+(?:AED|SAR|QAR|EGP|USD|EUR|GBP|JOD|KWD|ريال|درهم|جنيه|دينار)/i;
    const REGEX_CARD     = /\b(?:\d{4}[\s\-]?){3}\d{4}\b/;  // Credit/Debit card
    const REGEX_IBAN     = /\b[A-Z]{2}\d{2}[\s\-]?[A-Z0-9]{4}[\s\-]?(?:[A-Z0-9][\s\-]?){7,26}\b/i; // IBAN with optional spaces/dashes
    const REGEX_NATID    = /\b[12]\d{9}\b/;  // Saudi/Gulf National IDs strictly starting with 1 or 2
    const REGEX_PASSPORT = /\b[A-Z]{1,2}[0-9]{6,9}\b/i;

    function buildRedactRegex() {
        const parts = [];

        // Custom words
        redactedWords.forEach(word => {
            const escaped = escapeRegExp(word);
            let pattern = escaped;
            if (/^[\p{L}\p{N}]/u.test(word)) pattern = '(?<![\\p{L}\\p{N}])' + pattern;
            if (/[\p{L}\p{N}]$/u.test(word))  pattern = pattern + '(?![\\p{L}\\p{N}])';
            parts.push(pattern);
        });

        if (redactEmails)   parts.push(REGEX_EMAIL.source);
        if (redactIban)     parts.push(REGEX_IBAN.source);    // IBAN before Card to prevent 16-digit blocks inside IBAN matching as Cards
        if (redactCards)    parts.push(REGEX_CARD.source);
        if (redactPhones)   parts.push(REGEX_PHONE.source);
        if (redactLinks)    parts.push(REGEX_LINK.source);
        if (redactPrices)   parts.push(REGEX_PRICE.source);
        if (redactNatid)    parts.push(REGEX_NATID.source);
        if (redactPassport) parts.push(REGEX_PASSPORT.source);

        if (parts.length === 0) return null;
        try {
            return new RegExp('(' + parts.join('|') + ')', 'giu');
        } catch(e) {
            console.error('WhatsHide: regex build error', e);
            return null;
        }
    }

    // مفتاح يتتبع آخر pattern مُطبَّق — نُعيد البناء فقط عند تغيّره
    let _lastPatternKey = '';

    function getPatternKey() {
        return [
            redactEmails   ? 'E' : '',
            redactPhones   ? 'P' : '',
            redactLinks    ? 'L' : '',
            redactPrices   ? 'R' : '',
            redactCards    ? 'C' : '',
            redactIban     ? 'I' : '',
            redactNatid    ? 'N' : '',
            redactPassport ? 'X' : '',
            redactedWords.join(',')
        ].join('|');
    }

    function applySmartRedaction() {
        if (isRedacting) return;
        isRedacting = true;
        if (typeof observer !== 'undefined') observer.disconnect();

        if (!isPro) {
            // عند إيقاف PRO: نُزيل كل الإخفاء بشكل ناعم
            restoreRedactions();
            _lastPatternKey = '';
            if (typeof observer !== 'undefined') observer.observe(document.body, { childList: true, subtree: true });
            isRedacting = false;
            return;
        }

        const regex = buildRedactRegex();
        const patternKey = getPatternKey();

        if (!regex) {
            // لا يوجد pattern: أزل الإخفاء الموجود بشكل ناعم
            if (_lastPatternKey !== '') {
                restoreRedactions();
                _lastPatternKey = '';
            }
            if (typeof observer !== 'undefined') observer.observe(document.body, { childList: true, subtree: true });
            isRedacting = false;
            return;
        }

        // إذا تغيّر الـ pattern، نحذف القديم مع إخفاء الـ flash بـ CSS
        if (patternKey !== _lastPatternKey) {
            document.body.classList.add('omni-restoring');
            restoreRedactions();
            _lastPatternKey = patternKey;
            // نُزيل class الإخفاء بعد تطبيق الـ pattern الجديد
        }

        const testRegex    = new RegExp(regex.source, 'iu');
        const replaceRegex = new RegExp(regex.source, 'giu');

        // نجمع فقط نصوص جديدة (غير مُغلَّفة بـ omni-redact-span)
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node; const nodesToReplace = [];
        while (node = walker.nextNode()) {
            const val = node.nodeValue;
            if (!val || !val.trim()) continue;
            const parent = node.parentNode;
            if (!parent) continue;
            const pTag = parent.nodeName;
            if (pTag === 'OMNI-REDACT' || pTag === 'SCRIPT' || pTag === 'STYLE') continue;
            if (parent.className === 'omni-redact-span') continue; // ← مُعالَج مسبقاً، تخطَّه
            if (isEditable(node)) continue;
            if (testRegex.test(val)) nodesToReplace.push(node);
        }

        if (nodesToReplace.length === 0) {
            // لا توجد نصوص جديدة تحتاج إخفاء
            if (typeof observer !== 'undefined') observer.observe(document.body, { childList: true, subtree: true });
            isRedacting = false;
            return;
        }

        // طبّق التغييرات في frame واحد — بدون flash
        requestAnimationFrame(() => {
            nodesToReplace.forEach(n => {
                if (!n.parentNode) return;
                const span = document.createElement('span');
                span.className = 'omni-redact-span';
                span.innerHTML = n.nodeValue.replace(replaceRegex, `<omni-redact>$1</omni-redact>`);
                n.parentNode.replaceChild(span, n);
            });
            document.body.classList.remove('omni-restoring'); // ← رفع الإخفاء بعد تطبيق البلور
            if (typeof observer !== 'undefined') observer.observe(document.body, { childList: true, subtree: true });
            isRedacting = false;
        });
    }

    const observer = new MutationObserver((mutations) => {
        if (isRedacting) return;
        let shouldRedact = false;
        for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];
            if (m.addedNodes.length > 0) {
                // تجاهل mutations ناتجة عن omni-redact-span لتفادي الحلقة المفرغة
                const anyNew = Array.from(m.addedNodes).some(n =>
                    !n.classList || !n.classList.contains('omni-redact-span')
                );
                if (anyNew) { shouldRedact = true; break; }
            }
        }
        if (shouldRedact) {
            clearTimeout(redactTimeout);
            redactTimeout = setTimeout(applySmartRedaction, 400);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    async function generateTrialSignature(startDate, deviceId) {
        const salt = "WhatsHide_Trial_Secure_Salt_2026!@#";
        const msgBuffer = new TextEncoder().encode(startDate.toString() + deviceId + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function checkTrialStatus() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['trialStartDate', 'trialSignature', 'deviceId', 'isPro', 'activeLicense'], async (res) => {
                if (res.isPro && res.activeLicense) {
                    resolve({ active: false, expired: false, permanent: true });
                    return;
                }
                const devId = res.deviceId;
                const now = Date.now();
                if (!res.trialStartDate || !devId) {
                    resolve({ active: false, expired: true });
                    return;
                }
                const expectedSig = await generateTrialSignature(res.trialStartDate, devId);
                if (res.trialSignature !== expectedSig) {
                    resolve({ active: false, expired: true });
                    return;
                }
                const elapsed = now - res.trialStartDate;
                const duration = 24 * 60 * 60 * 1000;
                if (elapsed >= 0 && elapsed < duration) {
                    resolve({ active: true, timeLeft: duration - elapsed, expired: false });
                } else {
                    resolve({ active: false, expired: true });
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

    async function checkActiveDevice() {
        chrome.storage.local.get(['isPro', 'activeLicense', 'deviceId', 'proSignature', 'zen-mode'], async (res) => {
            if (!res.activeLicense) {
                const trial = await checkTrialStatus();
                if (!trial.active) {
                    isPro = false;
                    chrome.storage.local.set({ isPro: false }, () => {
                        restoreRedactions();
                        ['sidebar-msgs', 'sidebar-names', 'sidebar-imgs', 'chat-msgs', 'chat-names', 'zen-mode'].forEach(s => {
                            applySetting(s, false, null);
                        });
                    });
                } else {
                    isPro = true;
                    chrome.storage.local.set({ isPro: true }, () => {
                        applySmartRedaction();
                        applySetting('zen-mode', res['zen-mode'] || false, null);
                        resetTimer();
                    });
                }
                return;
            }
            
            if (!res.deviceId) return;
            
            const expectedSig = await generateProSignature(res.activeLicense, res.deviceId);
            if (res.proSignature !== expectedSig) {
                isPro = false;
                chrome.storage.local.set({ isPro: false, activeLicense: '', proSignature: '' }, () => {
                    restoreRedactions();
                    ['sidebar-msgs', 'sidebar-names', 'sidebar-imgs', 'chat-msgs', 'chat-names', 'zen-mode'].forEach(s => {
                        applySetting(s, false, null);
                    });
                });
                return;
            }
            
            try {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/license_activations?license_key=eq.${res.activeLicense}&select=active_device_id`, {
                    method: 'GET',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const activeDevice = data[0].active_device_id;
                        if (activeDevice !== res.deviceId) {
                            isPro = false;
                            chrome.storage.local.set({ isPro: false, activeLicense: '', proSignature: '' }, () => {
                                restoreRedactions();
                                ['sidebar-msgs', 'sidebar-names', 'sidebar-imgs', 'chat-msgs', 'chat-names', 'zen-mode'].forEach(s => {
                                    applySetting(s, false, null);
                                });
                            });
                        } else {
                            isPro = true;
                            chrome.storage.local.set({ isPro: true }, () => {
                                applySmartRedaction();
                                applySetting('zen-mode', res['zen-mode'] || false, null);
                                resetTimer();
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("Failed to check active license status", e);
            }
        });
    }

    // === Remote Configuration Engine (Real-Time Updates Without Extension Review) ===
    async function fetchRemoteConfig() {
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/remote_config?select=*`, {
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${SUPABASE_KEY}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0 && data[0].config) {
                    const config = data[0].config;
                    chrome.storage.local.set({ remoteConfig: config });
                    applyRemoteConfig(config);
                }
            }
        } catch(e) {
            // Fallback to local cached config silently
        }
    }

    function applyRemoteConfig(config) {
        if (!config) return;
        if (config.hoverDelay !== undefined) applyHoverDelay(config.hoverDelay);
        if (config.forcePanic) triggerPanic(true);
        if (config.remoteWords && Array.isArray(config.remoteWords)) {
            redactedWords = Array.from(new Set([...redactedWords, ...config.remoteWords]));
            applySmartRedaction();
        }
    }

    chrome.storage.local.get(null, (res) => {
        isPro = res.isPro || false;
        checkActiveDevice();
        fetchRemoteConfig();
        if (res.remoteConfig) applyRemoteConfig(res.remoteConfig);
        if(res.panicShortcut) panicSC = res.panicShortcut;
        if(res.zenShortcut) zenSC = res.zenShortcut;
        if(res.autoLock !== undefined) autoLockMinutes = parseInt(res.autoLock);
        
        if (res.redactWords) {
            if (typeof res.redactWords === 'string') {
                redactedWords = res.redactWords.split(',').map(w=>w.trim()).filter(w=>w);
            } else {
                redactedWords = res.redactWords || [];
            }
        }
        
        redactPhones = res['redact-phones'] || false;
        redactEmails = res['redact-emails'] || false;
        redactLinks = res['redact-links'] || false;
        redactPrices = res['redact-prices'] || false;
        redactCards    = res['redact-cards']    || false;
        redactIban     = res['redact-iban']     || false;
        redactNatid    = res['redact-natid']    || false;
        redactPassport = res['redact-passport'] || false;
        screenshotProtect = res['screenshot-protect'] || false;
        if (screenshotProtect) enableScreenshotProtect();
        
        if (res.hoverDelay !== undefined) applyHoverDelay(res.hoverDelay);
        if (res.panicTarget) panicTarget = res.panicTarget;
        
        ['sidebar-msgs', 'sidebar-names', 'sidebar-imgs', 'chat-msgs', 'chat-names'].forEach(s => {
            applySetting(s, res[s] || false, res[s+'-val'] || (s.includes('imgs')?12:8));
        });
        if(isPro) applySetting('zen-mode', res['zen-mode'], null);
        resetTimer();
        applySmartRedaction();
    });

    chrome.runtime.onMessage.addListener((req) => {
        if (req.action === "update") applySetting(req.setting, req.isActive, req.value);
        else if (req.action === "updateShortcut") { if(req.type === 'panic') panicSC = req.shortcut; else zenSC = req.shortcut; }
        else if (req.action === "updatePro") { 
            isPro = req.isPro; 
            if (!isPro) restoreRedactions(); 
            else applySmartRedaction(); 
        }
        else if (req.action === "updatePremium") { 
            if (req.isPro !== undefined) isPro = req.isPro;
            autoLockMinutes = parseInt(req.autoLock); 
            if (typeof req.words === 'string') {
                redactedWords = req.words.split(',').map(w=>w.trim()).filter(w=>w);
            } else {
                redactedWords = req.words || [];
            }
            redactPhones   = req.phones   || false;
            redactEmails   = req.emails   || false;
            redactLinks    = req.links    || false;
            redactPrices   = req.prices   || false;
            redactCards    = req.cards    || false;
            redactIban     = req.iban     || false;
            redactNatid    = req.natid    || false;
            redactPassport = req.passport || false;
            
            if (req.hoverDelay !== undefined) applyHoverDelay(req.hoverDelay);
            if (req.panicTarget !== undefined) panicTarget = req.panicTarget;
            
            resetTimer(); 
            applySmartRedaction(); 
        }
        else if (req.action === 'updateAdvancedRedact') {
            if (req.key === 'redact-cards')    redactCards = req.value;
            if (req.key === 'redact-iban')     redactIban = req.value;
            if (req.key === 'redact-natid')    redactNatid = req.value;
            if (req.key === 'redact-passport') redactPassport = req.value;
            applySmartRedaction();
        }
        else if (req.action === 'updateScreenshotProtect') {
            screenshotProtect = req.value;
            if (screenshotProtect) enableScreenshotProtect();
        }
        else if (req.action === 'popupState') {
            isPopupOpen = req.isOpen;
            if (isPopupOpen) {
                document.body.classList.remove('screenshot-blur-active');
            }
        }
        else if (req.action === 'triggerPanic') {
            triggerPanic(true); // تفعيل تمويه الطوارئ فوراً (FORCE ON)
        }
    });

    // Capture Phase - يعمل مهما كانت لغة الكيبورد
    window.addEventListener('keydown', function(e) {
        // فحص اختصار الطوارئ
        if (e.ctrlKey === panicSC.ctrlKey && e.altKey === panicSC.altKey && e.shiftKey === panicSC.shiftKey && e.code === panicSC.code) {
            e.preventDefault(); e.stopPropagation(); triggerPanic();
        }
        // فحص اختصار Zen
        else if (isPro && e.ctrlKey === zenSC.ctrlKey && e.altKey === zenSC.altKey && e.shiftKey === zenSC.shiftKey && e.code === zenSC.code) {
            e.preventDefault(); e.stopPropagation(); toggleZen();
        }
    }, true);

    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            if (changes.isPro !== undefined) {
                isPro = changes.isPro.newValue;
                if (!isPro) restoreRedactions();
                else applySmartRedaction();
            }
            if (changes.redactWords !== undefined) {
                const words = changes.redactWords.newValue;
                if (typeof words === 'string') {
                    redactedWords = words.split(',').map(w=>w.trim()).filter(w=>w);
                } else {
                    redactedWords = words || [];
                }
                applySmartRedaction();
            }
            if (changes['redact-phones'] !== undefined) { redactPhones = changes['redact-phones'].newValue; applySmartRedaction(); }
            if (changes['redact-emails'] !== undefined) { redactEmails = changes['redact-emails'].newValue; applySmartRedaction(); }
            if (changes['redact-links'] !== undefined) { redactLinks = changes['redact-links'].newValue; applySmartRedaction(); }
            if (changes['redact-prices'] !== undefined) { redactPrices = changes['redact-prices'].newValue; applySmartRedaction(); }
            if (changes['redact-cards'] !== undefined)    { redactCards    = changes['redact-cards'].newValue;    applySmartRedaction(); }
            if (changes['redact-iban'] !== undefined)     { redactIban     = changes['redact-iban'].newValue;     applySmartRedaction(); }
            if (changes['redact-natid'] !== undefined)    { redactNatid    = changes['redact-natid'].newValue;    applySmartRedaction(); }
            if (changes['redact-passport'] !== undefined) { redactPassport = changes['redact-passport'].newValue; applySmartRedaction(); }
            if (changes['screenshot-protect'] !== undefined) {
                screenshotProtect = changes['screenshot-protect'].newValue;
                if (screenshotProtect) enableScreenshotProtect();
            }
        }
    });
}
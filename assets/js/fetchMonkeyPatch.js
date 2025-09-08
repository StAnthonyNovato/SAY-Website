// Copyright (c) 2025 Damien Boisvert (AlphaGameDeveloper)
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

window.originalFetch = window.fetch;

(() => {
    console.log("[fetchMonkeyPatch] Loaded :3");
})();

var requestInstanceHits = {};

var customEffects = () => {}; // nothing by default

// monkey patch fetch
window.fetch = function (...args) {
    const url = args[0];
    if (typeof url === "string" && url.includes(window.backendBaseURL)) {
        // Modify the URL as needed
        console.log("Custom fetch called for:", url);
        return window.originalFetch(...args).then(response => {
            let serverNode;
            // Gunicorn seems to be lowercasing header names. Big headache
            if (response.headers) {
                console.log(response.headers);
                serverNode = response.headers.get("x-server-node") || response.headers.get("X-Server-Node");
                requestInstanceHits[serverNode] = (requestInstanceHits[serverNode] || 0) + 1;
                console.log(`[fetchMonkeyPatch] Response from server node: ${serverNode}. This node has handled ${requestInstanceHits[serverNode]} requests so far.`);
            } else {
                console.warn("Response headers are null or undefined.");
            }
            customEffects();
            return response;
        }).catch(error => {
            console.error("Fetch error:", error);
            throw error;
        });
    }
    return window.originalFetch(...args);
};

// if /hours or /volunteer-hours
if (window.location.pathname.includes("/hours") || window.location.pathname.includes("/volunteer-hours")) {
    customEffects = () => {
        nameStrippedHostNumbers = {};

        for (const [key, value] of Object.entries(requestInstanceHits)) {
            // FMT: say-backend-1 = 1
            const strippedKey = key.replace(/\D+/g, '');

            nameStrippedHostNumbers[strippedKey] = (nameStrippedHostNumbers[strippedKey] || 0) + value;

            console.log(`Server ${key} (stripped to ${strippedKey}) has handled ${value} requests.`);
            document.querySelectorAll(".reqDist").forEach((el) => {
                el.innerText = Object.entries(nameStrippedHostNumbers).map(([k, v]) => `Node ${k}: ${v}`).join(", ");
            });
        }
        console.log("[fetchMonkeyPatch] Request counts by server type:", nameStrippedHostNumbers);
    }
}
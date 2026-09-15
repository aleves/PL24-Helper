/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-control-regex */
/* eslint-disable no-undef */
// ==UserScript==
// @name         PL24 Helper - Main
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  PL24 Helper - Main
// @author       aleves
// @match        https://www.partslink24.com/portal-ui*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=partslink24.com
// @grant        none
// @run-at       document-start
// ==/UserScript==
(function ()
{
    "use strict";

    const originalFetch = window.fetch.bind(window);

    window.fetch = (...args) =>
    {
        if (!String(args[0]).includes("/manufacturers/"))
        {
            return originalFetch(...args);
        }

        return originalFetch(...args).then(response =>
        {
            response.clone().json().then(data =>
            {
                window.__PL24_MANUFACTURERS = data;
            });

            return response;
        });
    };


    function replaceManufacturerButtons()
    {
        const data = window.__PL24_MANUFACTURERS;

        if (!data?.manufacturers) return;

        const brandMap = new Map(
            data.manufacturers.map(m => [
                m.imgSrc,
                m.link
            ])
        );

        document.querySelectorAll("._manufacturerItemBtn_16hwg_38").forEach(btn =>
        {
            if (btn.tagName !== "BUTTON" || btn.dataset.pl24Converted) return;

            const img = btn.querySelector("img[src*=\"/carbrands/\"]");
            if (!img) return;

            const linkUrl = brandMap.get(new URL(img.src).pathname);
            if (!linkUrl) return;

            const link = Object.assign(document.createElement("a"), {
                href: linkUrl,
                className: btn.className,
                title: btn.title
            });
            link.dataset.pl24Converted = "true";

            while (btn.firstChild)
            {
                link.appendChild(btn.firstChild);
            }

            btn.replaceWith(link);
        });
    }

    new MutationObserver(replaceManufacturerButtons).observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();
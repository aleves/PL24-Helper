/* eslint-disable no-control-regex */
/* eslint-disable no-undef */
// ==UserScript==
// @name         PL24 Helper - Smart
// @namespace    http://tampermonkey.net/
// @version      2.26
// @description  PL24 Helper - Smart
// @author       aleves
// @match        https://www.partslink24.com/pl24-app*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=partslink24.com
// @grant        none
// ==/UserScript==
(function()
{
    "use strict";

    if (!window.location.href.includes("smart_parts"))
    {
        return;
    }

    var debug = false;
    if (debug)
    {
        enable_logging();
    }

    // Logotyp för att indikera att skriptet är igång

    let inserted = false;

    const createLogo = () =>
    {
        const logo = document.createElement("div");
        logo.textContent = "PL24 Helper - Smart";
        logo.title = `v${GM_info.script.version}`;
        logo.style.cssText = `
            display: block;
            font: bold 14px Arial, sans-serif;
            color: #fff;
            text-shadow: -1px 1px .25px rgba(0, 0, 0, 0.67), -1px 0 .25px rgba(0, 0, 0, 0.67);
            background: linear-gradient(to top right, #009f70, #bbcf00);
            padding: 5px 10px;
            border-radius: 8px;
            margin-right: 16px;
            z-index: 666;
            cursor: default;
            `;
        return logo;
    };

    const insertLogo = () =>
    {
        if (inserted) return true;

        const container = document.querySelector("[class*=_menuContainer]");
        if (!container) return false;

        container.prepend(createLogo());
        inserted = true;
        return true;
    };

    if (!insertLogo())
    {
        const mo = new MutationObserver(() =>
        {
            if (insertLogo()) mo.disconnect();
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    // Gömmer gråa rader

    if (document.querySelector("#root"))
    {
        const toggleUnavailableRows = (isChecked) =>
        {
            document.querySelectorAll("[class*=_table] [data-test-id*=row][class*=_inactive]")
                .forEach(element => element.style.display = isChecked ? "none" : "");

            document.querySelectorAll("[class*=_tiles] [class*=_inactive]")
                .forEach(element => element.closest("[class*=_container]").style.display = isChecked ? "none" : "");
        };

        const saveCheckboxState = (isChecked) =>
        {
            localStorage.setItem(`${window.location.origin}/clean_unavailable_rows_state`, isChecked);
        };

        const getCachedCheckboxState = () =>
        {
            return localStorage.getItem(`${window.location.origin}/clean_unavailable_rows_state`) === "true";
        };

        const createCleanButton = () =>
        {
            const cleanButton = document.createElement("input");
            cleanButton.type = "checkbox";
            cleanButton.id = "clean_unavailable_rows";
            cleanButton.checked = getCachedCheckboxState();

            const cleanButtonLabel = document.createElement("label");
            cleanButtonLabel.htmlFor = cleanButton.id;
            cleanButtonLabel.textContent = "Göm gråa rader";
            Object.assign(cleanButtonLabel.style, {
                fontFamily: "Arial, sans-serif", fontSize: "12px",
                fontWeight: "bold", color: "#ffffff", textShadow: "-1px 1px .125px rgba(0, 0, 0, 0.67)",
                background: "linear-gradient(to bottom left, #009f70, #bbcf00)", padding: "4px 8px",
                borderRadius: "6px", cursor: "pointer", userSelect: "none"
            });

            Object.assign(cleanButton.style, {
                width: "16px", height: "16px", verticalAlign: "middle",
                marginRight: "8px", cursor: "pointer"
            });

            const wrapperDiv = document.createElement("div");
            Object.assign(wrapperDiv.style, {
                alignItems: "center",
                border: "1px solid #ccc",
                borderRadius: "8px",
                padding: "4px 8px",
                marginRight: "16px"
            });

            wrapperDiv.appendChild(cleanButton);
            wrapperDiv.appendChild(cleanButtonLabel);

            cleanButton.addEventListener("change", () =>
            {
                const isChecked = cleanButton.checked;
                toggleUnavailableRows(isChecked);
                saveCheckboxState(isChecked);
                if (isChecked) observeUnavailableRows();
            });

            return { cleanButton, wrapperDiv };
        };

        const observeUnavailableRows = () =>
        {
            const intervalId = setInterval(() =>
            {
                if (cleanButton.checked) toggleUnavailableRows(true);
                else clearInterval(intervalId);
            }, 100);
        };

        const { cleanButton, wrapperDiv } = createCleanButton();

        const insertButton = () =>
        {
            const headerContainer = document.querySelector("[class*=_menuContainer]");
            if (headerContainer)
            {
                headerContainer.prepend(wrapperDiv);
                return true;
            }
            return false;
        };

        if (!insertButton())
        {
            const mo = new MutationObserver(() =>
            {
                if (insertButton()) mo.disconnect();
            });
            mo.observe(document.body, { childList: true, subtree: true });
        }

        const tableObserver = new MutationObserver(() =>
        {
            if (cleanButton.checked) toggleUnavailableRows(true);
        });

        const tableNode = document.querySelector("[data-test-id=subGroupsIllusTable]");
        if (tableNode) tableObserver.observe(tableNode, { childList: true, subtree: true });

        if (cleanButton.checked)
        {
            toggleUnavailableRows(true);
            observeUnavailableRows();
        }
    }

    // Tar bort mellanslag inuti sökrutan

    (function ()
    {
        "use strict";

        const searchInput = "#\\:r3\\:";

        const removeWhitespaceIfMostlyNumbers = (value) =>
        {
            const noWhitespace = value.replace(/\s/g, "");
            const digits = noWhitespace.match(/\d/g) || [];
            const letters = noWhitespace.match(/[a-zA-Z]/g) || [];

            if (digits.length > letters.length / 2)
            {
                return noWhitespace;
            }
            return value;
        };

        function sanitizeReactInput(input)
        {
            const cleaned = removeWhitespaceIfMostlyNumbers(input.value);
            if (cleaned === input.value) return;

            const setter = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                "value"
            ).set;

            setter.call(input, cleaned);
            input.dispatchEvent(new Event("input", { bubbles: true }));
        }

        document.addEventListener(
            "keydown",
            function (event)
            {
                if (event.key !== "Enter") return;

                const input = document.querySelector(searchInput);
                if (event.target !== input) return;

                sanitizeReactInput(input);
            },
            true
        );

        document.addEventListener(
            "click",
            function (event)
            {
                const button = event.target.closest("[data-test-id=\"sendPartSearch\"]");
                if (!button) return;

                const input = document.querySelector(searchInput);
                if (input)
                {
                    sanitizeReactInput(input);
                }
            },
            true
        );
    })();

    // Om ett cirkapris saknas skapas en knapp för att söka direkt på Bildelsbasen (öppnas i ny flik)

    if (document.querySelector("#root"))
    {
        const targetNode = document.querySelector("#root");

        const runCode = () =>
        {
            /*
            const existingNewPrices = document.querySelectorAll("[id*=\"_c\"] [class*=\"_price\"] span.new-price");
            if (existingNewPrices.length > 0) return;
            */

            const priceTds = [...document.querySelectorAll("[class*=_segmentContainer] [data-test-id*=priceValue] [class*=_value]")]
                .filter(e => !e.closest("[class*=_showPrintOnly]"));
            priceTds.forEach((td) =>
            {
                const priceText = td.innerText.trim()
                    .replace(/\s/g, "");
                const price = parseFloat(priceText);
                if (!isNaN(price))
                {
                    const newPrice = price / 2;
                    const span = document.createElement("span");
                    span.innerText = `\n / ${newPrice.toLocaleString("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    span.style.fontSize = "11.75px";
                    span.classList.add("new-price");
                    td.appendChild(span);
                }
                else
                {
                    const partNumber = td.closest("[data-test-id*=row]")
                        .querySelector("[data-test-id*=partnoValue] [class*=_value]")
                        .innerText.trim().replace("* ", "").replace(/\s/g, "");

                    if (!td.innerText.trim() || td.dataset.hasOverlay) return;
                    td.dataset.hasOverlay = "true";
                    td.style.position = "relative";
                    td.style.color = "transparent";
                    td.style.userSelect = "none";

                    const host = document.createElement("div");
                    Object.assign(host.style, {
                        position: "absolute",
                        top: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        overflow: "hidden",
                        pointerEvents: "none"
                    });

                    const shadow = host.attachShadow({ mode: "open" });
                    const btn = document.createElement("button");
                    btn.innerText = td.innerText;
                    btn.title = "Sök på Bildelsbasen (Ny flik)";
                    Object.assign(btn.style, {
                        pointerEvents: "auto",
                        padding: "4px 10px 3px 10px",
                        border: "1px solid white",
                        borderRadius: "4px",
                        backgroundColor: "#e0e7ff",
                        width: "100%",
                        cursor: "pointer"
                    });

                    btn.addEventListener("click", e =>
                    {
                        const searchUrl = `https://www.bildelsbasen.se/se-sv/OEM/${partNumber}/`;
                        window.open(searchUrl, "_blank");
                        e.preventDefault();
                        e.stopPropagation();
                    });

                    shadow.appendChild(btn);
                    td.appendChild(host);
                }
            });
        };

        let spinnerVisible = false;

        const observeLoadAnimation = () =>
        {
            const spinner = document.querySelector("[class*=_main] [class*=_loading] [class*=spinner-wrapper]");
            if (spinner)
            {
                spinnerVisible = true;
            }
            else if (spinnerVisible)
            {
                spinnerVisible = false;
                runCode();
            }
        };

        observeLoadAnimation();
        new MutationObserver(observeLoadAnimation).observe(targetNode, { childList: true, subtree: true });
    }

    // Gör om PC-nummer i rutorna som öppnas till knappar som kopierar numret åt användaren

    if (document.querySelector("#root"))
    {
        const targetNode = document.querySelector("#root");

        const createNotification = (text, x, y) =>
        {
            const notification = document.createElement("div");
            notification.innerText = text;
            Object.assign(notification.style, {
                position: "absolute",
                top: `${y - 40}px`,
                left: `${x - 10}px`,
                backgroundColor: "rgba(255,255,255,0.95)",
                border: "1px solid #ccc",
                borderRadius: "5px",
                padding: "10px",
                fontWeight: "bold",
                color: "#333",
                boxShadow: "0px 4px 16px rgba(0,0,0,0.3)",
                zIndex: 9999,
                transition: "opacity 0.4s ease-out"
            });
            document.body.appendChild(notification);
            setTimeout(() =>
            {
                notification.style.opacity = 0;
                setTimeout(() => document.body.removeChild(notification), 200);
            }, 500);
        };

        const runCode = () =>
        {
            const partnoTds = [...document.querySelectorAll("[class*=_segmentContainer] [data-test-id*=partnoValue] [class*=_value]")]
                .filter(e => !e.closest("[class*=_showPrintOnly]"));

            partnoTds.forEach(td =>
            {
                if (!td.innerText.trim() || td.dataset.hasOverlay) return;
                td.dataset.hasOverlay = "true";
                td.style.position = "relative";
                td.style.color = "transparent";
                td.style.userSelect = "none";

                const host = document.createElement("div");
                Object.assign(host.style, {
                    position: "absolute",
                    top: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    pointerEvents: "none"
                });

                const shadow = host.attachShadow({ mode: "open" });
                const btn = document.createElement("button");
                btn.textContent = td.innerText.trim();
                Object.assign(btn.style, {
                    pointerEvents: "auto",
                    padding: "4px 10px 3px 10px",
                    border: "1px solid white",
                    borderRadius: "4px",
                    backgroundColor: "#e0e7ff",
                    fontWeight: "bold",
                    width: "100%",
                    cursor: "pointer"
                });

                btn.addEventListener("click", e =>
                {
                    navigator.clipboard.writeText(td.innerText.trim().replace("* ", "").replace(/\s+/g, " "));
                    createNotification("Kopierad!", e.pageX, e.pageY);
                    e.preventDefault();
                    e.stopPropagation();
                });

                shadow.appendChild(btn);
                td.appendChild(host);
            });
        };

        let spinnerVisible = false;

        const observeLoadAnimation = () =>
        {
            const spinner = document.querySelector("[class*=_main] [class*=_loading] [class*=spinner-wrapper]");
            if (spinner)
            {
                spinnerVisible = true;
            }
            else if (spinnerVisible)
            {
                spinnerVisible = false;
                runCode();
            }
        };

        observeLoadAnimation();
        new MutationObserver(observeLoadAnimation).observe(targetNode, { childList: true, subtree: true });
    }

    // Ändrar färgen på 'Nummerändring' för att göra det tydligare

    if (document.querySelector("#root"))
    {
        const targetNode = document.querySelector("#root");

        const colorHeaders = () =>
        {
            const muiAccHeaderTitles = [...document.querySelectorAll("[class*=MuiAccordionSummary-content]")]
                .filter(e => !e.closest("[class*=_showPrintOnly]"));

            for (const title of muiAccHeaderTitles)
            {
                const muiAccHeader = title.closest("[class*=MuiAccordionSummary-root]");
                if (title.textContent.trim() === "Nummerändring")
                {
                    if (muiAccHeader) muiAccHeader.style.backgroundImage = "linear-gradient(to right, #ff6a2b, #f7c400)";
                }
                if (title.textContent.trim() === "Bytesartikel")
                {
                    if (muiAccHeader) muiAccHeader.style.backgroundImage = "linear-gradient(to right, #78d7ff, #456cff)";
                }
            }
        };

        let spinnerVisible = false;

        const observeLoadAnimation = () =>
        {
            const spinner = document.querySelector("[class*=_main] [class*=_loading] [class*=spinner-wrapper]");
            if (spinner)
            {
                spinnerVisible = true;
            }
            else if (spinnerVisible)
            {
                spinnerVisible = false;
                colorHeaders();
            }
        };

        observeLoadAnimation();
        new MutationObserver(observeLoadAnimation).observe(targetNode, { childList: true, subtree: true });
    }

    // Ändrar färgen på avdelare för att göra det tydligare

    if (document.querySelector("#root"))
    {
        const targetNode = document.querySelector("#root");

        const colorEmptyRows = () =>
        {
            const emptyRows = document.querySelectorAll("[class*=_emptyRow]")

            for (const er of emptyRows)
            {
                er.style.background = "#f7c40057"
            }
        };

        let spinnerVisible = false;

        const observeLoadAnimation = () =>
        {
            const spinner = document.querySelector("[class*=_main] [class*=spinner-wrapper]");
            if (spinner)
            {
                spinnerVisible = true;
            }
            else if (spinnerVisible)
            {
                spinnerVisible = false;
                colorEmptyRows();
            }
        };

        observeLoadAnimation();
        new MutationObserver(observeLoadAnimation).observe(targetNode, { childList: true, subtree: true });
    }

/*
    // skapar en knapp som leder till PartSouq om det skulle saknas produktlistor

    if (document.querySelector("#root"))
    {
        const targetNode = document.querySelector("#root");

        const runCode = () =>
        {
            setTimeout(function()
            {
                if (document.querySelector("[class*=inline_error]"))
                {
                    const listError = document.querySelector("[class*=inline_error]");
                    const vinNum = document.querySelector("[class*=p5_vehicle_info_vin]").innerText.trim();
                    const button = document.createElement("button");
                    button.innerText = "Sök chassinummer/VIN på PartSouq (Ny flik)";
                    button.addEventListener("click", (event) =>
                    {
                        const searchUrl = `https://partsouq.com/en/search/all?q=${vinNum}`;
                        window.open(searchUrl, "_blank");
                        event.preventDefault();
                        event.stopPropagation();
                    });
                    const buttonStyle = {
                        padding: "4px 10px 2px 10px",
                        border: "1px solid white",
                        borderRadius: "4px",
                        backgroundColor: "#e0e7ff",
                        color: "black",
                        verticalAlign: "top",
                        cursor: "pointer",
                        margin: "0 auto 0 auto",
                        borderBottom: "1px solid #e0e0e0",
                        display: "inline",
                        boxSizing: "border-box",
                        textAlign: "center"
                    };
                    Object.assign(button.style, buttonStyle);
                    listError.parentElement.insertBefore(button, listError.nextSibling);
                }
            }, 250);
        }

        var found = false;
        const observeError = () =>
        {
            const listError = document.querySelector("[class*=inline_error]");
            if (!listError)
            {
                found = false;
                return;
            }
            if (!found)
            {
                found = true;
                runCode();
            }
        };

        observeError();
        const observer = new MutationObserver(() =>
        {
            observeError();
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    }
*/
})();
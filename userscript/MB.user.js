/* eslint-disable no-control-regex */
/* eslint-disable no-undef */
// ==UserScript==
// @name         PL24 Helper - MB
// @namespace    http://tampermonkey.net/
// @version      2.23
// @description  PL24 Helper - MB
// @author       aleves
// @match        https://www.partslink24.com/p5/*/p5.html*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=partslink24.com
// @grant        none
// ==/UserScript==
(function()
{
    "use strict";

    if (
        (
            !window.location.hash.includes("p5daimler~mercedes_parts") &&
            !window.location.hash.includes("p5daimler~mercedestrucks_parts") &&
            !window.location.hash.includes("p5daimler~mercedesunimog_parts") &&
            !window.location.hash.includes("p5daimler~mercedesvans_parts")
        )
    )
    {
        return;
    }

    var debug = true;
    if (debug)
    {
        enable_logging();
    }

    // Logotyp för att indikera att skriptet är igång

    const logoDiv = Object.assign(document.createElement("div"), {
        textContent: "PL24 Helper - MB",
        title: `v${GM_info.script.version}`,
        style: `
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
        `
    });

    const insertLogo = () =>
    {
        const headerContainer = document.querySelector("#header_icon_container");
        const headerContainerDiv = headerContainer?.querySelector("div");
        if (headerContainer && headerContainerDiv)
        {
            headerContainer.insertBefore(logoDiv, headerContainerDiv);
            return true;
        }
        return false;
    };

    if (!insertLogo())
    {
        new MutationObserver((observer) =>
        {
            if (insertLogo()) observer.disconnect();
        }).observe(document.body, { childList: true, subtree: true });
    }

    // Gömmer gråa rader

    if (document.querySelector("#content"))
    {
        const toggleUnavailableRows = (isChecked) =>
        {
            document.querySelectorAll("[class=p5_table_data] [class*='p5_table_rec datarow unavailable']")
                .forEach(element => element.style.display = isChecked ? "none" : "");

            document.querySelectorAll("[class=grana_illustration_pages_content] [class*='grana-illustration-page-tile unavailable']")
                .forEach(element => element.style.display = isChecked ? "none" : "");

            document.querySelectorAll("[class=grana_illustration_pages_content] [class*='p5_table_rec datarow link p5_border_bottom  unavailable']")
                .forEach(element => element.style.display = isChecked ? "none" : "");
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
                display: "inline-block", fontFamily: "Arial, sans-serif", fontSize: "12px",
                fontWeight: "bold", color: "#ffffff", textShadow: "-1px 1px .125px rgba(0, 0, 0, 0.67)",
                background: "linear-gradient(to bottom left, #009f70, #bbcf00)", padding: "4px 8px",
                borderRadius: "6px", marginRight: "16px", cursor: "pointer", userSelect: "none"
            });

            Object.assign(cleanButton.style, {
                width: "16px", height: "16px", verticalAlign: "middle",
                marginRight: "8px", cursor: "pointer"
            });

            cleanButton.addEventListener("change", () =>
            {
                const isChecked = cleanButton.checked;
                toggleUnavailableRows(isChecked);
                saveCheckboxState(isChecked);
                if (isChecked) observeUnavailableRows();
            });

            return { cleanButton, cleanButtonLabel };
        };

        const observeUnavailableRows = () =>
        {
            const intervalId = setInterval(() =>
            {
                if (cleanButton.checked) toggleUnavailableRows(true);
                else clearInterval(intervalId);
            }, 100);
        };

        const { cleanButton, cleanButtonLabel } = createCleanButton();

        const insertButton = () =>
        {
            const headerContainer = document.querySelector("#header_icon_container");
            const headerContainerDiv = headerContainer?.querySelector("div");
            if (headerContainer && headerContainerDiv)
            {
                headerContainer.insertBefore(cleanButtonLabel, headerContainer.firstChild);
                headerContainer.insertBefore(cleanButton, cleanButtonLabel);
                return true;
            }
            return false;
        }

        if (!insertButton())
        {
            new MutationObserver((observer) =>
            {
                if (insertButton()) observer.disconnect();
            }).observe(document.body, { childList: true, subtree: true });
        }

        const tableObserver = new MutationObserver(() =>
        {
            if (cleanButton.checked) toggleUnavailableRows(true);
        });

        const tableNode = document.querySelector(".p5_table_data");
        if (tableNode) tableObserver.observe(tableNode, { childList: true, subtree: true });

        if (cleanButton.checked)
        {
            toggleUnavailableRows(true);
            observeUnavailableRows();
        }
    }

    // Tar bort mellanslag inuti sökrutan

    if (document.querySelector("#search_query"))
    {
        const searchInput = document.querySelector("#search_query");
        const searchIcon = document.querySelector("#search_icon");
        const removeWhitespace = (value) =>
            value.replace(/\s/g, "");

        searchInput.addEventListener("keydown", (event) =>
        {
            if (event.key === "Enter")
            {
                event.preventDefault();
                searchInput.value = removeWhitespace(searchInput.value);
            }
        });

        searchIcon.addEventListener("mousedown", (event) =>
        {
            event.preventDefault();
            searchInput.value = removeWhitespace(searchInput.value);
        });
    }

    // Om ett cirkapris saknas skapas en knapp för att söka direkt på Bildelsbasen (öppnas i ny flik)

    if (document.querySelector("#content"))
    {
        const targetNode = document.querySelector("#content");
        const runCode = () =>
        {
            const existingNewPrices = document.querySelectorAll("[id*=\"_c\"] [class*=\"_price\"] span.new-price");
            if (existingNewPrices.length > 0) return;

            const priceTds = [...document.querySelectorAll("[class=p5_table_data_acc] div[class*=p5t][class*=price] span.p5_cell_content")]
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
                    const partNumber = td.closest("[id*=\"_c\"]")
                        .querySelector("[class*=\"_partno\"]")
                        .innerText.trim().replace("* ", "").replace(/\s/g, "");
                    const button = document.createElement("button");
                    button.innerText = td.innerText;
                    button.title = "Sök på Bildelsbasen (Ny flik)";
                    button.addEventListener("click", (event) =>
                    {
                        const searchUrl = `https://www.bildelsbasen.se/se-sv/OEM/${partNumber}/`;
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
                        display: "block",
                        width: "100%",
                        boxSizing: "border-box",
                        textAlign: "center"
                    };
                    Object.assign(button.style, buttonStyle);
                    td.innerText = "";
                    td.appendChild(button);
                }
            });
        };

        const observeLoadAnimation = () =>
        {
            const loadAnimation = document.querySelector("div.p5_load_animation");
            if (!loadAnimation) return;
            const intervalId = setInterval(() =>
            {
                if (document.querySelector("[id*='_c0']:not([id*=vinfoBasic]):not([id*=prNr]):not([id*=searchresult]):not([id*=vinfoEquipment]):not([id*=vinfoVDP]):not([id*=vinfoSaa])>*") && (clearInterval(intervalId), runCode(), true)) return;
            }, 100);
        };

        observeLoadAnimation();
        const observer = new MutationObserver(() =>
        {
            observeLoadAnimation();
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    }

    // Gör om PC-nummer i rutorna som öppnas till knappar som kopierar numret åt användaren

    if (document.querySelector("#content"))
    {
        const targetNode = document.querySelector("#content");
        const runCode = () =>
        {
            const partnoTds = [...document.querySelectorAll("[class*=acc][class*=p5t][class*=partno]")]
                .flatMap(div => (div.className.endsWith("_acc") || div.getAttribute("title") === "Artikelnummer") ? [] : [div])
                .sort((a, b) => a.className > b.className ? 1 : -1);
            partnoTds.forEach(td =>
            {
                if (td.innerText.trim() === "")
                {
                    return;
                }

                const btn = document.createElement("button");
                btn.innerText = td.innerText;
                btn.title = "Kopiera nummer";
                btn.addEventListener("click", event =>
                {
                    navigator.clipboard.writeText(td.innerText.trim().replace("* ", "").replace(/\s+/g, " "));
                    const notification = document.createElement("div");
                    notification.innerText = "Kopierad!";
                    Object.assign(notification.style,
                        {
                            position: "absolute",
                            top: `${event.pageY - 40}px`,
                            left: `${event.pageX - 10}px`,
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #cccccc",
                            borderRadius: "5px",
                            padding: "10px",
                            fontWeight: "bold",
                            color: "#333333",
                            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.3)",
                            zIndex: "9999",
                            transition: "opacity 0.4s ease-out"
                        });
                    document.body.appendChild(notification);
                    setTimeout(() =>
                    {
                        notification.style.opacity = 0;
                        setTimeout(() =>
                        {
                            document.body.removeChild(notification);
                        }, 200);
                    }, 500);
                    event.preventDefault();
                    event.stopPropagation();
                });
                Object.assign(btn.style,
                    {
                        padding: "4px 10px 2px 10px",
                        border: "1px solid white",
                        borderRadius: "4px",
                        backgroundColor: "#e0e7ff",
                        color: "black",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                        verticalAlign: "top",
                        cursor: "pointer",
                        margin: "0 auto 0 auto",
                        borderBottom: "1px solid #e0e0e0",
                        display: "block",
                        width: "100%",
                        boxSizing: "border-box",
                        textAlign: "center"
                    });
                td.innerText = "";
                td.appendChild(btn);
            });
        };

        const observeLoadAnimation = () =>
        {
            const loadAnimation = document.querySelector("div.p5_load_animation");
            if (!loadAnimation) return;
            const intervalId = setInterval(() =>
            {
                if (document.querySelector("[id*='_c0']:not([id*=vinfoBasic]):not([id*=prNr]):not([id*=searchresult]):not([id*=vinfoEquipment]):not([id*=vinfoVDP]):not([id*=vinfoSaa])>*") && (clearInterval(intervalId), runCode(), true)) return;
            }, 100);
        };

        observeLoadAnimation();
        const observer = new MutationObserver(() =>
        {
            observeLoadAnimation();
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    }

    // Ändrar färgen på 'Nummerändring' så att risken att man missar det är lägre

    if (document.querySelector("#content"))
    {
        const targetNode = document.querySelector("#content");
        const observeLoadAnimation = () =>
        {
            const loadAnimation = document.querySelector("div.p5_load_animation");
            if (!loadAnimation) return;
            const p5AccHeaderTitles = document.querySelectorAll("#content [class*=\"p5_accordion_header\"]");
            for (const title of p5AccHeaderTitles)
            {
                if (title.textContent.trim() === "Nummerändring")
                {
                    const p5AccHeader = title.closest("[class*=\"p5_accordion\"]");
                    if (p5AccHeader) p5AccHeader.style.backgroundImage = "linear-gradient(to right, #ff6a2b, #f7c400)";
                }
                if (title.textContent.trim() === "Bytesartikel")
                {
                    const p5AccHeader = title.closest("[class*=\"p5_accordion\"]");
                    if (p5AccHeader) p5AccHeader.style.backgroundImage = "linear-gradient(to right, #78d7ff, #456cff)";
                }
            }
        };

        observeLoadAnimation();
        const observer = new MutationObserver(() =>
        {
            observeLoadAnimation();
        });
        observer.observe(targetNode, { childList: true, subtree: true });
    }

    // skapar en knapp som leder till PartSouq om det skulle saknas produktlistor

    if (document.querySelector("#content"))
    {
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

        const targetNode = document.querySelector("#content");
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
})();
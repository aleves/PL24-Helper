/* eslint-disable no-control-regex */
/* eslint-disable no-undef */
// ==UserScript==
// @name         PL24 Helper - Volkswagen
// @namespace    Violentmonkey Scripts
// @version      2.09
// @description  PL24 Helper - Volkswagen
// @author       aleves
// @match        https://www.partslink24.com/p5/*/p5.html#%2Fp5vwag~vw_parts*
// @include      https://www.partslink24.com/p5/*/p5.html#%2Fp5vwag~vwclassic_parts*
// @include      https://www.partslink24.com/p5/*/p5.html#%2Fp5vwag~vn_parts*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=partslink24.com
// @grant        none
// ==/UserScript==
(function()
{
    "use strict";

    var debug = false;
    if (debug)
    {
        enable_logging();
    }

    // Logotyp för att indikera att skriptet är igång

    const logoDiv = document.createElement("div");
    logoDiv.textContent = "PL24 Helper - Volkswagen";
    Object.assign(logoDiv.style, {
        display: "inline-block",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#ffffff",
        ["text-shadow"]: "-1px 1px .25px rgba(0, 0, 0, 0.67), -1px 0 .25px rgba(0, 0, 0, 0.67)",
        background: "linear-gradient(to top right, #009f70, #bbcf00)",
        padding: "5px 10px",
        borderRadius: "8px",
        position: "relative",
        right: "1rem",
        zIndex: "666"
    });

    const observer = new MutationObserver((mutations) =>
    {
        for (const mutation of mutations)
        {
            if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].matches("#dealer_header_container > div"))
            {
                const headerContainer = document.querySelector("#dealer_header_container");
                const headerContainerDiv = document.querySelector("#dealer_header_container > div");
                headerContainer.insertBefore(logoDiv, headerContainerDiv);
                observer.disconnect();
            }
        }
    });

    observer.observe(document.querySelector("#dealer_header_container"), { childList: true });

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
                        .innerText.trim().replace("* ", "").replace(/\s+/g, " ");
                    const button = document.createElement("button");
                    button.innerText = td.innerText;
                    button.title = "Sök på Bildelsbasen (Ny flik)";
                    button.addEventListener("click", (event) =>
                    {
                        const searchUrl = `https://www.bildelsbasen.se/se-sv/OEM/${partNumber}/?page=1&order=price&asc=1`;
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
            const observer = new MutationObserver((mutations) =>
            {
                for (const { type, addedNodes } of mutations)
                {
                    if (type === "childList" && addedNodes.length)
                    {
                        const intervalId = setInterval(() =>
                        {
                            if (document.querySelector("[id*='_c0']:not([id*=vinfoBasic]):not([id*=prNr]):not([id*=searchresult]):not([id*=vinfoEquipment]):not([id*=vinfoVDP])>*") && (clearInterval(intervalId), runCode(), true)) return;
                        }, 50);
                    }
                }
            });
            observer.observe(loadAnimation, { childList: true });
        };

        observeLoadAnimation();
        targetNode.addEventListener("DOMNodeInserted", observeLoadAnimation);
    }

    // Gör om PC-nummer i rutorna som öppnas till knappar som kopierar numret åt användaren

    if (document.querySelector("#content"))
    {
        const targetNode = document.querySelector("#content");
        const runCode = () =>
        {
            const partnoTds = [...document.querySelectorAll("[class*=acc][class*=p5t][class*=partno]")]
                .flatMap(div => div.className.endsWith("_acc") ? [] : [div])
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
            const observer = new MutationObserver((mutations) =>
            {
                for (const { type, addedNodes } of mutations)
                {
                    if (type === "childList" && addedNodes.length)
                    {
                        const intervalId = setInterval(() =>
                        {
                            if (document.querySelector("[id*='_c0']:not([id*=vinfoBasic]):not([id*=prNr]):not([id*=searchresult]):not([id*=vinfoEquipment]):not([id*=vinfoVDP])>*") && (clearInterval(intervalId), runCode(), true)) return;
                        }, 50);
                    }
                }
            });
            observer.observe(loadAnimation, { childList: true });
        };

        observeLoadAnimation();
        targetNode.addEventListener("DOMNodeInserted", observeLoadAnimation);
    }

    // Ändrar färgen på 'Nummerändring' så att risken att man missar det är lägre

    if (document.querySelector("#content"))
    {
        const targetNode = document.querySelector("#content");
        const observeLoadAnimation = () =>
        {
            const loadAnimation = document.querySelector("div.p5_load_animation");
            if (!loadAnimation) return;
            const observer = new MutationObserver((mutations) =>
            {
                for (const { type, addedNodes } of mutations)
                {
                    if (type === "childList" && addedNodes.length)
                    {
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
                                if (p5AccHeader) p5AccHeader.style.backgroundImage = "linear-gradient(to right, #ffa078, #ffd845)";
                            }
                        }
                    }
                }
            });
            observer.observe(loadAnimation, { childList: true });
        };
        observeLoadAnimation();
        targetNode.addEventListener("DOMNodeInserted", observeLoadAnimation);
    }
})();
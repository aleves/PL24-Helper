/* eslint-disable no-control-regex */
/* eslint-disable no-undef */
// ==UserScript==
// @name         PL24 Helper - Peugeot
// @namespace    Violentmonkey Scripts
// @version      1.03
// @description  PL24 Helper - Peugeot
// @author       aleves
// @match        https://www.partslink24.com/psa/peugeot_parts/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=partslink24.com
// @grant        none
// ==/UserScript==
(function()
{
    "use strict";

    // Logotyp för att indikera att skriptet är igång

    const logoDiv = document.createElement("div");
    logoDiv.textContent = "PL24 Helper - Peugeot";
    logoDiv.title = `v${GM_info.script.version}`
    Object.assign(logoDiv.style,
        {
            display: "inline-block",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            fontWeight: "bold",
            color: "#ffffff",
            background: "linear-gradient(to top right, #008080, #66b2b2)",
            padding: "5px 10px",
            borderRadius: "8px",
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: "666",
            cursor: "default"
        });
    document.querySelector("#linksAndBreadCrumbs")
        .appendChild(logoDiv);

    // Scrollhjulet kan zooma illustrationen in och ut

    const debounce =
        (func, wait = 10) =>
            (...args) =>
                setTimeout(() => func(...args), wait);

    const zoomPlusButton = document.querySelector("#zoom-plus");
    const zoomMinusButton = document.querySelector("#zoom-minus");
    //const glassPane = document.querySelector("#GlassPane");

    const handleScrollInsideGlassPane = debounce((event) =>
    {
        const isZoomInDisabled =
            zoomPlusButton.classList.contains("toolbarBtnDisabled");
        const isZoomOutDisabled =
            zoomMinusButton.classList.contains("toolbarBtnDisabled");

        if (
            event.target.closest("#GlassPane") &&
            event.deltaY < 0 &&
            !isZoomInDisabled
        )
        {
            ImageView.sendMessage("ZoomIn", null);
        }

        if (
            event.target.closest("#GlassPane") &&
            event.deltaY > 0 &&
            !isZoomOutDisabled
        )
        {
            ImageView.sendMessage("ZoomOut", null);
        }
    });

    window.addEventListener("wheel", handleScrollInsideGlassPane);

    // Om ett cirkapris saknas skapas en knapp för att söka direkt på Bildelsbasen (öppnas i ny flik)

    if (document.querySelector("#partin4dlg"))
    {
        const targetNode = document.querySelector("#partin4dlg");
        const runCode = () =>
        {
            const existingNewPrices = document.querySelectorAll("#partin4content td.partinfoPriceCol span.new-price");
            if (existingNewPrices.length > 0) return;

            const priceTds = document.querySelectorAll("#partin4content td.partinfoPriceCol:not(.partin4partspromCol)");
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
                    span.style.fontSize = "9.25px";
                    span.classList.add("new-price");
                    td.appendChild(span);
                }
                else
                {
                    const partNumber = td.closest("tr")
                        .querySelector(".partinfoPartnoCol")
                        .innerText.trim();
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
        const observer = new MutationObserver((mutationsList) =>
        {
            mutationsList.forEach((mutation) =>
            {
                if (mutation.type === "childList" && document.querySelector("#partin4dlg > div.blockUI.blockOverlay"))
                {
                    const intervalId = setInterval(() =>
                    {
                        const partinfoTable = document.querySelector("#partin4MainTable tbody");
                        if (partinfoTable && partinfoTable.childElementCount > 0)
                        {
                            clearInterval(intervalId);
                            runCode();
                        }
                    }, 75);
                }
            });
        });
        observer.observe(targetNode,
            {
                childList: true
            });
    }

    // Gör om PC-nummer i rutorna som öppnas till knappar som kopierar numret åt användaren

    if (document.querySelector("#partin4dlg"))
    {
        const targetNode = document.querySelector("#partin4dlg");
        const runCode = () =>
        {
            const partnoTds = document.querySelectorAll("#partin4content td.partinfoPartnoCol");
            partnoTds.forEach(td =>
            {
                if (td.innerText.trim() === "")
                {
                    return;
                }

                const btn = document.createElement("button");
                btn.innerText = td.innerText;
                btn.title = "Vänsterklick = Kopiera nummer\nHögerklick = Kopiera nummer utan mellanslag";
                btn.addEventListener("mouseup", (event) =>
                {
                    let notificationText = "";
                    const partno = td.innerText.trim();
                    if (event.button === 2)
                    {
                        const cleanedPartno = partno.replace(/\s/g, "");
                        navigator.clipboard.writeText(cleanedPartno);
                        notificationText = "Kopierad utan mellanslag!";
                    }
                    else
                    {
                        navigator.clipboard.writeText(partno);
                        notificationText = "Kopierad!";
                    }

                    const notification = document.createElement("div");
                    notification.innerText = notificationText;
                    Object.assign(notification.style, {
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
                        transition: "opacity 0.4s ease-out",
                        pointerEvents: "none"
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
                });
                Object.assign(btn.style, {
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
                btn.addEventListener("contextmenu", event =>
                {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                });
                td.innerText = "";
                td.appendChild(btn);
            });
        };

        new MutationObserver(mutationsList =>
        {
            mutationsList.forEach(mutation =>
            {
                if (mutation.type === "childList" && document.querySelector("#partin4dlg > div.blockUI.blockOverlay"))
                {
                    const intervalId = setInterval(() =>
                    {
                        const partinfoTable = document.querySelector("#partin4MainTable tbody");
                        if (partinfoTable && partinfoTable.childElementCount > 0)
                        {
                            clearInterval(intervalId);
                            runCode();
                        }
                    }, 75);
                }
            });
        })
            .observe(targetNode,
                {
                    childList: true
                });
    }

    // Ändrar färgen på 'Nummerändring' så att risken att man missar det är lägre

    if (document.querySelector("#partin4content"))
    {
        const partin4ContentElement = document.querySelector("#partin4content");
        if (partin4ContentElement)
        {
            const observer = new MutationObserver(() =>
            {
                if (partin4ContentElement.querySelector("h2"))
                {
                    const partin4HeaderElement = partin4ContentElement.querySelector("h2");
                    partin4HeaderElement.style.backgroundImage = "linear-gradient(to right, #ff6a2b, #f7c400)";
                }
            });

            observer.observe(partin4ContentElement,
                {
                    childList: true
                });
        }
    }

    // Skapar en knapp så att man kan ladda ner illustrationen som är framme

    if (document.querySelector("#illustration-imageview-container"))
    {
        const illustrationButtons = document.getElementById("illustration-buttons");

        const newTdElement = document.createElement("td");
        newTdElement.classList.add("illuBtn");

        const newAElement = document.createElement("a");
        newAElement.id = "new-btn";
        newAElement.classList.add("toolbarBtn", "toolbarBtnActive");
        newAElement.href = "#";
        newAElement.tabIndex = "-1";
        newAElement.title = "Ladda ner illustration (PNG)";

        const newSvgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        newSvgElement.setAttribute("viewBox", "0 0 121 123");
        newSvgElement.setAttribute("fill", "#fff");
        newSvgElement.innerHTML = "<path d=\"M0 0h121v94H88V84h22V10H11v74h21v10H0V0zm52 101V84h17v17h12l-21 22-20-22zM34 25a8 8 0 11-8 8 8 8 0 018-8zm33 34 16-28 16 43H22v-6h6l7-16 3 12h10l8-22 11 17z\"/>";
        Object.assign(newSvgElement.style,
            {
                width: "100%",
                height: "80%",
                maxWidth: "100%",
                maxHeight: "100%"
            });
        newAElement.appendChild(newSvgElement);

        Object.assign(newAElement.style,
            {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "transparent"
            });

        newAElement.addEventListener("mouseover", () =>
        {
            newAElement.style.backgroundColor = "#9a9b9d";
        });

        newAElement.addEventListener("mouseout", () =>
        {
            newAElement.style.backgroundColor = "transparent";
        });

        newTdElement.appendChild(newAElement);

        const trimTdElement = illustrationButtons.querySelector(".trim");
        trimTdElement.parentNode.insertBefore(newTdElement, trimTdElement);

        const downloadBtn = document.getElementById("new-btn");
        downloadBtn.addEventListener("click", () =>
        {
            ImageView.sendMessage("FitToWindow", null);

            const mainImage = document.querySelector("#MainImage");
            const imageSrc = mainImage.getAttribute("src");

            const bboxRegex = /&bbox=[^&]*?(\d+)%2C(\d+)%2C(\d+)%2C(\d+)/;
            const bboxMatch = imageSrc.match(bboxRegex);
            const [, , , width, height] = bboxMatch;

            const modifiedImageSrc = imageSrc
                .replace(/(&bbox=[^&]*?)0*\d{1,3}(?=[^&]*?(&|$))/, "$10")
                .replace(/&width=[^&]*/, "&width=" + width)
                .replace(/&height=[^&]*/, "&height=" + height)
                .replace(/&scalefac=[^&]*/, "&scalefac=1");

            const link = document.createElement("a");
            const [, , , , , , number] = modifiedImageSrc.split("?path=")[1].split("&")[0].split("/");
            const filename = `peugeot_${number}`;
            link.download = filename;
            link.href = modifiedImageSrc;
            link.click();
        });
    }
})();
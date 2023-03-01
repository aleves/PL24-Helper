// ==UserScript==
// @name         PL24 Helper - Renault
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  PL24 Helper - Renault
// @author       aleves
// @match        https://www.partslink24.com/renault/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=partslink24.com
// @grant        none

// ==/UserScript==

(function() {
	'use strict';

	// Logotyp för att indikera att skriptet är igång

	const logoDiv = document.createElement("div");
	logoDiv.textContent = "PL24 Helper - Renault";
	Object.assign(logoDiv.style, {
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
		zIndex: "999",
	});
	document.querySelector("#linksAndBreadCrumbs").appendChild(logoDiv);

	// Scrollhjulet kan zooma illustrationen in och ut

	const debounce = (func, wait = 10) => (...args) => setTimeout(() => func(...args), wait);

	const zoomPlusButton = document.querySelector("#zoom-plus");
	const zoomMinusButton = document.querySelector("#zoom-minus");
	const glassPane = document.querySelector("#GlassPane");

	const handleScrollInsideGlassPane = debounce(event => {
		const isZoomInDisabled = zoomPlusButton.classList.contains("toolbarBtnDisabled");
		const isZoomOutDisabled = zoomMinusButton.classList.contains("toolbarBtnDisabled");

		if (event.target.closest('#GlassPane') && event.deltaY < 0 && !isZoomInDisabled) {
			ImageView.sendMessage("ZoomIn", null);
		}

		if (event.target.closest('#GlassPane') && event.deltaY > 0 && !isZoomOutDisabled) {
			ImageView.sendMessage("ZoomOut", null);
		}
	});

	window.addEventListener('wheel', handleScrollInsideGlassPane);


	// Ersätt icke-ASCII tecken med tecknet som PL24 använder

	const unknownChar = '�';
	const inputField = document.querySelector('#searchTerm');
	const searchButton = document.querySelector('#searchForm button[type="submit"]');

	if (inputField && searchButton) {
		const replaceNonASCII = (value) => value.replace(/[^\x00-\x7F]+/g, unknownChar);

		inputField.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				inputField.value = replaceNonASCII(inputField.value);
			}
		});

		searchButton.addEventListener('click', (e) => {
			inputField.value = replaceNonASCII(inputField.value);
		});
	}
})();

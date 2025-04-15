document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const textInput = document.getElementById("text-input");
    const referenceInput = document.getElementById("reference-number");
    const fontSizeInput = document.getElementById("font-size");
    const fontSizeValue = document.querySelector(".font-size-value");
    const fontBold = document.getElementById("font-bold");
    const fontItalic = document.getElementById("font-italic");
    const canvasSizeSelect = document.getElementById("canvas-size");
    const logoToggle = document.getElementById("logo-toggle");
    const tabButtons = document.querySelectorAll(".tab-button");
    const colorTabs = document.querySelectorAll(".color-tab");
    const generateButton = document.getElementById("generate-button");
    const downloadButton = document.getElementById("download-button");
    const copyButton = document.getElementById("copy-button");
    const newImageButton = document.getElementById("new-image-button");

    const logoImage = new Image();
    logoImage.src = "assets/logo.png";
    let logoLoaded = false;

    logoImage.onload = () => {
        logoLoaded = true;
        drawImage();
    };
    logoImage.onerror = () => {
        console.error("Failed to load logo image.");
        logoLoaded = false;
        drawImage();
    };

    let currentScheme = { backgroundColor: "#ffffff", textColor: "#333333" };
    let canvasSize = { width: 1200, height: 675 }; // Default: Twitter post

    // Get font string
    const getFontString = (fontSize) => {
        const weight = fontBold.checked ? "700" : "400";
        const style = fontItalic.checked ? "italic" : "normal";
        return `${style} ${weight} ${fontSize}px Inter, Arial, sans-serif`;
    };

    // Set canvas size based on selection
    const setCanvasSize = (size) => {
        switch (size) {
            case "twitter":
                canvasSize = { width: 1200, height: 675 };
                break;
            case "instagram":
                canvasSize = { width: 1080, height: 1080 };
                break;
            case "insta-reel":
                canvasSize = { width: 1080, height: 1920 };
                break;
        }
        const scale = window.devicePixelRatio || 1;
        canvas.width = canvasSize.width * scale;
        canvas.height = canvasSize.height * scale;
        canvas.style.width = `${canvasSize.width}px`;
        canvas.style.height = `${canvasSize.height}px`;
        ctx.scale(scale, scale);
        drawImage();
    };

    // Wrap text and calculate total height
    const wrapText = (context, text, x, maxWidth, fontSize) => {
        const lineHeight = fontSize * 1.2;
        let lines = [];
        const paragraphs = text.split("\n");

        paragraphs.forEach((paragraph) => {
            if (paragraph.trim() === "") {
                lines.push(""); // Empty line for paragraph break
                return;
            }
            let line = "";
            const words = paragraph.split(" ");
            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + " ";
                context.font = getFontString(fontSize);
                const metrics = context.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    lines.push(line.trim());
                    line = words[n] + " ";
                } else {
                    line = testLine;
                }
            }
            lines.push(line.trim());
        });

        return { lines, lineHeight };
    };

    // Calculate text height and adjust font size to fit within maxHeight
    const fitText = (context, text, maxWidth, maxHeight, baseFontSize) => {
        let fontSize = baseFontSize;
        let result;

        // Adjust maxHeight for 1% top margin
        const effectiveMaxHeight = maxHeight - (canvasSize.height * 0.01);

        do {
            result = wrapText(context, text, canvasSize.width / 2, maxWidth, fontSize);
            const totalHeight = result.lines.length * result.lineHeight;
            if (totalHeight <= effectiveMaxHeight || fontSize <= 20) break;
            fontSize -= 2;
        } while (fontSize > 20);

        return { lines: result.lines, fontSize, lineHeight: result.lineHeight };
    };

    // Draw the image on the canvas
    const drawImage = () => {
        ctx.fillStyle = currentScheme.backgroundColor;
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

        // Draw main text (0–80% with 1% top margin)
        const text = textInput.value || "Your Text Here";
        const textAreaHeight = canvasSize.height * 0.8; // 540px for Twitter
        const topMargin = canvasSize.height * 0.01; // 6.75px
        const maxWidth = canvasSize.width * 0.9;
        const baseFontSize = parseInt(fontSizeInput.value) || 50;
        const { lines, fontSize, lineHeight } = fitText(ctx, text, maxWidth, textAreaHeight, baseFontSize);

        ctx.fillStyle = currentScheme.textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const totalTextHeight = lines.length * lineHeight;

        // Start with 1% margin, center in remaining space
        let startY = topMargin + (textAreaHeight - totalTextHeight - topMargin) / 2;
        if (startY < topMargin) startY = topMargin;

        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;
            if (y + lineHeight <= textAreaHeight) {
                if (line) {
                    ctx.font = getFontString(fontSize);
                    ctx.fillText(line, canvasSize.width / 2, y);
                }
            }
        });

        // Draw reference number (80–84%, 1px above divider)
        if (referenceInput.value) {
            const refFontSize = Math.max(14, fontSize * 0.35);
            ctx.font = getFontString(refFontSize);
            const dividerY = canvasSize.height * 0.84;
            const refY = dividerY - 1 - refFontSize; // Bottom edge 1px above divider
            ctx.fillText(`Ref: ${referenceInput.value}`, canvasSize.width / 2, refY);

            // Draw divider below reference (at 84%)
            ctx.strokeStyle = currentScheme.textColor;
            ctx.lineWidth = 2;
            const dividerWidth = canvasSize.width * 0.9;
            ctx.beginPath();
            ctx.moveTo(canvasSize.width / 2 - dividerWidth / 2, dividerY);
            ctx.lineTo(canvasSize.width / 2 + dividerWidth / 2, dividerY);
            ctx.stroke();
        }

        // Draw logo (84–97%)
        if (logoToggle.checked && logoLoaded) {
            const logoHeight = canvasSize.height * 0.13;
            const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
            const logoX = (canvasSize.width - logoWidth) / 2;
            const logoY = canvasSize.height * 0.905 - logoHeight / 2;
            ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);
        }

        // Warn if text is too long
        if (text.length > 1000) {
            alert("Text is very long and may not display fully. Consider shortening it.");
        }
    };

    // Debounce function
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // Update color scheme
    const updateColorScheme = (bgColor, textColor) => {
        currentScheme.backgroundColor = bgColor;
        currentScheme.textColor = textColor;
        document.querySelectorAll(".color-option").forEach((opt) => {
            opt.setAttribute("aria-checked", opt.getAttribute("data-bg") === bgColor ? "true" : "false");
            opt.tabIndex = opt.getAttribute("data-bg") === bgColor ? 0 : -1;
        });
        drawImage();
    };

    // Handle tab switching
    tabButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            tabButtons.forEach((btn) => {
                btn.classList.remove("active");
                btn.setAttribute("aria-selected", "false");
            });
            colorTabs.forEach((tab) => tab.classList.remove("active"));

            button.classList.add("active");
            button.setAttribute("aria-selected", "true");
            const tabContent = document.querySelector(`#${button.getAttribute("data-tab")}-tab`);
            if (tabContent) {
                tabContent.classList.add("active");
            }
        });

        button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                tabButtons.forEach((btn) => {
                    btn.classList.remove("active");
                    btn.setAttribute("aria-selected", "false");
                });
                colorTabs.forEach((tab) => tab.classList.remove("active"));

                button.classList.add("active");
                button.setAttribute("aria-selected", "true");
                const tabContent = document.querySelector(`#${button.getAttribute("data-tab")}-tab`);
                if (tabContent) {
                    tabContent.classList.add("active");
                }
            }
        });
    });

    // Event Listeners
    textInput.addEventListener("input", debounce(drawImage, 300));
    referenceInput.addEventListener("input", debounce(drawImage, 300));
    logoToggle.addEventListener("change", drawImage);
    canvasSizeSelect.addEventListener("change", () => setCanvasSize(canvasSizeSelect.value));
    fontSizeInput.addEventListener("input", () => {
        fontSizeValue.textContent = `${fontSizeInput.value}px`;
        drawImage();
    });
    fontBold.addEventListener("change", drawImage);
    fontItalic.addEventListener("change", drawImage);

    document.querySelectorAll(".color-option").forEach((option) => {
        option.addEventListener("click", (e) => {
            e.preventDefault();
            const bgColor = option.getAttribute("data-bg");
            const textColor = option.getAttribute("data-text");
            updateColorScheme(bgColor, textColor);
        });
        option.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const bgColor = option.getAttribute("data-bg");
                const textColor = option.getAttribute("data-text");
                updateColorScheme(bgColor, textColor);
            }
        });
    });

    generateButton.addEventListener("click", (e) => {
        e.preventDefault();
        drawImage();
    });

    downloadButton.addEventListener("click", (e) => {
        e.preventDefault();
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = "generated-image.png";
        link.click();
    });

    copyButton.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
            const dataUrl = canvas.toDataURL("image/png");
            const blob = await (await fetch(dataUrl)).blob();
            await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
            ]);
            alert("Image copied to clipboard!");
        } catch (err) {
            console.error("Clipboard copy failed:", err);
            alert("Failed to copy image. Try downloading instead.");
        }
    });

    newImageButton.addEventListener("click", (e) => {
        e.preventDefault();
        textInput.value = "";
        referenceInput.value = "";
        fontSizeInput.value = 50;
        fontSizeValue.textContent = "50px";
        fontBold.checked = false;
        fontItalic.checked = false;
        canvasSizeSelect.value = "twitter";
        logoToggle.checked = true;
        updateColorScheme("#ffffff", "#333333");

        tabButtons.forEach((btn) => {
            btn.classList.remove("active");
            btn.setAttribute("aria-selected", "false");
        });
        colorTabs.forEach((tab) => tab.classList.remove("active"));
        const popularButton = document.querySelector('.tab-button[data-tab="popular"]');
        const popularTab = document.querySelector('#popular-tab');
        if (popularButton && popularTab) {
            popularButton.classList.add("active");
            popularButton.setAttribute("aria-selected", "true");
            popularTab.classList.add("active");
        }

        setCanvasSize("twitter");
    });

    // Initialize
    setCanvasSize("twitter");
    drawImage();
});

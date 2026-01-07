import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Robustly resolves a color string to an sRGB format (rgb/rgba) that html2canvas can parse.
 * Uses a browser-based conversion cache to handle oklch, hsl, etc.
 */
const colorCache = new Map();

/**
 * Parses `color(srgb r g b / a)` string and returns `rgba(...)` string.
 * Supports negative values (clamped to 0) which browsers might return for out-of-gamut conversions.
 */
const parseColorSrgb = (colorString) => {
    // Regex updated to allow negative signs in numbers: [-\d\.]+
    const match = colorString.match(/color\(srgb\s+([-\d\.]+)\s+([-\d\.]+)\s+([-\d\.]+)(?:\s*\/\s*([\d\.]+))?\)/);
    if (match) {
        const parseAndClamp = (val) => {
            const num = parseFloat(val);
            // Clamp to 0-1 range before multiplying by 255
            return Math.round(Math.max(0, Math.min(1, num)) * 255);
        };

        const r = parseAndClamp(match[1]);
        const g = parseAndClamp(match[2]);
        const b = parseAndClamp(match[3]);
        const a = match[4] ? parseFloat(match[4]) : 1;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return null;
};

const resolveColor = (color) => {
    if (!color || typeof color !== 'string') return color;
    if (colorCache.has(color)) return colorCache.get(color);

    // If we already have a safe color (and it's not a function like color(...)), return it
    if ((color.startsWith('rgb') || color.startsWith('#')) && !color.includes('color(')) {
        colorCache.set(color, color);
        return color;
    }

    // If it is a gradient or url, skip. html2canvas handles gradients generally, 
    // but if they contain oklch, logic inside replaceOklchInText handles substring replacement.
    if (color.includes('gradient') || color.includes('url(')) {
        return color;
    }

    // Fallback for tricky colors particularly 'oklch'.
    // We use color-mix to force interpolation into srgb space.
    let cssValue = color;
    if (color.includes('oklch') || color.includes('lab') || color.includes('lch')) {
        cssValue = `color-mix(in srgb, ${color} 100%, transparent)`;
    }

    const div = document.createElement('div');
    div.style.color = 'rgb(0,0,0)'; // default
    div.style.color = cssValue;
    div.style.display = 'none';
    document.body.appendChild(div);

    let computed = window.getComputedStyle(div).color;
    document.body.removeChild(div);

    // Analyze the computed value
    let finalColor = computed;

    // 1. Handle "color(srgb ...)" which browsers like Chrome return for color-mix or wide gamut
    if (finalColor.startsWith('color(srgb')) {
        const parsed = parseColorSrgb(finalColor);
        if (parsed) {
            finalColor = parsed;
        }
    }

    // 2. If it still contains 'oklch' or 'color(' that we failed to parse, fallback to safe.
    // We CANNOT return these to html2canvas or it crashes.
    if (finalColor.includes('oklch') || finalColor.startsWith('color(')) {
        console.warn('Unable to convert color to legacy format:', color, '->', finalColor);
        finalColor = 'rgba(0,0,0,0)'; // Transparent fallback
    }

    colorCache.set(color, finalColor);
    return finalColor;
};

/**
 * Regex to capture `oklch(...)` function calls.
 */
const OKLCH_REGEX = /oklch\([^)]+\)/g;

/**
 * Replaces all oklch occurrences in a text string with their resolved RGB values.
 */
const replaceOklchInText = (text) => {
    if (!text || !text.includes('oklch')) return text;
    return text.replace(OKLCH_REGEX, (match) => resolveColor(match));
};

/**
 * Prepares the cloned DOM for export by:
 * 1. Resolving modern CSS colors (oklch) to standard sRGB.
 * 2. Fixing common layout issues in export (e.g. text clipping).
 */
const prepareCloneForExport = (clonedDoc) => {
    // 1. Process all <style> tags
    const styleTags = clonedDoc.querySelectorAll('style');
    styleTags.forEach(tag => {
        if (tag.innerHTML.includes('oklch')) {
            tag.innerHTML = replaceOklchInText(tag.innerHTML);
        }
    });

    // 2. Process inline styles on elements
    const walker = clonedDoc.createTreeWalker(clonedDoc.body, NodeFilter.SHOW_ELEMENT);
    let currentNode = walker.currentNode;

    while (currentNode) {
        if (currentNode.nodeType === Node.ELEMENT_NODE) {
            // Check inline style attribute
            const inlineCss = currentNode.getAttribute('style');
            if (inlineCss && inlineCss.includes('oklch')) {
                const newCss = replaceOklchInText(inlineCss);
                currentNode.setAttribute('style', newCss);
            }
        }
        currentNode = walker.nextNode();
    }

    // 3. Fix Layout & Text Clipping Issues
    // Export at current viewport width - use smaller fonts and allow vertical text wrapping
    // This prevents the screen from flashing/resizing during export

    // Day Cells: Allow content to expand vertically
    const dayCells = clonedDoc.querySelectorAll('.calendar-day-cell');
    dayCells.forEach(cell => {
        cell.style.setProperty('overflow', 'visible', 'important');
        cell.style.setProperty('height', 'auto', 'important');
        cell.style.setProperty('min-height', '100px', 'important');
        cell.style.setProperty('padding', '4px', 'important');
    });

    // Calendar card content: Ensure task containers are visible
    const cardContents = clonedDoc.querySelectorAll('.calendar-card-content');
    cardContents.forEach(content => {
        content.style.setProperty('overflow', 'visible', 'important');
        content.style.setProperty('display', 'block', 'important');
        content.style.setProperty('max-height', 'none', 'important');
    });

    // Task Cards: Smaller fonts that fit in narrow cells, text wraps vertically
    const taskCards = clonedDoc.querySelectorAll('.calendar-task-card');
    taskCards.forEach(card => {
        card.style.setProperty('height', 'auto', 'important');
        card.style.setProperty('max-height', 'none', 'important');
        card.style.setProperty('overflow', 'visible', 'important');
        card.style.setProperty('white-space', 'normal', 'important');
        card.style.setProperty('word-break', 'break-word', 'important');
        card.style.setProperty('padding', '2px 4px', 'important');
        card.style.setProperty('margin-bottom', '2px', 'important');
        card.style.setProperty('font-size', '8px', 'important');
        card.style.setProperty('line-height', '1.2', 'important');
    });

    // Task Titles: Smaller font, allow wrapping
    const taskTitles = clonedDoc.querySelectorAll('.calendar-task-title');
    taskTitles.forEach(title => {
        title.style.setProperty('overflow', 'visible', 'important');
        title.style.setProperty('white-space', 'normal', 'important');
        title.style.setProperty('word-break', 'break-word', 'important');
        title.style.setProperty('line-height', '1.2', 'important');
        title.style.setProperty('font-size', '8px', 'important');
        title.style.setProperty('font-weight', '500', 'important');
    });

    // 4. Reveal hidden export-task-time elements (smaller font)
    const exportTimes = clonedDoc.querySelectorAll('.export-task-time');
    exportTimes.forEach(time => {
        time.style.setProperty('display', 'inline', 'important');
        time.style.setProperty('font-size', '7px', 'important');
        time.style.setProperty('margin-left', '4px', 'important');
        time.style.setProperty('opacity', '0.9', 'important');
        time.style.setProperty('color', 'inherit', 'important');
    });

    // 5. Convert computed oklch colors to RGB for all elements (production fix)
    // html2canvas reads computed styles which may contain oklch from CSS variables
    const allElements = clonedDoc.querySelectorAll('*');
    const colorProps = ['color', 'background-color', 'border-color', 'outline-color'];

    allElements.forEach(el => {
        try {
            const computed = window.getComputedStyle(el);
            colorProps.forEach(prop => {
                const value = computed.getPropertyValue(prop);
                if (value && (value.includes('oklch') || value.includes('color('))) {
                    const resolved = resolveColor(value);
                    el.style.setProperty(prop, resolved, 'important');
                }
            });

            // Also handle background (which might include gradients with oklch)
            const bg = computed.getPropertyValue('background');
            if (bg && bg.includes('oklch')) {
                const resolved = replaceOklchInText(bg);
                el.style.setProperty('background', resolved, 'important');
            }
        } catch (err) {
            // Skip elements where computed styles can't be read
        }
    });
};

// Helper to wait for images to load
const waitForImages = (element) => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
        });
    });
    return Promise.all(promises);
};

export const exportToPDF = async (element, filename = 'calendar-export') => {
    if (!element) return;

    try {
        await waitForImages(element);

        // Export at current viewport width - clone styling handles font/cell adjustments
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: prepareCloneForExport,
            ignoreElements: (el) => false
        });

        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        const imgWidth = canvas.width;
        const imgHeight = canvas.height;

        const orientation = imgWidth > imgHeight ? 'l' : 'p';
        const pdf = new jsPDF(orientation, 'px', [imgWidth, imgHeight]);

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
    } catch (error) {
        console.error('Export to PDF failed:', error);
    }
};

export const exportToJPEG = async (element, filename = 'calendar-export') => {
    if (!element) return;

    try {
        await waitForImages(element);

        // Export at current viewport width - clone styling handles font/cell adjustments
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: prepareCloneForExport
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 1.0);
        link.download = `${filename}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Export to JPEG failed:', error);
    }
};

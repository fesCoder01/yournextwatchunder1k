/* بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ */
const toggleButton = document.getElementById("filterToggle");
const filterMenu = document.getElementById("filterMenu");
const form = document.getElementById("filterForm");
const clearBtn = document.getElementById("clearFilters");
const sortSelect = document.getElementById("sortSelect");

toggleButton.addEventListener("click", (e) => {
    e.stopPropagation();
    filterMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
    if (!filterMenu.contains(e.target) && !toggleButton.contains(e.target)) {
        filterMenu.classList.add("hidden");
    }
});

form.querySelectorAll(".toggle-section").forEach(btn => {
    btn.addEventListener("click", () => {
        const section = btn.nextElementSibling;
        const icon = btn.querySelector(".icon");
        section.classList.toggle("hidden");
        icon.textContent = section.classList.contains("hidden") ? "+" : "-";
    });
});

// Get watches in their visual order (as they appear in rows)
const rows = document.querySelectorAll('.row');
const watches = [];
const filters = ["brand", "movement", "size", "range", "style", "dialColor", "strapMaterial", "displayed"];
const values = {};
filters.forEach(attr => values[attr] = new Set());

// Extract watches in visual order from rows and store their original positions
rows.forEach((row, rowIndex) => {
    const leftItem = row.querySelector('.left-item');
    const rightItem = row.querySelector('.right-item');
    
    if (leftItem) {
        leftItem.dataset.originalPosition = watches.length;
        const watchName = leftItem.querySelector('span').textContent;
        console.log(`Position ${watches.length}: ${watchName} (left)`);
        watches.push(leftItem);
    }
    if (rightItem) {
        rightItem.dataset.originalPosition = watches.length;
        const watchName = rightItem.querySelector('span').textContent;
        console.log(`Position ${watches.length}: ${watchName} (right)`);
        watches.push(rightItem);
    }
});

// Process watches for filters
watches.forEach(watch => {
    const styleString = watch.dataset["style"];
    const styleVals = styleString.split(" ");

    // 1. Extract first, penultimate, and last values
    const first = styleVals[0];
    const penultimate = styleVals[styleVals.length - 2];
    const last = styleVals[styleVals.length - 1];

    // 2. Assign to synthetic attributes
    if (first) {
        values["displayed"].add(first);
        watch.dataset["displayed"] = first;
    }
    if (penultimate) {
        values["dialColor"].add(penultimate);
        watch.dataset["dialColor"] = penultimate;
    }
    if (last) {
        values["strapMaterial"].add(last);
        watch.dataset["strapMaterial"] = last;
    }

    // 3. Assign middle style values to the style filter
    styleVals.forEach((val, i) => {
        if (i !== 0 && i !== styleVals.length - 2 && i !== styleVals.length - 1) {
            values["style"].add(val);
        }
    });

    // 4. Handle other filters normally
    filters.forEach(attr => {
        if (["style", "dialColor", "strapMaterial", "displayed"].includes(attr)) return;
        const val = watch.dataset[attr];
        if (val) values[attr].add(val);
    });
});

// Build filter options
filters.forEach(attr => {
    const container = form.querySelector(`[data-filter="${attr}"] .section-options`);
    Array.from(values[attr]).sort().forEach(val => {
        const id = `${attr}-${val.replace(/\s+/g, '-')}`;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = id;
        checkbox.name = attr;
        checkbox.value = val;
        const label = document.createElement("label");
        label.htmlFor = id;
        label.innerText = val;
        const wrapper = document.createElement("div");
        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    });
});

// Function to extract numeric price value from data-range
function getPriceValue(rangeString) {
    if (rangeString.includes('< $100')) {
        return 50; // Midpoint of < $100 range
    }
    
    const match = rangeString.match(/\$(\d+)-(\d+)/);
    if (match) {
        const min = parseInt(match[1]);
        const max = parseInt(match[2]);
        return (min + max) / 2; // Return midpoint of range
    }
    
    return 0; // Default fallback
}

// Function to sort watches by price
function sortWatches(watches, sortOrder) {
    return [...watches].sort((a, b) => {
        const priceA = getPriceValue(a.dataset.range);
        const priceB = getPriceValue(b.dataset.range);
        
        if (sortOrder === 'low-high') {
            if (priceA !== priceB) {
                return priceA - priceB;
            }
            // If prices are equal, maintain original order using stored originalPosition
            return parseInt(a.dataset.originalPosition) - parseInt(b.dataset.originalPosition);
        } else if (sortOrder === 'high-low') {
            if (priceA !== priceB) {
                return priceB - priceA;
            }
            // If prices are equal, maintain original order using stored originalPosition
            return parseInt(a.dataset.originalPosition) - parseInt(b.dataset.originalPosition);
        }
        return 0; // Default order
    });
}

// Function to render watches in rows
function renderWatches(watches) {
    const rowsContainer = document.querySelector('body');
    const existingRows = document.querySelectorAll('.row');
    existingRows.forEach(row => row.remove());

    for (let i = 0; i < watches.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'row';

        // First item in the row
        const firstItem = watches[i].cloneNode(true);
        firstItem.className = (i + 1 >= watches.length) ? 'single-item' : 'left-item';

        row.appendChild(firstItem);

        // Second item in the row, if it exists
        if (i + 1 < watches.length) {
            const secondItem = watches[i + 1].cloneNode(true);
            secondItem.className = 'right-item';
            row.appendChild(secondItem);
        }

        rowsContainer.insertBefore(row, document.querySelector('footer'));
    }
}

// Filter form submission
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const visibleWatches = [];

    console.log("=== FILTERING ===");
    // Filter watches in original order
    watches.forEach((watch, index) => {
        const watchName = watch.querySelector('span').textContent;
        let visible = true;
        for (const attr of filters) {
            const selected = formData.getAll(attr);
            if (selected.length > 0) {
                const dataVal = watch.dataset[attr];
                if (attr === 'style') {
                    const styleVals = dataVal.split(" ");
                    visible = selected.some(val => styleVals.includes(val));
                } else {
                    visible = selected.includes(dataVal);
                }
            }
            if (!visible) break;
        }

        if (visible) {
            console.log(`Visible: ${watchName} (original pos: ${watch.dataset.originalPosition})`);
            visibleWatches.push(watch);
        } else {
            console.log(`Hidden: ${watchName}`);
        }
    });

    console.log("=== RENDERING ===");
    // Apply current sorting if any
    const currentSortOrder = sortSelect.value;
    if (currentSortOrder !== 'default') {
        const sortedWatches = sortWatches(visibleWatches, currentSortOrder);
        console.log("Sorted order:");
        sortedWatches.forEach((watch, index) => {
            const watchName = watch.querySelector('span').textContent;
            console.log(`${index}: ${watchName}`);
        });
        renderWatches(sortedWatches);
    } else {
        console.log("Original order (no sorting):");
        visibleWatches.forEach((watch, index) => {
            const watchName = watch.querySelector('span').textContent;
            console.log(`${index}: ${watchName}`);
        });
        renderWatches(visibleWatches);
    }

    filterMenu.classList.add("hidden");
});

// Store the original rows HTML when page loads
const originalRowsHTML = Array.from(document.querySelectorAll('.row')).map(row => row.outerHTML);

// Clear filters
clearBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // 1. Reset all checkboxes and sorting
    form.reset();
    sortSelect.value = 'default';

    // 2. Remove all current rows
    const rowsContainer = document.querySelector('body');
    document.querySelectorAll('.row').forEach(row => row.remove());

    // 3. Recreate original rows from stored HTML
    originalRowsHTML.forEach(rowHTML => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = rowHTML;
        rowsContainer.insertBefore(tempDiv.firstChild, document.querySelector('footer'));
    });

    // 4. Reset filter UI state
    document.querySelectorAll(".section-options").forEach(sec => sec.classList.add("hidden"));
    document.querySelectorAll(".toggle-section .icon").forEach(icon => icon.textContent = "+");
});
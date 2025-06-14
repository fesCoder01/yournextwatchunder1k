/* بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ */
const toggleButton = document.getElementById("filterToggle");
const filterMenu = document.getElementById("filterMenu");
const form = document.getElementById("filterForm");
const clearBtn = document.getElementById("clearFilters");

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

const watches = document.querySelectorAll(".left-item, .right-item");
const filters = ["brand", "movement", "size", "range", "style", "dialColor", "strapMaterial", "displayed"];
const values = {};
filters.forEach(attr => values[attr] = new Set());

watches.forEach(watch => {
    filters.forEach(attr => {
        if (attr === 'style') {
            const val = watch.dataset[attr];
            const styleVals = val.split(" ");
            styleVals.forEach(v => values[attr].add(v));

            // First value = Displayed
            const first = styleVals[0];
            if (first) {
                values["displayed"].add(first);
                watch.dataset["displayed"] = first;
            }

            // Second-to-last = dialColor
            const penultimate = styleVals[styleVals.length - 2];
            if (penultimate) {
                values["dialColor"].add(penultimate);
                watch.dataset["dialColor"] = penultimate;
            }

            // Last = strapMaterial
            const last = styleVals[styleVals.length - 1];
            if (last) {
                values["strapMaterial"].add(last);
                watch.dataset["strapMaterial"] = last;
            }
        } else if (!["dialColor", "strapMaterial", "displayed"].includes(attr)) {
            const val = watch.dataset[attr];
            if (val) values[attr].add(val);
        }
    });
});



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

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const visibleWatches = [];

    watches.forEach(watch => {
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
            visibleWatches.push(watch);
        }
    });

    const rowsContainer = document.querySelector('body');
    const existingRows = document.querySelectorAll('.row');
    existingRows.forEach(row => row.remove());

    for (let i = 0; i < visibleWatches.length; i += 2) {
        const row = document.createElement('div');
        row.className = 'row';

        // Create left item
        const leftItem = visibleWatches[i].cloneNode(true);

        // Check if this is the last item with no pair
        if (i + 1 >= visibleWatches.length) {
            // Single item in row
            leftItem.className = 'single-item';
        } else {
            leftItem.className = 'left-item';

            const rightItem = visibleWatches[i + 1].cloneNode(true);
            rightItem.className = 'right-item';
            row.appendChild(rightItem);
        }

        row.appendChild(leftItem);


        rowsContainer.insertBefore(row, document.querySelector('footer'));
    }

    filterMenu.classList.add("hidden");
});


// Store the original rows HTML when page loads
const originalRowsHTML = Array.from(document.querySelectorAll('.row')).map(row => row.outerHTML);

clearBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // 1. Reset all checkboxes
    form.reset();

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
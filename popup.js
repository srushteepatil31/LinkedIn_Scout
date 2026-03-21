// popup.js - CRM FEATURES ENABLED (Tabs, Delete, Comments)

document.addEventListener("DOMContentLoaded", () => {
    const output = document.getElementById("output");
    const tabsContainer = document.getElementById("tabsContainer");
    
    // We will store the bucket globally here so our buttons can edit it
    let currentBucket = []; 
    let currentTab = "All";

    // 1. INITIALIZE APP & TABS
    chrome.storage.local.get(["bucketList"], (result) => {
        currentBucket = result.bucketList || [];
        
        if (currentBucket.length === 0) {
            output.innerHTML = "<p style='color: #666; font-size: 14px;'>Your bucket is empty. Go to a LinkedIn profile to save items!</p>";
            return;
        }

        const categories = ["All"]; 
        currentBucket.forEach(item => {
            const cat = item.category || "Uncategorized";
            if (!categories.includes(cat)) categories.push(cat);
        });

        categories.forEach(cat => {
            const tabBtn = document.createElement("button");
            tabBtn.innerText = cat;
            tabBtn.className = "filter-tab";
            tabBtn.style.padding = "4px 10px";
            tabBtn.style.border = "1px solid #0a66c2";
            tabBtn.style.borderRadius = "15px";
            tabBtn.style.cursor = "pointer";
            tabBtn.style.fontSize = "12px";
            tabBtn.style.fontWeight = "bold";
            tabBtn.style.whiteSpace = "nowrap";
            
            if (cat === "All") {
                tabBtn.style.backgroundColor = "#0a66c2";
                tabBtn.style.color = "white";
            } else {
                tabBtn.style.backgroundColor = "white";
                tabBtn.style.color = "#0a66c2";
            }

            tabBtn.addEventListener("click", () => {
                document.querySelectorAll(".filter-tab").forEach(t => {
                    t.style.backgroundColor = "white";
                    t.style.color = "#0a66c2";
                });
                tabBtn.style.backgroundColor = "#0a66c2";
                tabBtn.style.color = "white";
                
                currentTab = cat; // Update the active tab
                renderList(); // Redraw screen
            });

            tabsContainer.appendChild(tabBtn);
        });

        renderList();
    });

    // ==========================================
    // 2. THE RENDER ENGINE (Draws Cards + Comments + Delete)
    // ==========================================
    function renderList() {
        output.innerHTML = ""; 
        let itemsRendered = false;

        // Loop backwards (Newest first)
        for (let i = currentBucket.length - 1; i >= 0; i--) {
            const data = currentBucket[i];
            if (!data) continue; 
            
            const displayCategory = data.category || "Uncategorized";
            
            // Apply the tab filter
            if (currentTab !== "All" && displayCategory !== currentTab) continue;

            itemsRendered = true;
            const safeName = data.name || "Unknown Profile";
            const safeDetails = data.details || "No details extracted";
            const safeComment = data.comment || ""; // Load existing comment

            const div = document.createElement("div");
            div.style.border = "1px solid #e0e0e0";
            div.style.borderRadius = "5px";
            div.style.padding = "8px";
            div.style.marginBottom = "8px";
            div.style.backgroundColor = "#f9fafb";

            // Notice the new 🗑️ button and Comment input field!
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                    <div>
                        <strong style="color: #0a66c2; font-size: 14px;">👤 ${safeName}</strong>
                        <span style="display: inline-block; background-color: #e8eaed; color: #3c4043; font-size: 10px; padding: 2px 6px; border-radius: 12px; margin-left: 6px; vertical-align: middle; font-weight: bold;">🏷️ ${displayCategory}</span>
                    </div>
                    <button class="delete-item-btn" data-index="${i}" style="background: none; border: none; cursor: pointer; font-size: 14px; padding: 0;" title="Delete Item">🗑️</button>
                </div>
                <span style="font-size: 12px; display: block; margin-top: 4px; color: #333;">📌 ${safeDetails}</span>
                
                <div style="margin-top: 8px; border-top: 1px dashed #ccc; padding-top: 8px; display: flex; gap: 4px;">
                    <input type="text" class="comment-input" data-index="${i}" value="${safeComment}" placeholder="Add a note (e.g. Good for Fintech case...)" style="flex-grow: 1; font-size: 11px; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                    <button class="save-comment-btn" data-index="${i}" style="background-color: #e8eaed; color: #333; border: none; padding: 4px 8px; font-size: 11px; border-radius: 3px; cursor: pointer; font-weight: bold;">Save</button>
                </div>
            `;
            output.appendChild(div);
        }

        if (!itemsRendered) {
            output.innerHTML = `<p style='color: #666; font-size: 13px;'>No items found in ${currentTab}.</p>`;
        }
    }

    // ==========================================
    // 3. EVENT LISTENERS FOR NEW BUTTONS (Delete & Comments)
    // ==========================================
    // We attach one listener to the whole output area (Event Delegation)
    output.addEventListener("click", (event) => {
        
        // Handle Individual Delete
        if (event.target.classList.contains("delete-item-btn")) {
            const indexToRemove = event.target.getAttribute("data-index");
            if (confirm("Delete this single item?")) {
                currentBucket.splice(indexToRemove, 1); // Remove from array
                chrome.storage.local.set({ bucketList: currentBucket }, () => {
                    renderList(); // Redraw UI
                });
            }
        }

        // Handle Save Comment
        if (event.target.classList.contains("save-comment-btn")) {
            const indexToUpdate = event.target.getAttribute("data-index");
            const inputField = document.querySelector(`.comment-input[data-index="${indexToUpdate}"]`);
            
            if (inputField) {
                currentBucket[indexToUpdate].comment = inputField.value; // Update array
                chrome.storage.local.set({ bucketList: currentBucket }, () => {
                    // Visual feedback that it saved!
                    event.target.innerText = "✅ Saved";
                    event.target.style.backgroundColor = "#d4edda";
                    event.target.style.color = "#155724";
                    
                    setTimeout(() => {
                        event.target.innerText = "Save";
                        event.target.style.backgroundColor = "#e8eaed";
                        event.target.style.color = "#333";
                    }, 1500);
                });
            }
        }
    });

    // ==========================================
    // 4. MASTER CONTROLS (Clear All & Export)
    // ==========================================
    document.getElementById("clearBtn")?.addEventListener("click", () => {
        if(confirm("Are you sure you want to delete EVERYTHING in your bucket?")) {
            chrome.storage.local.remove("bucketList", () => {
                currentBucket = [];
                output.innerHTML = "<p style='color: #666; font-size: 14px;'>Bucket cleared!</p>";
                tabsContainer.innerHTML = ""; 
            });
        }
    });

    document.getElementById("exportBtn")?.addEventListener("click", () => {
        if (currentBucket.length === 0) {
            alert("Your bucket is empty! Nothing to export.");
            return;
        }

        // Added the new "Notes" column to your CSV!
        let csvContent = "Profile Name,Category,Extracted Details,Notes\n";
        
        currentBucket.forEach(item => {
            if (!item) return; 
            const safeName = `"${(item.name || "Unknown").replace(/"/g, '""')}"`;
            const safeCategory = `"${(item.category || "Uncategorized").replace(/"/g, '""')}"`;
            const safeDetails = `"${(item.details || "").replace(/"/g, '""')}"`;
            const safeComment = `"${(item.comment || "").replace(/"/g, '""')}"`;
            
            csvContent += `${safeName},${safeCategory},${safeDetails},${safeComment}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "LinkedIn_Scout_Data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
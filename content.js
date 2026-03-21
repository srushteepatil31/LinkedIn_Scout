// content.js - SMART MEMORY ENABLED

console.log("LinkedIn Bucket Saver is awake!");

function injectSaveButtons() {
    // 1. Fetch the bucket list FIRST so we know what is already saved
    chrome.storage.local.get(["bucketList"], (result) => {
        const bucket = result.bucketList || [];
        const listItems = document.querySelectorAll('main section li.artdeco-list__item');

        listItems.forEach(item => {
            const textCheck = item.innerText;
            if (textCheck.includes('Connect') || textCheck.includes('Follow') || textCheck.includes('Message')) {
                return; 
            }

            const titleSpan = item.querySelector('.t-bold span[aria-hidden="true"]');
            if (!titleSpan) return;

            // Ensure we haven't already added a button to this specific item on the page
            if (!item.querySelector('.bucket-save-btn')) {
                
                // ==========================================
                // PRE-EXTRACT DATA TO CHECK AGAINST MEMORY
                // ==========================================
                const nameElement = document.querySelector("h1") || document.querySelector(".text-heading-xlarge");
                const profileName = nameElement ? nameElement.innerText.trim() : "Unknown Profile";

                let structuredData = [];
                const allHiddenSpans = item.querySelectorAll("span[aria-hidden='true']");
                
                Array.from(allHiddenSpans).forEach(span => {
                    const text = span.innerText.trim();
                    if (text && text.length > 1 && text.length < 80 && !text.includes("Save Details") && !text.includes("Saved!")) {
                        structuredData.push(text);
                    }
                });

                const finalDetails = structuredData.slice(0, 3).join(" | ");

                // ==========================================
                // MEMORY CHECK: Is this already in our bucket?
                // ==========================================
                const isAlreadySaved = bucket.some(savedItem => 
                    savedItem.name === profileName && savedItem.details === finalDetails
                );

                // ==========================================
                // DRAW THE BUTTON
                // ==========================================
                const btnWrapper = document.createElement('div');
                btnWrapper.style.display = 'flex';
                btnWrapper.style.justifyContent = 'flex-start';
                btnWrapper.style.marginTop = '8px';
                btnWrapper.style.marginBottom = '8px';

                const btn = document.createElement('button');
                btn.className = 'bucket-save-btn';
                btn.style.border = 'none';
                btn.style.padding = '6px 12px';
                btn.style.borderRadius = '15px';
                btn.style.fontSize = '12px';
                btn.style.fontWeight = 'bold';
                btn.style.width = 'max-content'; 

                if (isAlreadySaved) {
                    // IF SAVED: Render the green button immediately and disable clicking
                    btn.innerText = '✅ Saved!';
                    btn.style.backgroundColor = '#057642'; 
                    btn.style.color = 'white';
                    btn.style.cursor = 'default';
                    btn.disabled = true; 
                } else {
                    // IF NOT SAVED: Render the normal blue button
                    btn.innerText = '⭐ Save Details';
                    btn.style.backgroundColor = '#0a66c2'; 
                    btn.style.color = 'white';
                    btn.style.cursor = 'pointer';

                    // Attach the click event ONLY if it hasn't been saved yet
                    btn.addEventListener('click', (event) => {
                        event.preventDefault(); 
                        event.stopPropagation();

                        let itemCategory = "Saved Item";
                        const currentUrl = window.location.href.toLowerCase();

                        if (currentUrl.includes("certifications")) itemCategory = "Certification";
                        else if (currentUrl.includes("experience")) itemCategory = "Experience";
                        else if (currentUrl.includes("volunteering")) itemCategory = "Volunteering";
                        else if (currentUrl.includes("projects")) itemCategory = "Project";
                        else if (currentUrl.includes("education")) itemCategory = "Education";
                        else if (currentUrl.includes("skills")) itemCategory = "Skills";

                        else {
                            const parentSection = item.closest('section');
                            if (parentSection) {
                                const heading = parentSection.querySelector('h2');
                                if (heading) {
                                    const headingText = heading.innerText.toLowerCase();
                                    if (headingText.includes("experience")) itemCategory = "Experience";
                                    else if (headingText.includes("certifications")) itemCategory = "Certification";
                                    else if (headingText.includes("volunteering")) itemCategory = "Volunteering";
                                    else if (headingText.includes("projects")) itemCategory = "Project";
                                    else if (headingText.includes("education")) itemCategory = "Education";
                                    else if (headingText.includes("skills")) itemCategory = "Skills";
                                }
                            }
                        }

                        // Fetch the *latest* bucket list right before saving, just in case they saved something else in another tab
                        chrome.storage.local.get(["bucketList"], (latestResult) => {
                            let latestBucket = latestResult.bucketList || [];
                            latestBucket.push({ 
                                name: profileName, 
                                category: itemCategory, 
                                details: finalDetails 
                            });
                            
                            chrome.storage.local.set({ bucketList: latestBucket }, () => {
                                btn.innerText = '✅ Saved!';
                                btn.style.backgroundColor = '#057642'; 
                                btn.style.cursor = 'default';
                                btn.disabled = true; // Prevent double clicking
                            });
                        });
                    });
                }

                btnWrapper.appendChild(btn);
                item.appendChild(btnWrapper);
            }
        });
    });
}

setInterval(injectSaveButtons, 2000);
// API Interaction Logic

const GENERATE_API_URL = "http://128.140.37.194:5000/generate-letter";
const ARCHIVE_API_URL = "http://128.140.37.194:5000/archive-letter";
// Google Sheet API details might be used in sheets.js or here if needed directly
// const GOOGLE_SHEET_ID = "1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk";
// const GOOGLE_API_KEY = "AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A";

document.addEventListener("DOMContentLoaded", () => {
    // --- Elements for create-letter.html ---
    const letterForm = document.getElementById("letterForm");
    const generateBtn = document.getElementById("generateBtn");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const previewSection = document.getElementById("previewSection");
    const generatedLetterTextarea = document.getElementById("generatedLetter");
    const saveAndProceedBtn = document.getElementById("saveAndProceedBtn");
    const templateSelect = document.getElementById("template"); // Tone selection in create-letter

    // --- Elements for review-letter.html ---
    const reviewLetterContent = document.getElementById("reviewLetterContent"); // Assuming textarea ID in review-letter.html
    const reviewRecipient = document.getElementById("reviewRecipient"); // Assuming display element ID
    const reviewTitle = document.getElementById("reviewTitle"); // Assuming display element ID
    const reviewFileInput = document.getElementById("reviewFileInput"); // Assuming file input ID
    const archiveLetterBtn = document.getElementById("archiveLetterBtn"); // Assuming button ID
    const reviewLoadingOverlay = document.getElementById("reviewLoadingOverlay"); // Assuming loading overlay ID

    // Store generated letter data temporarily during creation flow
    let generatedData = null;

    // --- Logic for create-letter.html ---
    if (letterForm) {
        letterForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            console.log("Form submitted");

            if (loadingOverlay) loadingOverlay.style.display = "flex";

            const letterType = document.getElementById("letterType").value;
            const category = document.getElementById("letterCategory").value;
            const sub_category = document.getElementById("letterPurpose").value;
            const firstCorrespondenceRadio = document.querySelector("input[name=\"firstCorrespondence\"]:checked");
            const isFirst = firstCorrespondenceRadio ? (firstCorrespondenceRadio.value === "نعم") : null;
            const recipient = document.getElementById("recipient").value;
            const title = document.getElementById("subject").value;
            const prompt = document.getElementById("content").value;
            const tone = "رسمي"; // Hardcoded as per previous analysis

            if (!letterType || !category || !sub_category || isFirst === null || !recipient || !title || !prompt) {
                alert("يرجى ملء جميع الحقول المطلوبة.");
                if (loadingOverlay) loadingOverlay.style.display = "none";
                return;
            }

            const payload = { category, sub_category, title, recipient, isFirst, prompt, tone };
            console.log("Generate Payload:", JSON.stringify(payload));

            try {
                const response = await fetch(GENERATE_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`خطأ في الشبكة: ${response.status} ${response.statusText}. ${errorText}`);
                }

                const result = await response.json();
                console.log("Generate API Response:", result);

                if (result.generated_letter && result.id) {
                    // Store data needed for the review/archive step
                    generatedData = {
                        id: result.id,
                        letter_content: result.generated_letter, // Initial generated content
                        letter_type: letterType, // User choice: New, Reply etc.
                        recipient: recipient,
                        title: title,
                        is_first: isFirst ? "yes" : "no", // Archive API expects 'yes'/'no'
                    };

                    if (generatedLetterTextarea) {
                        generatedLetterTextarea.value = result.generated_letter;
                    }
                    if (previewSection) {
                        previewSection.style.display = "block";
                        previewSection.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    throw new Error("لم يتم إرجاع بيانات الخطاب أو الرقم المرجعي من الخادم.");
                }

            } catch (error) {
                console.error("Error generating letter:", error);
                alert(`حدث خطأ أثناء إنشاء الخطاب: ${error.message}`);
            } finally {
                if (loadingOverlay) loadingOverlay.style.display = "none";
            }
        });
    }

    // Event listener for "Save and Proceed" button on create-letter.html
    if (saveAndProceedBtn) {
        saveAndProceedBtn.addEventListener("click", () => {
            if (!generatedData) {
                alert("لا توجد بيانات خطاب مولدة للمتابعة.");
                return;
            }
            // Get potentially edited content from the textarea
            const currentLetterContent = generatedLetterTextarea ? generatedLetterTextarea.value : generatedData.letter_content;
            
            // Update the content in our temporary storage
            generatedData.letter_content = currentLetterContent;

            console.log("Proceeding to review. Data:", generatedData);
            
            // Store data in sessionStorage to pass to the review page
            try {
                sessionStorage.setItem("letterForReview", JSON.stringify(generatedData));
                // Redirect to the review page
                window.location.href = "review-letter.html";
            } catch (e) {
                console.error("Error saving data to sessionStorage:", e);
                alert("حدث خطأ أثناء حفظ البيانات للمراجعة. قد تكون مساحة التخزين ممتلئة.");
            }
        });
    }

    // --- Logic for review-letter.html ---
    if (reviewLetterContent) { // Check if we are on the review page by looking for a specific element
        // Load data from sessionStorage
        const dataString = sessionStorage.getItem("letterForReview");
        if (dataString) {
            try {
                const letterData = JSON.parse(dataString);
                console.log("Loaded data for review:", letterData);

                // Populate the review page elements
                reviewLetterContent.value = letterData.letter_content || "";
                if(reviewRecipient) reviewRecipient.textContent = letterData.recipient || ""; // Assuming textContent is appropriate
                if(reviewTitle) reviewTitle.textContent = letterData.title || ""; // Assuming textContent is appropriate
                // TODO: Populate other fields if needed (e.g., letter type, is_first display)

                // Add event listener for the archive button
                if (archiveLetterBtn) {
                    archiveLetterBtn.addEventListener("click", async () => {
                        console.log("Archive button clicked");
                        
                        const fileInput = reviewFileInput;
                        const file = fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;
                        const finalLetterContent = reviewLetterContent.value; // Get potentially edited content

                        // Validate required fields for archive
                        if (!letterData.id || !finalLetterContent || !letterData.letter_type || !letterData.recipient || !letterData.title || !letterData.is_first) {
                            alert("بيانات الخطاب غير كاملة. لا يمكن الأرشفة.");
                            return;
                        }
                        // Note: File might be optional, API behavior unknown if missing.
                        // if (!file) {
                        //     alert("يرجى إرفاق ملف.");
                        //     return;
                        // }

                        if (reviewLoadingOverlay) reviewLoadingOverlay.style.display = "flex";

                        // Construct FormData for the archive API
                        const formData = new FormData();
                        if (file) {
                            formData.append("file", file);
                        }
                        formData.append("letter_content", finalLetterContent);
                        formData.append("letter_type", letterData.letter_type); // e.g., "New", "Reply"
                        formData.append("recipient", letterData.recipient);
                        formData.append("title", letterData.title);
                        formData.append("is_first", letterData.is_first); // "yes" or "no"
                        formData.append("ID", letterData.id);

                        console.log("Archive Payload (FormData):", { ...Object.fromEntries(formData.entries()) }); // Log form data fields

                        // Call Archive API
                        try {
                            const response = await fetch(ARCHIVE_API_URL, {
                                method: "POST",
                                body: formData, // Send FormData directly
                                // 'Content-Type' header is set automatically by browser for FormData
                            });

                            if (!response.ok) {
                                const errorText = await response.text();
                                throw new Error(`خطأ في الشبكة: ${response.status} ${response.statusText}. ${errorText}`);
                            }

                            const result = await response.json(); // Assuming API returns JSON
                            console.log("Archive API Response:", result);

                            alert("تمت أرشفة الخطاب بنجاح!"); // Provide success feedback
                            // Optionally, clear sessionStorage and redirect
                            sessionStorage.removeItem("letterForReview");
                            window.location.href = "letter-records.html"; // Redirect to records page after successful archive

                        } catch (error) {
                            console.error("Error archiving letter:", error);
                            alert(`حدث خطأ أثناء أرشفة الخطاب: ${error.message}`);
                        } finally {
                            if (reviewLoadingOverlay) reviewLoadingOverlay.style.display = "none";
                        }
                    });
                }
            } catch (e) {
                console.error("Error parsing data from sessionStorage:", e);
                alert("حدث خطأ أثناء تحميل بيانات المراجعة.");
                // Optionally redirect back or show an error message
                // window.location.href = "create-letter.html";
            }
        } else {
            console.warn("No letter data found in sessionStorage for review.");
            alert("لم يتم العثور على بيانات للمراجعة. يرجى إنشاء خطاب أولاً.");
            // Redirect back to create page if no data
            window.location.href = "create-letter.html";
        }
    }

    // --- Placeholder for Export Logic (if needed) ---
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", () => {
            alert("سيتم تنفيذ عملية التصدير إلى PDF هنا.");
        });
    }
});


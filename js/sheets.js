// Google Sheets Interaction Logic

document.addEventListener("DOMContentLoaded", () => {
    // Only run this script on the letter-records page
    const recordsTableBody = document.getElementById("recordsTableBody");
    if (!recordsTableBody) {
        return; // Exit if not on the records page
    }

    const GOOGLE_SHEET_ID = "1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk";
    const GOOGLE_API_KEY = "AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A";
    // Assuming data is in the first sheet (Sheet1) and spans columns A to K.
    // Adjust the range if the sheet name or data range is different.
    const SHEET_RANGE = "Sheet1!A:K"; 
    const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/${SHEET_RANGE}?key=${GOOGLE_API_KEY}`;

    const loadingIndicator = document.getElementById("loadingRecords");
    const noRecordsMessage = document.getElementById("noRecords");
    const searchInput = document.getElementById("searchInput");
    const letterTypeFilter = document.getElementById("letterTypeFilter");
    const reviewStatusFilter = document.getElementById("reviewStatusFilter");
    const sendStatusFilter = document.getElementById("sendStatusFilter");
    const refreshBtn = document.getElementById("refreshBtn");

    let allRecords = []; // To store fetched records for filtering

    // Function to get status color class
    function getStatusClass(statusType, statusValue) {
        statusValue = statusValue ? statusValue.trim() : "";
        if (statusType === "review") { // Column J
            if (statusValue === "جاهز للإرسال") return "status-green";
            if (statusValue === "في الانتظار") return "status-orange";
            if (statusValue === "يحتاج إلى تحسينات") return "status-red";
        } else if (statusType === "send") { // Column K
            if (statusValue === "تم الإرسال") return "status-green";
            if (statusValue === "في الانتظار") return "status-orange";
        }
        return ""; // Default no class
    }

    // Function to render table rows
    function renderTable(records) {
        recordsTableBody.innerHTML = ""; // Clear existing rows
        if (records.length === 0) {
            noRecordsMessage.style.display = "block";
            return;
        }
        noRecordsMessage.style.display = "none";

        records.forEach(record => {
            // Assuming the first row is headers, skip it if present in data
            // The API usually returns only values, but check length just in case
            if (record.length < 11) return; // Ensure row has enough columns (A=0 to K=10)

            const refNum = record[0] || "";      // Column A
            const date = record[1] || "";        // Column B
            const letterType = record[3] || "";  // Column D
            const recipient = record[4] || "";   // Column E
            const subject = record[5] || "";     // Column F
            const reviewStatus = record[9] || ""; // Column J
            const sendStatus = record[10] || ""; // Column K

            const reviewStatusClass = getStatusClass("review", reviewStatus);
            const sendStatusClass = getStatusClass("send", sendStatus);

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${refNum}</td>
                <td>${date}</td>
                <td>${letterType}</td>
                <td>${subject}</td>
                <td><span class="status-badge ${sendStatusClass}">${sendStatus}</span></td>
                <td>${recipient}</td>
                <td><span class="status-badge ${reviewStatusClass}">${reviewStatus}</span></td>
                <td>
                    <button class="btn btn-sm btn-info" title="عرض التفاصيل" data-id="${refNum}"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-warning" title="تعديل" data-id="${refNum}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" title="حذف" data-id="${refNum}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            recordsTableBody.appendChild(row);
        });
        
        // Add event listeners for action buttons (example)
        recordsTableBody.querySelectorAll(".btn-info").forEach(btn => btn.addEventListener("click", () => alert(`عرض تفاصيل: ${btn.dataset.id}`)));
        recordsTableBody.querySelectorAll(".btn-warning").forEach(btn => btn.addEventListener("click", () => alert(`تعديل: ${btn.dataset.id}`)));
        recordsTableBody.querySelectorAll(".btn-danger").forEach(btn => btn.addEventListener("click", () => alert(`حذف: ${btn.dataset.id}`)));
    }

    // Function to fetch data from Google Sheets
    async function fetchSheetData() {
        loadingIndicator.style.display = "block";
        noRecordsMessage.style.display = "none";
        recordsTableBody.innerHTML = ""; // Clear table while loading

        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`خطأ في الشبكة: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            console.log("Google Sheet API Response:", data);

            if (data.values && data.values.length > 1) {
                // Skip header row (index 0)
                allRecords = data.values.slice(1);
                applyFilters(); // Apply initial filters (which might be none)
            } else {
                allRecords = [];
                renderTable([]); // Render empty table / show no records message
            }
        } catch (error) {
            console.error("Error fetching Google Sheet data:", error);
            alert(`حدث خطأ أثناء تحميل السجلات: ${error.message}`);
            allRecords = [];
            renderTable([]); // Render empty table
        } finally {
            loadingIndicator.style.display = "none";
        }
    }

    // Function to apply filters and search
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = letterTypeFilter.value;
        const selectedReviewStatus = reviewStatusFilter.value;
        const selectedSendStatus = sendStatusFilter.value;

        const filteredRecords = allRecords.filter(record => {
            if (record.length < 11) return false; // Skip incomplete rows

            const refNum = (record[0] || "").toLowerCase();
            const recipient = (record[4] || "").toLowerCase(); // Column E
            const letterType = record[3] || "";          // Column D
            const reviewStatus = record[9] || "";         // Column J
            const sendStatus = record[10] || "";         // Column K

            // Search condition (Reference Number or Recipient)
            const searchMatch = searchTerm === "" || refNum.includes(searchTerm) || recipient.includes(searchTerm);
            
            // Filter conditions
            const typeMatch = selectedType === "" || letterType === selectedType;
            const reviewMatch = selectedReviewStatus === "" || reviewStatus === selectedReviewStatus;
            const sendMatch = selectedSendStatus === "" || sendStatus === selectedSendStatus;

            return searchMatch && typeMatch && reviewMatch && sendMatch;
        });

        renderTable(filteredRecords);
    }

    // Add event listeners for filters and search
    searchInput.addEventListener("input", applyFilters);
    letterTypeFilter.addEventListener("change", applyFilters);
    reviewStatusFilter.addEventListener("change", applyFilters);
    sendStatusFilter.addEventListener("change", applyFilters);
    refreshBtn.addEventListener("click", fetchSheetData);

    // Initial data fetch on page load
    fetchSheetData();
});


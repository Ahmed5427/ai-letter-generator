// Global Variables
let currentLetterId = null;
let isGenerating = false;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger?.classList.remove('active');
            navMenu?.classList.remove('active');
        });
    });

    // Initialize page-specific functionality
    const currentPage = getCurrentPage();
    
    switch(currentPage) {
        case 'create-letter':
            initializeCreateLetter();
            break;
        case 'review-letter':
            initializeReviewLetter();
            break;
        case 'letter-records':
            initializeLetterRecords();
            break;
        default:
            initializeHomePage();
    }
}

// Get current page
function getCurrentPage() {
    const path = window.location.pathname;
    if (path.includes('create-letter')) return 'create-letter';
    if (path.includes('review-letter')) return 'review-letter';
    if (path.includes('letter-records')) return 'letter-records';
    return 'home';
}

// Initialize Home Page
function initializeHomePage() {
    // Add any home page specific functionality here
    console.log('Home page initialized');
}

// Initialize Create Letter Page
function initializeCreateLetter() {
    const letterForm = document.getElementById('letterForm');
    const generateBtn = document.getElementById('generateBtn');
    const saveAndProceedBtn = document.getElementById('saveAndProceedBtn');
    const exportBtn = document.getElementById('exportBtn');
    const previewSection = document.getElementById('previewSection');
    
    if (letterForm) {
        letterForm.addEventListener('submit', handleLetterGeneration);
    }
    
    if (saveAndProceedBtn) {
        saveAndProceedBtn.addEventListener('click', handleSaveAndProceed);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', handleExportPDF);
    }

    // Load dropdown options from Google Sheets
    loadDropdownOptions();
}

// Handle Letter Generation
async function handleLetterGeneration(e) {
    e.preventDefault();
    
    if (isGenerating) return;
    
    const formData = getFormData();
    if (!validateFormData(formData)) {
        showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    isGenerating = true;
    showLoadingOverlay(true);
    updateGenerateButton(true);
    
    try {
        const response = await generateLetterAPI(formData);
        displayGeneratedLetter(response.generatedText);
        showPreviewSection();
    } catch (error) {
        console.error('Error generating letter:', error);
        showAlert('حدث خطأ أثناء إنشاء الخطاب. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        isGenerating = false;
        showLoadingOverlay(false);
        updateGenerateButton(false);
    }
}

// Get Form Data
function getFormData() {
    return {
        letterType: document.getElementById('letterType')?.value || '',
        letterCategory: document.getElementById('letterCategory')?.value || '',
        letterPurpose: document.getElementById('letterPurpose')?.value || '',
        firstCorrespondence: document.querySelector('input[name="firstCorrespondence"]:checked')?.value || '',
        recipient: document.getElementById('recipient')?.value || '',
        subject: document.getElementById('subject')?.value || '',
        content: document.getElementById('content')?.value || ''
    };
}

// Validate Form Data
function validateFormData(data) {
    const required = ['letterType', 'letterCategory', 'letterPurpose', 'firstCorrespondence', 'recipient', 'subject', 'content'];
    return required.every(field => data[field] && data[field].trim() !== '');
}

// Display Generated Letter
function displayGeneratedLetter(text) {
    const textarea = document.getElementById('generatedLetter');
    if (textarea) {
        textarea.value = text;
        textarea.classList.add('fade-in');
    }
}

// Show Preview Section
function showPreviewSection() {
    const previewSection = document.getElementById('previewSection');
    if (previewSection) {
        previewSection.style.display = 'block';
        previewSection.classList.add('slide-up');
        previewSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle Save and Proceed
async function handleSaveAndProceed() {
    const generatedLetter = document.getElementById('generatedLetter')?.value;
    const template = document.getElementById('template')?.value;
    
    if (!generatedLetter) {
        showAlert('لا يوجد خطاب لحفظه', 'error');
        return;
    }
    
    if (!template) {
        showAlert('يرجى اختيار قالب', 'error');
        return;
    }
    
    try {
        showLoadingOverlay(true);
        
        // Generate PDF and get letter ID
        const response = await createPDFAPI({
            content: generatedLetter,
            template: template,
            ...getFormData()
        });
        
        currentLetterId = response.letterId;
        
        // Show export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.style.display = 'inline-flex';
            exportBtn.classList.add('fade-in');
        }
        
        // Save to Google Sheets
        await saveToGoogleSheets({
            ...getFormData(),
            generatedContent: generatedLetter,
            template: template,
            letterId: currentLetterId,
            date: new Date().toLocaleDateString('ar-SA')
        });
        
        showAlert('تم حفظ الخطاب بنجاح', 'success');
        
        // Redirect to review page after a delay
        setTimeout(() => {
            window.location.href = `review-letter.html?id=${currentLetterId}`;
        }, 2000);
        
    } catch (error) {
        console.error('Error saving letter:', error);
        showAlert('حدث خطأ أثناء حفظ الخطاب', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

// Handle Export PDF
function handleExportPDF() {
    if (currentLetterId) {
        const downloadUrl = `${API_BASE_URL}/download-pdf/${currentLetterId}`;
        window.open(downloadUrl, '_blank');
    } else {
        showAlert('لا يوجد خطاب للتحميل', 'error');
    }
}

// Initialize Review Letter Page
function initializeReviewLetter() {
    const reviewForm = document.getElementById('reviewForm');
    const reviewCompleted = document.getElementById('reviewCompleted');
    const proceedBtn = document.getElementById('proceedBtn');
    
    if (reviewCompleted && proceedBtn) {
        reviewCompleted.addEventListener('change', function() {
            proceedBtn.disabled = !this.checked;
        });
    }
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
    
    // Load letter data if ID is provided
    const urlParams = new URLSearchParams(window.location.search);
    const letterId = urlParams.get('id');
    if (letterId) {
        loadLetterForReview(letterId);
    }
}

// Load Letter for Review
async function loadLetterForReview(letterId) {
    try {
        const letterData = await getLetterByIdAPI(letterId);
        const textarea = document.getElementById('letterToReview');
        if (textarea && letterData) {
            textarea.value = letterData.content;
        }
    } catch (error) {
        console.error('Error loading letter for review:', error);
        showAlert('حدث خطأ أثناء تحميل الخطاب للمراجعة', 'error');
    }
}

// Handle Review Submit
function handleReviewSubmit(e) {
    e.preventDefault();
    
    const reviewerName = document.getElementById('reviewerName')?.value;
    const reviewCompleted = document.getElementById('reviewCompleted')?.checked;
    
    if (!reviewerName) {
        showAlert('يرجى إدخال اسم المراجع', 'error');
        return;
    }
    
    if (!reviewCompleted) {
        showAlert('يرجى تأكيد إتمام المراجعة', 'error');
        return;
    }
    
    // Save review data
    saveReviewData({
        reviewerName: reviewerName,
        letterId: currentLetterId,
        reviewDate: new Date().toISOString(),
        reviewed: true
    });
    
    showAlert('تمت المراجعة بنجاح', 'success');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 2000);
}

// Initialize Letter Records Page
function initializeLetterRecords() {
    const searchInput = document.getElementById('searchInput');
    const letterTypeFilter = document.getElementById('letterTypeFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (letterTypeFilter) {
        letterTypeFilter.addEventListener('change', handleFilterChange);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadLetterRecords);
    }
    
    // Load initial records
    loadLetterRecords();
    
    // Initialize modal
    initializeModal();
}

// Load Letter Records
async function loadLetterRecords() {
    const loadingRecords = document.getElementById('loadingRecords');
    const recordsTableBody = document.getElementById('recordsTableBody');
    const noRecords = document.getElementById('noRecords');
    
    if (loadingRecords) loadingRecords.style.display = 'block';
    if (noRecords) noRecords.style.display = 'none';
    
    try {
        const records = await getLetterRecordsAPI();
        displayRecords(records);
    } catch (error) {
        console.error('Error loading records:', error);
        showAlert('حدث خطأ أثناء تحميل السجلات', 'error');
        
        if (recordsTableBody) recordsTableBody.innerHTML = '';
        if (noRecords) noRecords.style.display = 'block';
    } finally {
        if (loadingRecords) loadingRecords.style.display = 'none';
    }
}

// Display Records
function displayRecords(records) {
    const recordsTableBody = document.getElementById('recordsTableBody');
    const noRecords = document.getElementById('noRecords');
    
    if (!recordsTableBody) return;
    
    if (!records || records.length === 0) {
        recordsTableBody.innerHTML = '';
        if (noRecords) noRecords.style.display = 'block';
        return;
    }
    
    if (noRecords) noRecords.style.display = 'none';
    
    recordsTableBody.innerHTML = records.map(record => `
        <tr>
            <td>${record.id || 'غير محدد'}</td>
            <td>${record.date || 'غير محدد'}</td>
            <td>${translateLetterType(record.type) || 'غير محدد'}</td>
            <td>${record.recipient || 'غير محدد'}</td>
            <td>${record.subject || 'غير محدد'}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn delete" onclick="handleDeleteRecord('${record.id}')">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                    <button class="action-btn print" onclick="handlePrintRecord('${record.id}')">
                        <i class="fas fa-print"></i> طباعة
                    </button>
                    <button class="action-btn download" onclick="handleDownloadRecord('${record.id}')">
                        <i class="fas fa-download"></i> تحميل
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Translate Letter Type
function translateLetterType(type) {
    const translations = {
        'New': 'جديد',
        'Reply': 'رد',
        'Follow Up': 'متابعة',
        'Co-op': 'تعاون',
        'جديد': 'جديد',
        'رد': 'رد',
        'متابعة': 'متابعة',
        'تعاون': 'تعاون'
    };
    return translations[type] || type;
}

// Handle Search
function handleSearch() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    const filterType = document.getElementById('letterTypeFilter')?.value;
    filterRecords(searchTerm, filterType);
}

// Handle Filter Change
function handleFilterChange() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    const filterType = document.getElementById('letterTypeFilter')?.value;
    filterRecords(searchTerm, filterType);
}

// Filter Records
function filterRecords(searchTerm, filterType) {
    const rows = document.querySelectorAll('#recordsTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const id = cells[0]?.textContent.toLowerCase() || '';
        const recipient = cells[3]?.textContent.toLowerCase() || '';
        const type = cells[2]?.textContent || '';
        
        const matchesSearch = !searchTerm || id.includes(searchTerm) || recipient.includes(searchTerm);
        const matchesFilter = !filterType || type === filterType;
        
        if (matchesSearch && matchesFilter) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    const noRecords = document.getElementById('noRecords');
    if (noRecords) {
        noRecords.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

// Record Action Handlers
function handleDeleteRecord(recordId) {
    showConfirmModal(
        'تأكيد الحذف',
        'هل أنت متأكد من حذف هذا الخطاب؟ لا يمكن التراجع عن هذا الإجراء.',
        () => deleteRecord(recordId)
    );
}

function handlePrintRecord(recordId) {
    printRecord(recordId);
}

function handleDownloadRecord(recordId) {
    downloadRecord(recordId);
}

// Delete Record
async function deleteRecord(recordId) {
    try {
        showLoadingOverlay(true);
        await deleteRecordAPI(recordId);
        showAlert('تم حذف الخطاب بنجاح', 'success');
        loadLetterRecords(); // Reload records
    } catch (error) {
        console.error('Error deleting record:', error);
        showAlert('حدث خطأ أثناء حذف الخطاب', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

// Print Record
function printRecord(recordId) {
    const printUrl = `${API_BASE_URL}/print/${recordId}`;
    window.open(printUrl, '_blank');
}

// Download Record
function downloadRecord(recordId) {
    const downloadUrl = `${API_BASE_URL}/download-pdf/${recordId}`;
    window.open(downloadUrl, '_blank');
}

// Modal Functions
function initializeModal() {
    const modal = document.getElementById('actionModal');
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideModal();
            }
        });
    }
}

function showConfirmModal(title, message, confirmCallback) {
    const modal = document.getElementById('actionModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (!modal) return;
    
    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    
    // Remove previous event listeners
    const newConfirmBtn = confirmBtn?.cloneNode(true);
    if (confirmBtn && newConfirmBtn) {
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => {
            confirmCallback();
            hideModal();
        });
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    const modal = document.getElementById('actionModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Utility Functions
function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function updateGenerateButton(loading) {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.disabled = loading;
        generateBtn.innerHTML = loading 
            ? '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...'
            : '<i class="fas fa-magic"></i> إنشاء الخطاب';
    }
}

function showAlert(message, type = 'info') {
    // Create alert element if it doesn't exist
    let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            max-width: 400px;
        `;
        document.body.appendChild(alertContainer);
    }
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.style.cssText = `
        background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    alertElement.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <i class="fas fa-times" style="margin-right: auto; cursor: pointer;" onclick="this.parentElement.remove()"></i>
    `;
    
    alertContainer.appendChild(alertElement);
    
    // Animate in
    setTimeout(() => {
        alertElement.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.style.transform = 'translateX(100%)';
            setTimeout(() => alertElement.remove(), 300);
        }
    }, 5000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load Dropdown Options
async function loadDropdownOptions() {
    try {
        const options = await getDropdownOptionsAPI();
        populateDropdowns(options);
    } catch (error) {
        console.error('Error loading dropdown options:', error);
        // Use default options if API fails
        useDefaultDropdownOptions();
    }
}

function populateDropdowns(options) {
    // Populate dropdowns with data from Google Sheets
    if (options.letterTypes) {
        populateSelect('letterType', options.letterTypes);
    }
    if (options.letterCategories) {
        populateSelect('letterCategory', options.letterCategories);
    }
    if (options.letterPurposes) {
        populateSelect('letterPurpose', options.letterPurposes);
    }
    if (options.templates) {
        populateSelect('template', options.templates);
    }
}

function populateSelect(selectId, options) {
    const select = document.getElementById(selectId);
    if (!select || !options) return;
    
    // Keep the first option (placeholder)
    const firstOption = select.options[0];
    select.innerHTML = '';
    select.appendChild(firstOption);
    
    // Add new options
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

function useDefaultDropdownOptions() {
    // Fallback to hardcoded options if Google Sheets fails
    console.log('Using default dropdown options');
}

// Save Review Data
function saveReviewData(reviewData) {
    // Save review data to localStorage or send to API
    try {
        localStorage.setItem(`review_${reviewData.letterId}`, JSON.stringify(reviewData));
    } catch (error) {
        console.error('Error saving review data:', error);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeApp);

// Handle page navigation
window.addEventListener('popstate', function(event) {
    initializeApp();
});

// Export functions for global access
window.handleDeleteRecord = handleDeleteRecord;
window.handlePrintRecord = handlePrintRecord;
window.handleDownloadRecord = handleDownloadRecord;
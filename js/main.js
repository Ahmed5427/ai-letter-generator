// Global Variables
let currentLetterId = null;
let isGenerating = false;
let themeManager;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Initialize theme manager first
    themeManager = new ThemeManager();
    
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
    const approveBtn = document.getElementById('approveBtn');
    const needsImprovementBtn = document.getElementById('needsImprovementBtn');
    
    if (reviewCompleted && proceedBtn) {
        reviewCompleted.addEventListener('change', function() {
            proceedBtn.disabled = !this.checked;
        });
    }
    
    if (approveBtn) {
        approveBtn.addEventListener('click', handleApproveReview);
    }
    
    if (needsImprovementBtn) {
        needsImprovementBtn.addEventListener('click', handleNeedsImprovement);
    }
    
    if (reviewForm) {
        reviewForm.addEventListener('submit', handleReviewSubmit);
    }
    
    // Load letter data if ID is provided
    const urlParams = new URLSearchParams(window.location.search);
    const letterId = urlParams.get('id');
    if (letterId) {
        loadLetterForReview(letterId);
        const letterIdDisplay = document.getElementById('letterIdDisplay');
        if (letterIdDisplay) {
            letterIdDisplay.textContent = `رقم الخطاب: ${letterId}`;
        }
    } else {
        showAlert('لم يتم تمرير رقم الخطاب. يرجى العودة لصفحة السجلات واختيار خطاب للمراجعة.', 'error');
        setTimeout(() => {
            window.location.href = 'letter-records.html';
        }, 3000);
    }
}

// Load Letter for Review
async function loadLetterForReview(letterId) {
    try {
        showLoadingOverlay(true);
        
        // Get letter data from Google Sheets
        const records = await getLetterRecordsAPI();
        const letterData = records.find(record => record.id === letterId);
        
        if (letterData) {
            const textarea = document.getElementById('letterToReview');
            if (textarea) {
                textarea.value = letterData.content || 'لا يوجد محتوى متاح للخطاب';
            }
        } else {
            showAlert('لم يتم العثور على الخطاب المطلوب', 'error');
            const textarea = document.getElementById('letterToReview');
            if (textarea) {
                textarea.value = 'لم يتم العثور على الخطاب المطلوب.';
            }
        }
    } catch (error) {
        console.error('Error loading letter for review:', error);
        showAlert('حدث خطأ أثناء تحميل الخطاب للمراجعة', 'error');
        
        // Fallback - show placeholder content
        const textarea = document.getElementById('letterToReview');
        if (textarea) {
            textarea.value = 'حدث خطأ أثناء تحميل محتوى الخطاب. يرجى المحاولة مرة أخرى.';
        }
    } finally {
        showLoadingOverlay(false);
    }
}

// Handle Approve Review
function handleApproveReview() {
    const letterId = new URLSearchParams(window.location.search).get('id');
    const reviewerName = document.getElementById('reviewerName')?.value;
    const notes = document.getElementById('reviewNotes')?.value || '';
    
    if (!reviewerName) {
        showAlert('يرجى إدخال اسم المراجع', 'error');
        return;
    }
    
    updateReviewStatus(letterId, 'تمت المراجعة', reviewerName, notes);
}

// Handle Needs Improvement
function handleNeedsImprovement() {
    const letterId = new URLSearchParams(window.location.search).get('id');
    const reviewerName = document.getElementById('reviewerName')?.value;
    const notes = document.getElementById('reviewNotes')?.value;
    
    if (!reviewerName) {
        showAlert('يرجى إدخال اسم المراجع', 'error');
        return;
    }
    
    if (!notes || notes.trim() === '') {
        showAlert('يرجى إضافة ملاحظات عند اختيار "يحتاج إلى تحسينات"', 'error');
        return;
    }
    
    updateReviewStatus(letterId, 'يحتاج إلى تحسينات', reviewerName, notes);
}

// Update Review Status
async function updateReviewStatus(letterId, status, reviewerName, notes) {
    try {
        showLoadingOverlay(true);
        
        // Save review data
        const reviewData = {
            letterId: letterId,
            status: status,
            reviewer: reviewerName,
            notes: notes,
            reviewDate: new Date().toISOString()
        };
        
        // For now, save to localStorage (in production, update Google Sheets)
        localStorage.setItem(`review_${letterId}`, JSON.stringify(reviewData));
        
        showAlert(`تم تحديث حالة المراجعة إلى: ${status}`, 'success');
        
        // Redirect back to records page after 2 seconds
        setTimeout(() => {
            window.location.href = 'letter-records.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error updating review status:', error);
        showAlert('حدث خطأ أثناء تحديث حالة المراجعة', 'error');
    } finally {
        showLoadingOverlay(false);
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
    
    showAlert('تمت المراجعة بنجاح', 'success');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'letter-records.html';
    }, 2000);
}

// Initialize Letter Records Page
function initializeLetterRecords() {
    const searchInput = document.getElementById('searchInput');
    const letterTypeFilter = document.getElementById('letterTypeFilter');
    const reviewStatusFilter = document.getElementById('reviewStatusFilter');
    const sendStatusFilter = document.getElementById('sendStatusFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    if (letterTypeFilter) {
        letterTypeFilter.addEventListener('change', handleFilterChange);
    }
    
    if (reviewStatusFilter) {
        reviewStatusFilter.addEventListener('change', handleFilterChange);
    }
    
    if (sendStatusFilter) {
        sendStatusFilter.addEventListener('change', handleFilterChange);
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
            <td>${record.subject || 'غير محدد'}</td>
            <td>${createSendStatusBadge(record.sendStatus)}</td>
            <td>${record.recipient || 'غير محدد'}</td>
            <td>${createReviewStatusBadge(record.reviewStatus)}</td>
                        <td>
                <div class="action-buttons">
                    <button class="action-btn review" onclick="handleReviewRecord('${record.id}')" title="مراجعة">
                        <i class="fas fa-eye"></i>
                        <span class="btn-text">مراجعة</span>
                    </button>
                    <button class="action-btn download" onclick="handleDownloadRecord('${record.id}', '${record.pdfUrl || ''}')" title="تحميل">
                        <i class="fas fa-download"></i>
                        <span class="btn-text">تحميل</span>
                    </button>
                    <button class="action-btn print" onclick="handlePrintRecord('${record.id}')" title="طباعة">
                        <i class="fas fa-print"></i>
                        <span class="btn-text">طباعة</span>
                    </button>
                    <button class="action-btn delete" onclick="handleDeleteRecord('${record.id}')" title="حذف">
                        <i class="fas fa-trash"></i>
                        <span class="btn-text">حذف</span>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Create Review Status Badge
function createReviewStatusBadge(status) {
    if (!status) status = 'في الانتظار';
    
    let badgeClass = '';
    switch(status) {
        case 'تمت المراجعة':
            badgeClass = 'review-completed';
            break;
        case 'يحتاج إلى تحسينات':
            badgeClass = 'review-needs-improvement';
            break;
        default:
            badgeClass = 'review-pending';
            status = 'في الانتظار';
    }
    
    return `<span class="status-badge ${badgeClass}">${status}</span>`;
}

// Create Send Status Badge
function createSendStatusBadge(status) {
    if (!status) status = 'في الانتظار';
    
    let badgeClass = '';
    switch(status) {
        case 'تم الإرسال':
            badgeClass = 'send-completed';
            break;
        default:
            badgeClass = 'send-pending';
            status = 'في الانتظار';
    }
    
    return `<span class="status-badge ${badgeClass}">${status}</span>`;
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
    const reviewStatusFilter = document.getElementById('reviewStatusFilter')?.value;
    const sendStatusFilter = document.getElementById('sendStatusFilter')?.value;
    filterRecords(searchTerm, filterType, reviewStatusFilter, sendStatusFilter);
}

// Handle Filter Change
function handleFilterChange() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    const filterType = document.getElementById('letterTypeFilter')?.value;
    const reviewStatusFilter = document.getElementById('reviewStatusFilter')?.value;
    const sendStatusFilter = document.getElementById('sendStatusFilter')?.value;
    filterRecords(searchTerm, filterType, reviewStatusFilter, sendStatusFilter);
}

// Filter Records
function filterRecords(searchTerm, filterType, reviewStatus, sendStatus) {
    const rows = document.querySelectorAll('#recordsTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const id = cells[0]?.textContent.toLowerCase() || '';
        const type = cells[2]?.textContent || '';
        const recipient = cells[5]?.textContent.toLowerCase() || '';
        const currentReviewStatus = cells[6]?.textContent.trim() || '';
        const currentSendStatus = cells[4]?.textContent.trim() || '';
        
        const matchesSearch = !searchTerm || id.includes(searchTerm) || recipient.includes(searchTerm);
        const matchesType = !filterType || type === filterType;
        const matchesReviewStatus = !reviewStatus || currentReviewStatus === reviewStatus;
        const matchesSendStatus = !sendStatus || currentSendStatus === sendStatus;
        
        if (matchesSearch && matchesType && matchesReviewStatus && matchesSendStatus) {
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
function handleReviewRecord(recordId) {
    if (!recordId || recordId === 'undefined') {
        showAlert('خطأ: لم يتم العثور على رقم الخطاب', 'error');
        return;
    }
    
    // Navigate to review page with the record ID
    window.location.href = `review-letter.html?id=${encodeURIComponent(recordId)}`;
}

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

function handleDownloadRecord(recordId, pdfUrl) {
    if (pdfUrl && pdfUrl !== '') {
        // Direct download from URL stored in column L
        window.open(pdfUrl, '_blank');
    } else {
        // Fallback to API download
        const downloadUrl = `${API_BASE_URL}/download-pdf/${recordId}`;
        window.open(downloadUrl, '_blank');
    }
}

// Delete Record
async function deleteRecord(recordId) {
    try {
        showLoadingOverlay(true);
        
        // For demo purposes, we'll remove from localStorage and UI
        // In production, you'd call deleteRecordFromSheetsAPI(recordId)
        
        // Remove from any local storage
        localStorage.removeItem(`review_${recordId}`);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showAlert('تم حذف الخطاب بنجاح', 'success');
        
        // Remove the row from the table
        const rows = document.querySelectorAll('#recordsTableBody tr');
        rows.forEach(row => {
            const firstCell = row.querySelector('td');
            if (firstCell && firstCell.textContent.trim() === recordId) {
                row.remove();
            }
        });
        
        // Check if table is empty
        const remainingRows = document.querySelectorAll('#recordsTableBody tr');
        if (remainingRows.length === 0) {
            const noRecords = document.getElementById('noRecords');
            if (noRecords) {
                noRecords.style.display = 'block';
            }
        }
        
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
    
    // Get current theme for appropriate colors
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const colors = {
        success: isDark ? '#2E7D32' : '#4CAF50',
        error: isDark ? '#D32F2F' : '#f44336',
        info: isDark ? '#1976D2' : '#2196F3'
    };
    
    alertElement.style.cssText = `
        background-color: ${colors[type] || colors.info};
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

// Theme Management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || this.detectSystemTheme();
        this.themeToggle = null;
        this.themeIcon = null;
        this.init();
    }

    init() {
        // Apply saved theme
        this.applyTheme(this.currentTheme);
        
        // Initialize theme toggle button
        this.initThemeToggle();
        
        // Listen for system theme changes
        this.listenForSystemThemeChanges();
    }

    detectSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    initThemeToggle() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        
        if (this.themeToggle) {
            // Mouse click
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
            
            // Keyboard support
            this.themeToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleTheme();
                }
            });
            
            // Make focusable
            this.themeToggle.setAttribute('tabindex', '0');
            this.themeToggle.setAttribute('role', 'button');
            this.themeToggle.setAttribute('aria-label', 'تغيير المظهر');
            
            this.updateThemeIcon();
        }
    }

    listenForSystemThemeChanges() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem('theme')) {
                    // Only auto-switch if user hasn't manually set a preference
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                    this.updateThemeIcon();
                }
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.currentTheme);
        this.updateThemeIcon();
        
        // Save to localStorage
        localStorage.setItem('theme', this.currentTheme);
        
        // Add animation effect
        this.animateToggle();
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
    }

    updateThemeIcon() {
        if (this.themeIcon) {
            if (this.currentTheme === 'dark') {
                this.themeIcon.className = 'fas fa-sun';
                this.themeToggle.title = 'تغيير إلى المظهر الفاتح';
            } else {
                this.themeIcon.className = 'fas fa-moon';
                this.themeToggle.title = 'تغيير إلى المظهر الداكن';
            }
        }
    }

        animateToggle() {
        if (this.themeToggle) {
            this.themeToggle.style.transform = 'scale(0.8)';
            setTimeout(() => {
                this.themeToggle.style.transform = 'scale(1)';
            }, 150);
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Theme Persistence and Auto-Detection
function initializeThemeSystem() {
    // Check if user has a saved preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
        // Use saved preference
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        // Auto-detect system preference
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        localStorage.setItem('theme', systemTheme);
    }
}

// Call this before DOMContentLoaded to prevent flash
initializeThemeSystem();

// Handle page navigation
window.addEventListener('popstate', function(event) {
    initializeApp();
});

// Export functions for global access
window.handleDeleteRecord = handleDeleteRecord;
window.handlePrintRecord = handlePrintRecord;
window.handleDownloadRecord = handleDownloadRecord;
window.handleReviewRecord = handleReviewRecord;

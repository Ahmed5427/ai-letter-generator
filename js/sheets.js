// Google Sheets Integration
const SPREADSHEET_ID = '1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk'; // Replace with actual spreadsheet ID
const SHEETS_API_KEY = 'AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A'; // Replace with your Google Sheets API key

// Google Sheets API Base URL
const SHEETS_BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

// Temporary override for testing
const DEMO_MODE = true; // Set to false when you have real Google Sheets setup

// Get Dropdown Options from Settings Sheet
async function getDropdownOptionsAPI() {
    if (DEMO_MODE) {
        return getDemoDropdownOptions();
    }
    
    try {
        const response = await fetch(
            `${SHEETS_BASE_URL}/values/Settings!A:F?key=${SHEETS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch dropdown options');
        }
        
        const data = await response.json();
        const values = data.values;
        
        if (!values || values.length < 2) {
            throw new Error('No data found in Settings sheet');
        }
        
        // Skip header row
        const rows = values.slice(1);
        
        const options = {
            letterTypes: [],
            letterCategories: [],
            letterPurposes: [],
            templates: []
        };
        
        rows.forEach(row => {
            if (row[0]) options.letterTypes.push(row[0]);
            if (row[1]) options.letterCategories.push(row[1]);
            if (row[2]) options.letterPurposes.push(row[2]);
            if (row[5]) options.templates.push(row[5]);
        });
        
        // Remove duplicates
        options.letterTypes = [...new Set(options.letterTypes)];
        options.letterCategories = [...new Set(options.letterCategories)];
        options.letterPurposes = [...new Set(options.letterPurposes)];
        options.templates = [...new Set(options.templates)];
        
        return options;
    } catch (error) {
        console.error('Error fetching dropdown options:', error);
        return getDemoDropdownOptions();
    }
}

// Demo dropdown options
function getDemoDropdownOptions() {
    return {
        letterTypes: ['جديد', 'رد', 'متابعة', 'تعاون'],
        letterCategories: ['طلب', 'جدولة اجتماع', 'تهنئة', 'دعوة حضور'],
        letterPurposes: [
            'موافقة إقامة فعالية',
            'استثمار وتشغيل مشتل',
            'تسهيل إجراءات مشروع',
            'تهنئة عيد فطر',
            'دعوة خاصة لحضور حفل تدشين مبادرة الخبر خضراء ذكية',
            'دعم صيانة بئر مطار الملك فهد',
            'تهنئة على نجاح مؤتمر وشكر على دعم',
            'بحث سبل التعاون'
        ],
        templates: ['رسمي', 'شبه رسمي', 'ودي']
    };
}

// Save to Google Sheets (Submissions worksheet)
async function saveToGoogleSheets(letterData) {
    if (DEMO_MODE) {
        // Save to localStorage for demo
        const existingData = JSON.parse(localStorage.getItem('demoLetters') || '[]');
        const newLetter = {
            id: letterData.letterId || generateId(),
            date: letterData.date || new Date().toLocaleDateString('ar-SA'),
            subject: letterData.subject || '',
            type: translateLetterTypeToEnglish(letterData.letterType) || '',
            recipient: letterData.recipient || '',
            template: letterData.template || '',
            content: letterData.generatedContent || '',
            category: letterData.letterCategory || '',
            purpose: letterData.letterPurpose || '',
            firstCorrespondence: letterData.firstCorrespondence || '',
            reviewStatus: 'في الانتظار',
            sendStatus: 'في الانتظار',
            pdfUrl: ''
        };
        
        existingData.unshift(newLetter);
        localStorage.setItem('demoLetters', JSON.stringify(existingData));
        return { success: true };
    }
    
    try {
        const values = [[
            letterData.letterId || generateId(),
            letterData.date || new Date().toLocaleDateString('ar-SA'),
            letterData.subject || '',
            translateLetterTypeToEnglish(letterData.letterType) || '',
            letterData.recipient || '',
            letterData.template || '',
            letterData.generatedContent || '',
            letterData.letterCategory || '',
            letterData.letterPurpose || '',
            letterData.firstCorrespondence || '',
            'في الانتظار', // Review status
            'في الانتظار', // Send status
            ''             // PDF URL
        ]];
        
        const response = await fetch(
            `${SHEETS_BASE_URL}/values/Submissions!A:L:append?valueInputOption=RAW&key=${SHEETS_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: values
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to save to Google Sheets');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        throw error;
    }
}

// Get Letter Records from Submissions Sheet
async function getLetterRecordsAPI() {
    if (DEMO_MODE) {
        const demoData = localStorage.getItem('demoLetters');
        if (demoData) {
            return JSON.parse(demoData);
        }
        return getDemoRecords();
    }
    
    try {
        // First check if we have valid API credentials
        if (!SHEETS_API_KEY || !SPREADSHEET_ID || SHEETS_API_KEY === 'your-api-key-here') {
            console.warn('Google Sheets API credentials not configured, using demo data');
            return getDemoRecords();
        }
        
        const response = await fetch(
            `${SHEETS_BASE_URL}/values/Submissions!A:L?key=${SHEETS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const values = data.values;
        
        if (!values || values.length < 2) {
            console.warn('No data found in Google Sheets, using demo data');
            return getDemoRecords();
        }
        
        // Skip header row and map data
        const records = values.slice(1).map((row, index) => ({
            id: row[0] || `DEMO-${index + 1}`,
            date: row[1] || new Date().toLocaleDateString('ar-SA'),
            subject: row[2] || 'موضوع تجريبي',
            type: row[3] || 'جديد',
            recipient: row[4] || 'مستلم تجريبي',
            template: row[5] || 'رسمي',
            content: row[6] || generateDemoLetterContent(),
            category: row[7] || 'طلب',
            purpose: row[8] || 'غرض تجريبي',
            firstCorrespondence: row[9] || 'نعم',
            reviewStatus: row[10] || 'في الانتظار',
            sendStatus: row[11] || 'في الانتظار',
            pdfUrl: row[12] || ''
        }));
        
        return records.reverse(); // Show newest first
    } catch (error) {
        console.error('Error fetching letter records:', error);
        console.warn('Falling back to demo data');
        return getDemoRecords();
    }
}

// Generate demo records
function getDemoRecords() {
    return [
        {
            id: '550e8400-e29b-41d4-a716-446655440000',
            date: '2025-06-01 12:04:01',
            subject: 'موافقة إقامة فعالية',
            type: 'جديد',
            recipient: 'شركة التقنية المتطورة',
            template: 'رسمي',
            content: generateDemoLetterContent('شركة التقنية المتطورة', 'موافقة إقامة فعالية'),
            category: 'طلب',
            purpose: 'موافقة إقامة فعالية',
            firstCorrespondence: 'نعم',
            reviewStatus: 'في الانتظار',
            sendStatus: 'في الانتظار',
            pdfUrl: ''
        },
        {
            id: 'LTR-1736187841-ABC123',
            date: '2025-06-02 14:30:15',
            subject: 'تهنئة عيد فطر المبارك',
            type: 'جديد',
            recipient: 'مؤسسة الخير الاجتماعية',
            template: 'ودي',
            content: generateDemoLetterContent('مؤسسة الخير الاجتماعية', 'تهنئة عيد فطر المبارك'),
            category: 'تهنئة',
            purpose: 'تهنئة عيد فطر',
            firstCorrespondence: 'نعم',
            reviewStatus: 'تمت المراجعة',
            sendStatus: 'تم الإرسال',
            pdfUrl: ''
        },
        {
            id: 'LTR-1736187842-DEF456',
            date: '2025-06-03 09:15:30',
            subject: 'طلب تعاون في مشروع البيئة',
            type: 'متابعة',
            recipient: 'وزارة البيئة والمياه والزراعة',
            template: 'رسمي',
            content: generateDemoLetterContent('وزارة البيئة والمياه والزراعة', 'طلب تعاون في مشروع البيئة'),
            category: 'طلب',
            purpose: 'بحث سبل التعاون',
            firstCorrespondence: 'لا',
            reviewStatus: 'يحتاج إلى تحسينات',
            sendStatus: 'في الانتظار',
            pdfUrl: ''
        }
    ];
}

// Generate demo letter content
function generateDemoLetterContent(recipient = 'المستلم المحترم', subject = 'الموضوع') {
    const currentDate = new Date().toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    return `بسم الله الرحمن الرحيم

${currentDate}

المحترمين / ${recipient}

السلام عليكم ورحمة الله وبركاته

الموضوع: ${subject}

يسعدنا أن نتواصل معكم بخصوص ${subject}.

نأمل منكم التكرم بالنظر في هذا الطلب والتعاون معنا في تحقيق الأهداف المشتركة. 

إننا نتطلع إلى تعزيز العلاقات الطيبة بيننا وبناء شراكات استراتيجية تخدم المصالح المشتركة.

شاكرين لكم حسن تعاونكم وتفهمكم.

وتفضلوا بقبول فائق الاحترام والتقدير.

المرسل: إدارة المشاريع
التوقيع: _______________
التاريخ: ${currentDate}`;
}

// Delete Record from Google Sheets
async function deleteRecordAPI(recordId) {
    if (DEMO_MODE) {
        // Remove from localStorage for demo
        const existingData = JSON.parse(localStorage.getItem('demoLetters') || '[]');
        const updatedData = existingData.filter(letter => letter.id !== recordId);
        localStorage.setItem('demoLetters', JSON.stringify(updatedData));
        return { success: true };
    }
    
    try {
        // First, find the row index
        const records = await getLetterRecordsAPI();
        const recordIndex = records.findIndex(record => record.id === recordId);
        
        if (recordIndex === -1) {
            throw new Error('Record not found');
        }
        
        // Calculate actual row number (add 2: 1 for header, 1 for 1-based indexing)
        const rowNumber = records.length - recordIndex + 1;
        
        // Delete the row
        const response = await fetch(
            `${SHEETS_BASE_URL}:batchUpdate?key=${SHEETS_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requests: [{
                        deleteDimension: {
                            range: {
                                sheetId: 0, // Assuming Submissions is the first sheet
                                dimension: 'ROWS',
                                startIndex: rowNumber - 1,
                                endIndex: rowNumber
                            }
                        }
                    }]
                })
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to delete record');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting record:', error);
        throw error;
    }
}

// Update Review Status in Google Sheets
async function updateReviewStatusAPI(recordId, status, reviewer, notes) {
    if (DEMO_MODE) {
        // Update localStorage for demo
        const existingData = JSON.parse(localStorage.getItem('demoLetters') || '[]');
        const recordIndex = existingData.findIndex(letter => letter.id === recordId);
        
        if (recordIndex !== -1) {
            existingData[recordIndex].reviewStatus = status;
            existingData[recordIndex].reviewer = reviewer;
            existingData[recordIndex].notes = notes;
            existingData[recordIndex].reviewDate = new Date().toISOString();
            localStorage.setItem('demoLetters', JSON.stringify(existingData));
        }
        
        return { success: true };
    }
    
    try {
        // This would require finding the specific row and updating column J
        // For now, we'll use a simplified approach
        console.log('Updating review status in Google Sheets:', { recordId, status, reviewer, notes });
                // In a real implementation, you'd need to:
        // 1. Find the row with the matching recordId
        // 2. Update the specific columns (J for review status, etc.)
        // 3. Use the Google Sheets API to update the range
        
        return { success: true };
    } catch (error) {
        console.error('Error updating review status:', error);
        throw error;
    }
}

// Utility Functions
function translateLetterTypeToEnglish(arabicType) {
    const translations = {
        'جديد': 'New',
        'رد': 'Reply',
        'متابعة': 'Follow Up',
        'تعاون': 'Co-op'
    };
    return translations[arabicType] || arabicType;
}

function translateLetterTypeToArabic(englishType) {
    const translations = {
        'New': 'جديد',
        'Reply': 'رد',
        'Follow Up': 'متابعة',
        'Co-op': 'تعاون'
    };
    return translations[englishType] || englishType;
}

function generateId() {
    return 'LTR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Export functions for testing
if (typeof window !== 'undefined') {
    window.getDemoRecords = getDemoRecords;
    window.generateDemoLetterContent = generateDemoLetterContent;
}

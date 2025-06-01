// Google Sheets Integration
const SPREADSHEET_ID = '1cLbTgbluZyWYHRouEgqHQuYQqKexHhu4st9ANzuaxGk'; // Replace with actual spreadsheet ID
const SHEETS_API_KEY = 'AIzaSyBqF-nMxyZMrjmdFbULO9I_j75hXXaiq4A'; // Replace with your Google Sheets API key

// Google Sheets API Base URL
const SHEETS_BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

// Get Dropdown Options from Settings Sheet
async function getDropdownOptionsAPI() {
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
        throw error;
    }
}

// Save to Google Sheets (Submissions worksheet)
async function saveToGoogleSheets(letterData) {
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
            letterData.firstCorrespondence || ''
        ]];
        
        const response = await fetch(
            `${SHEETS_BASE_URL}/values/Submissions!A:J:append?valueInputOption=RAW&key=${SHEETS_API_KEY}`,
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
    try {
        const response = await fetch(
            `${SHEETS_BASE_URL}/values/Submissions!A:J?key=${SHEETS_API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch letter records');
        }
        
        const data = await response.json();
        const values = data.values;
        
        if (!values || values.length < 2) {
            return [];
        }
        
        // Skip header row and map data
        const records = values.slice(1).map(row => ({
            id: row[0] || '',
            date: row[1] || '',
            subject: row[2] || '',
            type: row[3] || '',
            recipient: row[4] || '',
            template: row[5] || '',
            content: row[6] || '',
            category: row[7] || '',
            purpose: row[8] || '',
            firstCorrespondence: row[9] || ''
        }));
        
        return records.reverse(); // Show newest first
    } catch (error) {
        console.error('Error fetching letter records:', error);
        throw error;
    }
}

// Delete Record from Google Sheets
async function deleteRecordAPI(recordId) {
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

function generateId() {
    return 'LTR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}
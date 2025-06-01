// API Configuration
const API_BASE_URL = 'http://128.140.37.194:5000/generate-letter'; // Replace with your actual API endpoint

// Generate Letter API
async function generateLetterAPI(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/generate-letter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error calling generate letter API:', error);
        // Fallback: return mock data for demo purposes
        return {
            generatedText: generateMockLetter(formData)
        };
    }
}

// Create PDF API
async function createPDFAPI(letterData) {
    try {
        const response = await fetch(`${API_BASE_URL}/create-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(letterData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error calling create PDF API:', error);
        // Fallback: return mock response
        return {
            letterId: generateId(),
            pdfUrl: '#',
            success: true
        };
    }
}

// Get Letter by ID API
async function getLetterByIdAPI(letterId) {
    try {
        const response = await fetch(`${API_BASE_URL}/letter/${letterId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error fetching letter by ID:', error);
        // Fallback: return mock data
        return {
            id: letterId,
            content: 'محتوى الخطاب سيظهر هنا للمراجعة...',
            date: new Date().toLocaleDateString('ar-SA')
        };
    }
}

// Mock Letter Generator (for demo purposes)
function generateMockLetter(formData) {
    const templates = {
        'رسمي': generateFormalLetter,
        'شبه رسمي': generateSemiFormalLetter,
        'ودي': generateFriendlyLetter
    };
    
    const letterTemplate = `
بسم الله الرحمن الرحيم

${getCurrentDate()}

${formData.recipient} المحترم/ة

السلام عليكم ورحمة الله وبركاته

الموضوع: ${formData.subject}

${generateLetterBody(formData)}

وتفضلوا بقبول فائق الاحترام والتقدير.

المرسل: [اسم المرسل]
التوقيع: _______________
التاريخ: ${getCurrentDate()}
`;

    return letterTemplate.trim();
}

function generateLetterBody(formData) {
    let body = '';
    
    if (formData.firstCorrespondence === 'نعم') {
        body += 'يسعدني أن أتواصل معكم لأول مرة بخصوص ';
    } else {
        body += 'أتواصل معكم مجدداً بخصوص ';
    }
    
    body += formData.letterPurpose + '.\n\n';
    body += formData.content + '\n\n';
    
    switch (formData.letterCategory) {
        case 'طلب':
            body += 'نأمل منكم التكرم بالنظر في هذا الطلب والموافقة عليه.';
            break;
        case 'جدولة اجتماع':
            body += 'نرجو منكم تحديد الوقت المناسب لكم لعقد هذا الاجتماع.';
            break;
        case 'تهنئة':
            body += 'نتقدم لكم بأحر التهاني وأطيب الأمنيات.';
            break;
        case 'دعوة حضور':
            body += 'نتشرف بدعوتكم للحضور ونأمل أن نراكم معنا.';
            break;
        default:
            body += 'شاكرين لكم حسن تعاونكم.';
    }
    
    return body;
}

function generateFormalLetter(formData) {
    return generateMockLetter(formData);
}

function generateSemiFormalLetter(formData) {
    return generateMockLetter(formData).replace('المحترم/ة', 'الكريم/ة');
}

function generateFriendlyLetter(formData) {
    return generateMockLetter(formData)
        .replace('تفضلوا بقبول فائق الاحترام والتقدير', 'مع خالص التحية والاحترام');
}

function getCurrentDate() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    };
    return now.toLocaleDateString('ar-SA', options);
}

// Utility function for generating IDs
function generateId() {
    return 'LTR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}
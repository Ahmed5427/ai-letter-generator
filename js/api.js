// API Configuration
const API_BASE_URL = 'http://128.140.37.194:5000/generate-letter'; // Replace with your actual API endpoint

// Generate Letter API
async function generateLetterAPI(formData) {
    try {
        // If no API_BASE_URL, use demo mode
        if (!API_BASE_URL || API_BASE_URL === '') {
            console.log('Using demo mode for letter generation...');
            return {
                generatedText: generateMockLetter(formData)
            };
        }
        
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
        if (!API_BASE_URL || API_BASE_URL === '') {
            console.log('Using demo mode for PDF creation...');
            return {
                letterId: generateId(),
                pdfUrl: '#',
                success: true
            };
        }
        
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
        if (!API_BASE_URL || API_BASE_URL === '') {
            console.log('Using demo mode for letter retrieval...');
            
            // Try to get from demo data first
            const demoLetters = JSON.parse(localStorage.getItem('demoLetters') || '[]');
            const letter = demoLetters.find(l => l.id === letterId);
            
            if (letter) {
                return {
                    id: letter.id,
                    content: letter.content,
                    date: letter.date,
                    subject: letter.subject,
                    recipient: letter.recipient
                };
            }
            
            // Fallback to demo records
            const demoRecords = getDemoRecords();
            const demoLetter = demoRecords.find(l => l.id === letterId);
            
            if (demoLetter) {
                return {
                    id: demoLetter.id,
                    content: demoLetter.content,
                    date: demoLetter.date,
                    subject: demoLetter.subject,
                    recipient: demoLetter.recipient
                };
            }
            
            // Generate demo content if letter not found
            return {
                id: letterId,
                content: generateDemoLetterContent('المستلم المحترم', 'موضوع الخطاب'),
                date: new Date().toLocaleDateString('ar-SA'),
                subject: 'موضوع الخطاب',
                recipient: 'المستلم المحترم'
            };
        }
        
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
            content: generateDemoLetterContent('المستلم المحترم', 'موضوع الخطاب'),
            date: new Date().toLocaleDateString('ar-SA'),
            subject: 'موضوع الخطاب',
            recipient: 'المستلم المحترم'
        };
    }
}

// Mock Letter Generator (for demo purposes)
function generateMockLetter(formData) {
    const currentDate = getCurrentDate();
    
    const letterTemplate = `بسم الله الرحمن الرحيم

${currentDate}

${formData.recipient} المحترم/ة

السلام عليكم ورحمة الله وبركاته

الموضوع: ${formData.subject}

${generateLetterBody(formData)}

وتفضلوا بقبول فائق الاحترام والتقدير.

المرسل: [اسم المرسل]
التوقيع: _______________
التاريخ: ${currentDate}`;

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
            body += 'نأمل منكم التكرم بالنظر في هذا الطلب والموافقة عليه في أقرب وقت ممكن.';
            break;
        case 'جدولة اجتماع':
            body += 'نرجو منكم تحديد الوقت المناسب لكم لعقد هذا الاجتماع، ونحن في انتظار ردكم الكريم.';
            break;
        case 'تهنئة':
            body += 'نتقدم لكم بأحر التهاني وأطيب الأمنيات بمناسبة هذا الحدث السعيد.';
            break;
        case 'دعوة حضور':
            body += 'نتشرف بدعوتكم للحضور ونأمل أن نراكم معنا في هذه المناسبة المهمة.';
            break;
        default:
            body += 'شاكرين لكم حسن تعاونكم وتفهمكم، ونتطلع إلى استمرار التعاون المثمر بيننا.';
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
        .replace('تفضلوا بقبول فائق الاحترام والتقدير', 'مع خالص التحية والاحترام')
        .replace('المحترم/ة', 'العزيز/ة');
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

// Advanced Letter Generation with Templates
function generateLetterWithTemplate(formData, template) {
    switch (template) {
        case 'رسمي':
            return generateFormalLetter(formData);
        case 'شبه رسمي':
            return generateSemiFormalLetter(formData);
        case 'ودي':
            return generateFriendlyLetter(formData);
        default:
            return generateMockLetter(formData);
    }
}

// Generate specific letter types
function generateLetterByPurpose(formData) {
    const purpose = formData.letterPurpose;
    const baseContent = generateMockLetter(formData);
    
    // Add specific content based on purpose
    switch (purpose) {
        case 'موافقة إقامة فعالية':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nنود إعلامكم بأننا نسعى للحصول على الموافقة اللازمة لإقامة فعالية نوعية تخدم المجتمع وتحقق الأهداف المرجوة. وسنحرص على الالتزام بجميع اللوائح والمعايير المطلوبة لضمان نجاح الفعالية.`
            );
            
        case 'استثمار وتشغيل مشتل':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nنتطلع إلى إقامة شراكة استثمارية مثمرة في مجال إنشاء وتشغيل المشاتل، مما يساهم في تعزيز البيئة الخضراء ودعم التنمية المستدامة في المنطقة.`
            );
            
        case 'تسهيل إجراءات مشروع':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nنأمل منكم تسهيل الإجراءات اللازمة لتنفيذ هذا المشروع المهم، والذي سيساهم في تحقيق الأهداف التنموية والبيئية للمنطقة.`
            );
            
        case 'تهنئة عيد فطر':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nبمناسبة حلول عيد الفطر المبارك، نتقدم لكم بأصدق التهاني وأطيب الأمنيات، سائلين المولى عز وجل أن يعيده عليكم بالخير والبركات، وأن يديم عليكم نعمة الصحة والعافية.`
            );
            
        case 'دعوة خاصة لحضور حفل تدشين مبادرة الخبر خضراء ذكية':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nيشرفنا دعوتكم الكريمة لحضور حفل تدشين مبادرة الخبر خضراء ذكية، هذه المبادرة النوعية التي تهدف إلى تحويل مدينة الخبر إلى مدينة ذكية ومستدامة بيئياً. حضوركم سيضفي على المناسبة مزيداً من الأهمية والتقدير.`
            );
            
        case 'دعم صيانة بئر مطار الملك فهد':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nنسعى للحصول على دعمكم الكريم في أعمال صيانة وتطوير بئر مطار الملك فهد الدولي، وهو مشروع حيوي يساهم في ضمان استمرارية الخدمات الأساسية لهذا المرفق المهم.`
            );
            
        case 'تهنئة على نجاح مؤتمر وشكر على دعم':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nنود أن نعبر لكم عن خالص شكرنا وتقديرنا للدعم الكريم الذي قدمتموه، والذي ساهم بشكل كبير في إنجاح هذا المؤتمر. إن تعاونكم المثمر يعكس حرصكم على دعم المبادرات التي تخدم المجتمع.`
            );
            
        case 'بحث سبل التعاون':
            return baseContent.replace(
                formData.content,
                `${formData.content}\n\nنتطلع إلى استكشاف فرص التعاون المتاحة بيننا، وإقامة شراكات استراتيجية تحقق المصالح المشتركة وتساهم في تطوير وتنمية المجتمع. نحن على ثقة من أن هذا التعاون سيثمر عن نتائج إيجابية ومثمرة.`
            );
            
        default:
            return baseContent;
    }
}

// Email Integration (for future use)
async function sendLetterByEmail(emailData) {
    try {
        if (!API_BASE_URL || API_BASE_URL === '') {
            console.log('Email functionality requires API endpoint configuration');
            return { success: false, message: 'Email service not configured' };
        }
        
        const response = await fetch(`${API_BASE_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: error.message };
    }
}

// Letter Templates Management
const LetterTemplates = {
    formal: {
        greeting: 'السلام عليكم ورحمة الله وبركاته',
        closing: 'وتفضلوا بقبول فائق الاحترام والتقدير',
        recipientFormat: 'المحترم/ة'
    },
    
    semiFormal: {
        greeting: 'السلام عليكم ورحمة الله وبركاته',
        closing: 'مع خالص التحية والاحترام',
        recipientFormat: 'الكريم/ة'
    },
    
    friendly: {
        greeting: 'السلام عليكم ورحمة الله وبركاته',
        closing: 'مع أطيب التحيات',
        recipientFormat: 'العزيز/ة'
    }
};

// Generate letter with specific template
function applyTemplate(letterContent, templateType) {
    const template = LetterTemplates[templateType] || LetterTemplates.formal;
    
    return letterContent
        .replace('المحترم/ة', template.recipientFormat)
        .replace('وتفضلوا بقبول فائق الاحترام والتقدير', template.closing);
}

// Letter Statistics (for future dashboard)
function getLetterStatistics() {
    const demoLetters = JSON.parse(localStorage.getItem('demoLetters') || '[]');
    
    const stats = {
        total: demoLetters.length,
        byType: {},
        byStatus: {},
        byMonth: {},
        recent: demoLetters.slice(0, 5)
    };
    
    demoLetters.forEach(letter => {
        // Count by type
        stats.byType[letter.type] = (stats.byType[letter.type] || 0) + 1;
        
        // Count by review status
        stats.byStatus[letter.reviewStatus] = (stats.byStatus[letter.reviewStatus] || 0) + 1;
        
        // Count by month
        const month = new Date(letter.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' });
        stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
    });
    
    return stats;
}

// Export/Import functionality
function exportLettersToJSON() {
    const demoLetters = JSON.parse(localStorage.getItem('demoLetters') || '[]');
    const dataStr = JSON.stringify(demoLetters, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `letters-export-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importLettersFromJSON(jsonData) {
    try {
        const letters = JSON.parse(jsonData);
        if (Array.isArray(letters)) {
            localStorage.setItem('demoLetters', JSON.stringify(letters));
            return { success: true, count: letters.length };
        } else {
            throw new Error('Invalid JSON format');
        }
    } catch (error) {
        console.error('Error importing letters:', error);
        return { success: false, error: error.message };
    }
}

// Letter Validation
function validateLetterData(letterData) {
    const errors = [];
    
    if (!letterData.recipient || letterData.recipient.trim() === '') {
        errors.push('يرجى إدخال اسم المرسل إليه');
    }
    
    if (!letterData.subject || letterData.subject.trim() === '') {
        errors.push('يرجى إدخال موضوع الخطاب');
    }
    
    if (!letterData.content || letterData.content.trim() === '') {
        errors.push('يرجى إدخال محتوى الخطاب');
    }
    
    if (!letterData.letterType) {
        errors.push('يرجى اختيار نوع الخطاب');
    }
    
    if (!letterData.letterCategory) {
        errors.push('يرجى اختيار فئة الخطاب');
    }
    
    if (!letterData.letterPurpose) {
        errors.push('يرجى اختيار الغرض من الخطاب');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Advanced Search functionality
function searchLetters(query, filters = {}) {
    const demoLetters = JSON.parse(localStorage.getItem('demoLetters') || '[]');
    
    return demoLetters.filter(letter => {
        // Text search
        const searchMatch = !query || 
            letter.recipient.toLowerCase().includes(query.toLowerCase()) ||
            letter.subject.toLowerCase().includes(query.toLowerCase()) ||
            letter.content.toLowerCase().includes(query.toLowerCase()) ||
            letter.id.toLowerCase().includes(query.toLowerCase());
        
        // Type filter
        const typeMatch = !filters.type || letter.type === filters.type;
        
        // Status filter
        const statusMatch = !filters.reviewStatus || letter.reviewStatus === filters.reviewStatus;
        
        // Date filter
        const dateMatch = !filters.dateFrom || new Date(letter.date) >= new Date(filters.dateFrom);
        
        return searchMatch && typeMatch && statusMatch && dateMatch;
    });
}

// Utility function for generating IDs
function generateId() {
    return 'LTR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Arabic date formatting
function formatArabicDate(date) {
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    };
    return new Date(date).toLocaleDateString('ar-SA', options);
}

// Letter preview generator
function generateLetterPreview(letterData, maxLength = 150) {
    const fullLetter = generateMockLetter(letterData);
    const contentStart = fullLetter.indexOf(letterData.content);
    const preview = fullLetter.substring(contentStart, contentStart + maxLength);
    
    return preview.length < fullLetter.length - contentStart ? preview + '...' : preview;
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.generateLetterByPurpose = generateLetterByPurpose;
    window.applyTemplate = applyTemplate;
    window.getLetterStatistics = getLetterStatistics;
    window.exportLettersToJSON = exportLettersToJSON;
    window.importLettersFromJSON = importLettersFromJSON;
    window.validateLetterData = validateLetterData;
    window.searchLetters = searchLetters;
    window.generateLetterPreview = generateLetterPreview;
}
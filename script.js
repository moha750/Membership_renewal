// عناصر HTML الخاصة بالنوافذ المنبثقة
const openPopup1 = document.getElementById('openPopup1');
const resultPopup1 = document.getElementById('resultPopup1');
const closeResultPopup1 = document.getElementById('closeResultPopup1');
const resultMessage1 = document.getElementById('resultMessage1');
const proceed1 = document.getElementById('proceed1');
// لا يوجد عدّاد الآن

const openPopup2 = document.getElementById('openPopup2');
const resultPopup2 = document.getElementById('resultPopup2');
const closeResultPopup2 = document.getElementById('closeResultPopup2');
const resultMessage2 = document.getElementById('resultMessage2');
const proceed2 = document.getElementById('proceed2');
// لا يوجد عدّاد الآن

// عنصر عرض اسم المستخدم في الخطوة التالية
const usernameDisplay = document.getElementById('usernameDisplay');

// دالة ترجع الاسم الأول فقط من الاسم الكامل
function getFirstName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/); // يفصل على أي مسافات متتالية
    return parts[0] || '';
}

// تمت إزالة المؤقتات والعدّاد بشكل نهائي

// فتح وإغلاق النوافذ المنبثقة
closeResultPopup1.addEventListener('click', () => {
    resultPopup1.style.display = 'none';
});

closeResultPopup2.addEventListener('click', () => {
    resultPopup2.style.display = 'none';
});

// معالجة النقر على زر التجديد
openPopup1.addEventListener('click', () => {
    resultMessage1.textContent = "أدِيب سعيد بإستمرارك في صُنع مزيد من الإنجازات💙!";
    resultPopup1.style.display = 'flex';
});

// معالجة النقر على زر عدم التجديد
openPopup2.addEventListener('click', () => {
    resultMessage2.textContent = "أدِيب يشكُرك على كُل أثر وبصمة تركتها، ويتمنى لك مزيد من الإنجازات💙!";
    resultPopup2.style.display = 'flex';
});

// إغلاق النوافذ عند الضغط خارج المحتوى
window.addEventListener('click', (e) => {
    if (e.target == resultPopup1) {
        resultPopup1.style.display = 'none';
    }
    if (e.target == resultPopup2) {
        resultPopup2.style.display = 'none';
    }
});

// أزيلت المستمعات القديمة التي كانت تغلق فقط بدون حفظ

// حفظ البيانات في Supabase
async function saveToSupabase() {
    if (!window.supabaseClient) {
        throw new Error('Supabase client not initialized. Fill SUPABASE_URL and SUPABASE_ANON_KEY in supabase-config.js');
    }
    const nameInput = document.getElementById('input');
    const nameValue = nameInput ? nameInput.value.trim() : '';
    const actionRadio = document.querySelector('input[name="صورت ولا"]:checked');
    const actionValue = actionRadio ? actionRadio.value : '';

    if (!nameValue) {
        throw new Error('رجاءً اكتب اسمك.');
    }
    if (!actionValue) {
        throw new Error('رجاءً اختر تجديد العضوية أو عدم التجديد.');
    }

    const payload = {
        name: nameValue,
        action: actionValue,
        created_at: new Date().toISOString(),
    };

    const { data, error } = await window.supabaseClient
        .from('registrations')
        .insert([payload])
        .select();

    if (error) {
        throw error;
    }
    return data;
}

// التقديم للأمام والتراجع للخلف في النموذج
var create_workspace = document.querySelector(".create-workspace");
var next_click = document.querySelectorAll(".next-click");
var back_click = document.querySelectorAll(".back-click");
var main_form = document.querySelectorAll(".main");
var list = document.querySelectorAll(".progress-bar li");
let formnumber = 0;

// منع الإرسال الافتراضي للنموذج (حتى لو ضغط المستخدم Enter)
const myForm = document.forms['MyGroup'];
myForm?.addEventListener('submit', function (e) {
    e.preventDefault();
});

create_workspace.addEventListener('click', function () {
    if (!validateform()) {
        return false;
    }
    // تعبئة اسم المستخدم في العنوان التالي
    const nameInput = document.getElementById('input');
    const nameValue = nameInput ? nameInput.value.trim() : '';
    const firstName = getFirstName(nameValue);
    if (usernameDisplay) {
        usernameDisplay.textContent = firstName || 'أدِيب';
    }
    formnumber++;
    updateform();
    progress_forward();
});

next_click.forEach(function (next_page) {
    next_page.addEventListener('click', function () {
        if (!validateform()) {
            return false;
        }
        formnumber++;
        updateform();
        progress_forward();
    });
});

back_click.forEach(function (back_page) {
    back_page.addEventListener('click', function () {
        formnumber--;
        updateform();
    });
});

// زر "خلصت" داخل النوافذ يقوم بالحفظ ثم الانتقال للشاشة النهائية
proceed1?.addEventListener('click', async () => {
    try {
        await saveToSupabase();
        resultPopup1.style.display = 'none';
        formnumber++;
        updateform();
        const remove_progress = document.querySelector(".progress-bar");
        if (remove_progress) {
            remove_progress.classList.add('d-none');
        }
    } catch (err) {
        const msg = (err && err.message) ? err.message : 'حدث خطأ غير متوقع';
        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'تعذر الحفظ',
                text: msg,
                confirmButtonText: 'حسنًا'
            });
        } else {
            alert('تعذر الحفظ: ' + msg);
        }
    }
});

proceed2?.addEventListener('click', async () => {
    try {
        await saveToSupabase();
        resultPopup2.style.display = 'none';
        formnumber++;
        updateform();
        const remove_progress = document.querySelector(".progress-bar");
        if (remove_progress) {
            remove_progress.classList.add('d-none');
        }
    } catch (err) {
        const msg = (err && err.message) ? err.message : 'حدث خطأ غير متوقع';
        if (window.Swal) {
            Swal.fire({
                icon: 'error',
                title: 'تعذر الحفظ',
                text: msg,
                confirmButtonText: 'حسنًا'
            });
        } else {
            alert('تعذر الحفظ: ' + msg);
        }
    }
});

function progress_forward() {
    list[formnumber].classList.add('active');
}

function updateform() {
    main_form.forEach(function (main_number) {
        main_number.classList.remove('active');
    });
    main_form[formnumber].classList.add('active');
}

// التحقق من صحة النموذج
function validateform() {
    validate = true;
    var validate_form = document.querySelectorAll(".main.active #input");
    validate_form.forEach(function (val) {
        val.classList.remove('warning');
        if (val.hasAttribute('require')) {
            if (val.value.length == 0) {
                validate = false;
                val.classList.add('warning');
            }
        }
    });
    return validate;
}

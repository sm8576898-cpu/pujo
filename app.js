let isAdmin = false;
let currentYear = new Date().getFullYear().toString(); 
let currentCategory = ''; 
let availableYears = []; 
let activeMainCategory = ''; 

const pujaNames = {
    'Ganga_Puja': '🌊 গঙ্গা পুজো',
    'Kali_Puja': '🌺 কালী পুজো',
    'Harinam': '📿 হরিনাম',
    'Sitala_Gan': '🎵 মা শীতলার গান'
};

// =========================================
// ১. ইনিশিয়ালাইজেশন এবং লগইন চেক (পাবলিক ভিউ)
// =========================================
window.onload = () => {
    setTimeout(() => {
        document.getElementById('auth-modal').classList.add('hidden');
        if (!activeMainCategory) {
            document.getElementById('category-selection-screen').classList.remove('hidden');
            document.getElementById('main-app-wrapper').classList.add('hidden');
        }

        if (window.onAuthStateChanged) {
            window.onAuthStateChanged(window.auth, (user) => {
                if (user) {
                    isAdmin = true;
                    document.getElementById('admin-login-btn').classList.add('hidden');
                    document.getElementById('admin-logout-btn').classList.remove('hidden');
                    
                    let catAdminBtn = document.getElementById('cat-screen-admin-btn');
                    if(catAdminBtn) {
                        catAdminBtn.innerText = '🔓 লগআউট করুন';
                        catAdminBtn.style.background = '#ff4757';
                        catAdminBtn.onclick = logoutUser;
                    }
                    
                    if (activeMainCategory) {
                        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
                    }
                } else {
                    isAdmin = false;
                    document.getElementById('admin-login-btn').classList.remove('hidden');
                    document.getElementById('admin-logout-btn').classList.add('hidden');
                    
                    let catAdminBtn = document.getElementById('cat-screen-admin-btn');
                    if(catAdminBtn) {
                        catAdminBtn.innerText = '🔒 অ্যাডমিন লগইন';
                        catAdminBtn.style.background = '#3498db';
                        catAdminBtn.onclick = toggleAuthModal;
                    }

                    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('hidden'));
                }
            });
        }
    }, 500);
};

// =========================================
// ২. শুধু অ্যাডমিন লগইন কন্ট্রোল
// =========================================
window.toggleAuthModal = function() {
    document.getElementById('auth-modal').classList.toggle('hidden');
}

window.togglePasswordVisibility = function() {
    const passInput = document.getElementById('auth-password');
    const eyeSpan = document.getElementById('toggle-password-eye');
    if (passInput.type === 'password') {
        passInput.type = 'text'; eyeSpan.innerText = '🙈';
    } else {
        passInput.type = 'password'; eyeSpan.innerText = '👁️';
    }
}

window.submitAuth = function() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if(!email || !password) { alert("ইমেইল এবং পাসওয়ার্ড দিতেই হবে!"); return; }
    
    window.signInWithEmailAndPassword(window.auth, email, password)
    .then(() => {
        document.getElementById('auth-email').value = '';
        document.getElementById('auth-password').value = '';
        document.getElementById('auth-modal').classList.add('hidden');
    }).catch((error) => { alert("ভুল ইমেইল বা পাসওয়ার্ড! আবার চেষ্টা করুন।"); });
}

window.logoutUser = function() {
    if(confirm("আপনি কি লগআউট করতে চান?")) {
        window.signOut(window.auth).then(() => {
            alert("লগআউট সফল হয়েছে!");
            window.location.reload();
        });
    }
}

// =========================================
// ৩. পুজো ক্যাটাগরি কন্ট্রোল
// =========================================
window.selectMainCategory = function(cat) {
    activeMainCategory = cat;
    document.getElementById('category-selection-screen').classList.add('hidden');
    document.getElementById('main-app-wrapper').classList.remove('hidden');
    document.getElementById('current-active-puja').innerText = pujaNames[cat];
    
    let adminElements = document.querySelectorAll('.admin-only');
    if (isAdmin) {
        adminElements.forEach(el => el.classList.remove('hidden'));
    } else {
        adminElements.forEach(el => el.classList.add('hidden'));
    }
    
    loadYearsFromDatabase();
    loadClubDetails();
    setupViewCounter();
}

window.switchCategory = function() {
    document.getElementById('main-app-wrapper').classList.add('hidden');
    document.getElementById('category-selection-screen').classList.remove('hidden');
    activeMainCategory = '';
}

// =========================================
// ৪. ডেট কনভার্টার
// =========================================
function formatDateForDisplay(dateStr) {
    if (!dateStr) return "";
    if (dateStr.includes('/')) return dateStr; 
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`; 
    }
    return dateStr;
}

function getFormattedDate(inputDate) {
    if (inputDate) {
        const parts = inputDate.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`; 
        return inputDate; 
    }
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// =========================================
// ৫. বছর বা সাল কন্ট্রোল
// =========================================
function loadYearsFromDatabase() {
    const yearsRef = window.dbRef(window.database, `data/${activeMainCategory}/system/years`);
    window.dbOnValue(yearsRef, (snapshot) => {
        if (snapshot.exists()) {
            availableYears = snapshot.val();
        } else {
            availableYears = [currentYear];
            window.dbSet(yearsRef, availableYears);
        }
        renderYearSelector();
        loadAllData();
    });
}

function renderYearSelector() {
    const yearSelect = document.getElementById('year-select');
    yearSelect.innerHTML = '';
    availableYears.sort((a, b) => b - a).forEach(year => {
        let opt = document.createElement('option');
        opt.value = year; opt.innerText = year;
        if (year === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    });
}

window.openAddYearPrompt = function() {
    const newYear = prompt("নতুন পুজো বছর লিখুন (যেমন: 2027):");
    if (newYear && newYear.trim().length === 4 && !isNaN(newYear)) {
        if (!availableYears.includes(newYear)) {
            availableYears.push(newYear);
            window.dbSet(window.dbRef(window.database, `data/${activeMainCategory}/system/years`), availableYears).then(() => {
                currentYear = newYear; renderYearSelector(); loadAllData(); alert(newYear + " সাল যোগ করা হয়েছে!");
            });
        } else {
            alert("এই সালটি আগে থেকেই আছে!"); currentYear = newYear; renderYearSelector(); loadAllData();
        }
    }
}

window.deleteYearPrompt = function() {
    const yearToDelete = prompt("আপনি কোন সালটি ডিলিট করতে চান? (যেমন: 2024):");
    if (!yearToDelete) return;
    const yearStr = yearToDelete.trim();
    if (!availableYears.includes(yearStr)) { alert("এই সালটি খুঁজে পাওয়া যায়নি!"); return; }
    if (availableYears.length === 1) { alert("কমপক্ষে একটি সাল সিস্টেমে রাখতেই হবে!"); return; }
    
    if (confirm(`🚨 শেষ সতর্কবার্তা! আপনি কি সত্যিই ${yearStr} সাল মুছে ফেলতে চান?`)) {
        availableYears = availableYears.filter(y => y !== yearStr);
        window.dbSet(window.dbRef(window.database, `data/${activeMainCategory}/system/years`), availableYears).then(() => {
            window.dbRemove(window.dbRef(window.database, `data/${activeMainCategory}/funds/${yearStr}`));
            window.dbRemove(window.dbRef(window.database, `data/${activeMainCategory}/notices/${yearStr}`));
            window.dbRemove(window.dbRef(window.database, `data/${activeMainCategory}/gallery/${yearStr}`));
            if (currentYear === yearStr) currentYear = availableYears[0];
            renderYearSelector(); loadAllData(); alert(`${yearStr} সাল ডিলিট করা হয়েছে!`);
        });
    }
}

window.handleYearChange = function() {
    currentYear = document.getElementById('year-select').value;
    loadAllData(); 
}

// =========================================
// ৬. ক্লাব প্রোফাইল এবং তারিখ
// =========================================
function loadClubDetails() {
    const clubRef = window.dbRef(window.database, `data/${activeMainCategory}/system/clubDetails`);
    window.dbOnValue(clubRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('display-club-name').innerText = data.name || "🪔 আমাদের গ্রাম্য পুজো কমিটি";
            document.getElementById('display-club-address').innerText = "📍 গ্রাম + পোস্ট: " + (data.address || "বাগনান, উলুবেড়িয়া, হাওড়া");
            document.getElementById('display-club-mobile').innerText = "📞 মোবাইল: " + (data.mobile || "যোগাযোগ নম্বর দেওয়া নেই");
            document.getElementById('display-club-members').innerText = "👥 কমিটি / মূল সদস্য: " + (data.members || "অ্যাডমিন প্যানেল থেকে নাম যোগ করুন");
        } else {
            document.getElementById('display-club-name').innerText = "🪔 আমাদের গ্রাম্য পুজো কমিটি";
            document.getElementById('display-club-address').innerText = "📍 গ্রাম + পোস্ট: বাগনান, উলুবেড়িয়া, হাওড়া";
            document.getElementById('display-club-mobile').innerText = "📞 মোবাইল: যোগাযোগ নম্বর দেওয়া নেই";
            document.getElementById('display-club-members').innerText = "👥 কমিটি / মূল সদস্য: অ্যাডমিন প্যানেল থেকে নাম যোগ করুন";
        }
    });
}

function loadPujaDate() {
    const dateRef = window.dbRef(window.database, `data/${activeMainCategory}/system/pujaDates/${currentYear}`);
    window.dbOnValue(dateRef, (snapshot) => {
        let dateVal = snapshot.exists() ? snapshot.val() : "";
        document.getElementById('display-club-date').innerText = "📅 পুজোর তারিখ: " + (dateVal || "অ্যাডমিন প্যানেল থেকে যোগ করুন");
        document.getElementById('edit-club-date').value = dateVal; 
    });
}

window.openClubEditModal = function() {
    const clubRef = window.dbRef(window.database, `data/${activeMainCategory}/system/clubDetails`);
    window.dbOnValue(clubRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : {};
        document.getElementById('edit-club-name').value = data.name || "🪔 আমাদের গ্রাম্য পুজো কমিটি";
        document.getElementById('edit-club-address').value = data.address || "বাগনান, উলুবেড়িয়া, হাওড়া";
        document.getElementById('edit-club-mobile').value = data.mobile || "";
        document.getElementById('edit-club-members').value = data.members || ""; 
        document.getElementById('club-edit-modal').classList.remove('hidden');
    }, { onlyOnce: true });
}

window.closeClubEditModal = function() {
    document.getElementById('club-edit-modal').classList.add('hidden');
}

window.saveClubDetails = function() {
    const name = document.getElementById('edit-club-name').value.trim();
    const address = document.getElementById('edit-club-address').value.trim();
    const mobile = document.getElementById('edit-club-mobile').value.trim();
    const members = document.getElementById('edit-club-members').value.trim();
    const pujaDate = document.getElementById('edit-club-date').value.trim();

    if (!name) { alert("ক্লাবের নাম ফাঁকা রাখা যাবে না!"); return; }

    window.dbSet(window.dbRef(window.database, `data/${activeMainCategory}/system/clubDetails`), {
        name: name, address: address, mobile: mobile, members: members
    }).then(() => {
        window.dbSet(window.dbRef(window.database, `data/${activeMainCategory}/system/pujaDates/${currentYear}`), pujaDate).then(() => {
            alert("ক্লাবের বিবরণ আপডেট হয়েছে!");
            closeClubEditModal();
        });
    });
}

// =========================================
// ৭. ডেটা লোড করা
// =========================================
function loadAllData() {
    loadPujaDate(); 
    loadNotices();
    loadFinancialData();
    loadExpenses();
    loadGallery(); 
    if (currentCategory) loadCategoryData(); 
}

function loadNotices() {
    const noticesRef = window.dbRef(window.database, `data/${activeMainCategory}/notices/${currentYear}`);
    window.dbOnValue(noticesRef, (snapshot) => {
        const noticeList = document.getElementById('notice-list');
        noticeList.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const notice = data[key];
                const safeText = notice.text.replace(/"/g, '&quot;');
                const actionHtml = isAdmin ? `
                    <div style="margin-top:8px;">
                        <button class="edit-entry-btn" data-text="${safeText}" onclick="editNotice('${key}', this.getAttribute('data-text'))">এডিট</button>
                        <button class="delete-entry-btn" onclick="deleteData('notices/${currentYear}/${key}')">ডিলিট</button>
                    </div>` : '';
                noticeList.innerHTML += `<div class="notice-item"><span class="notice-date">${formatDateForDisplay(notice.date)}</span>${notice.text}${actionHtml}</div>`;
            });
        } else {
            noticeList.innerHTML = '<p style="color:#a0a0b5; font-size:14px;">এই সালের কোনো নোটিশ নেই।</p>';
        }
    });
}

function loadFinancialData() {
    const yearRef = window.dbRef(window.database, `data/${activeMainCategory}/funds/${currentYear}`);
    window.dbOnValue(yearRef, (snapshot) => {
        let totalIncome = 0; let totalExpense = 0;
        let categoryTotals = { 'mukto_haste': 0, 'guest_card': 0, 'matha_pichu': 0, 'adhai': 0 };

        if (snapshot.exists()) {
            const data = snapshot.val();
            ['mukto_haste', 'guest_card', 'matha_pichu', 'adhai'].forEach(cat => {
                if (data[cat]) {
                    Object.values(data[cat]).forEach(item => {
                        let amount = Number(item.amount || 0); totalIncome += amount; categoryTotals[cat] += amount;
                    });
                }
            });
            if (data.expenses) Object.values(data.expenses).forEach(item => totalExpense += Number(item.amount || 0));
        }
        
        document.getElementById('total-income').innerText = `₹${totalIncome.toFixed(2)}`;
        document.getElementById('total-expense').innerText = `₹${totalExpense.toFixed(2)}`;
        document.getElementById('net-balance').innerText = `₹${(totalIncome - totalExpense).toFixed(2)}`;
        
        ['mukto_haste', 'guest_card', 'matha_pichu', 'adhai'].forEach(cat => {
            const sumElement = document.getElementById(`sum-${cat}`);
            if (sumElement) { sumElement.innerText = `মোট জমা: ₹${categoryTotals[cat].toFixed(2)}`; }
        });
    });
}

function loadExpenses() {
    const expensesRef = window.dbRef(window.database, `data/${activeMainCategory}/funds/${currentYear}/expenses`);
    window.dbOnValue(expensesRef, (snapshot) => {
        const tbody = document.getElementById('expense-table-body');
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                const safePurpose = item.purpose.replace(/"/g, '&quot;');
                const actionHtml = isAdmin ? `
                    <td class="admin-only no-print" style="white-space: nowrap;">
                        <button class="edit-entry-btn" data-purpose="${safePurpose}" data-amount="${item.amount}" onclick="editExpense('${key}', this.getAttribute('data-purpose'), this.getAttribute('data-amount'))">এডিট</button>
                        <button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/expenses/${key}')">ডিলিট</button>
                    </td>` : '<td class="admin-only hidden no-print"></td>';
                
                tbody.innerHTML += `<tr><td>${formatDateForDisplay(item.date)}</td><td>${item.purpose}</td><td style="color:#ff4757; font-weight:bold;">₹${item.amount}</td>${actionHtml}</tr>`;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো খরচের হিসাব নেই</td></tr>`;
        }
    });
}

// =========================================
// ৮. গ্যালারি ও পিডিএফ (উন্নত কম্প্রেশন সহ)
// =========================================
window.uploadToGallery = function() {
    const fileInput = document.getElementById('gallery-file-input');
    const titleInput = document.getElementById('gallery-title').value.trim();
    
    if (!fileInput.files || fileInput.files.length === 0) { alert("ফাইল সিলেক্ট করুন!"); return; }
    if (!titleInput) { alert("ডকুমেন্টের নাম দিন!"); return; }
    
    const file = fileInput.files[0];
    // ১ এমবি (1MB) লিমিট চেক
    if (file.size > 1024 * 1024) { 
        alert("⚠️ ফাইল সাইজ 1MB-র চেয়ে বড়! দয়া করে ছোট সাইজের ছবি বা ডকুমেন্ট দিন।"); 
        fileInput.value = ''; 
        return; 
    }
    
    const dateStr = getFormattedDate(); 

    if (file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = function(e) { saveToFirebaseGallery(titleInput, e.target.result, file.type, dateStr, fileInput); };
        reader.readAsDataURL(file);
    } else if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                let width = img.width, height = img.height;
                
                // ছবিকে ১০০ কেবির নিচে রাখতে সর্বোচ্চ রেজোলিউশন ৭২০ পিক্সেল (720px) করা হলো
                const MAX_SIZE = 720;
                if (width > height) { 
                    if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } 
                } else { 
                    if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } 
                }
                
                canvas.width = width; 
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                
                // ছবির কোয়ালিটি ০.৬ (60%) সেট করা হলো যাতে ছবি না ফাটে কিন্তু সাইজ ৫০-৮০ কেবির মধ্যে থাকে
                const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
                saveToFirebaseGallery(titleInput, compressedDataUrl, "image/jpeg", dateStr, fileInput);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        alert("শুধুমাত্র ছবি (Image) বা পিডিএফ (PDF) সাপোর্ট করে!");
    }
}

function saveToFirebaseGallery(title, dataUrl, type, dateStr, fileInput) {
    window.dbPush(window.dbRef(window.database, `data/${activeMainCategory}/gallery/${currentYear}`), {
        title: title, url: dataUrl, type: type, date: dateStr
    }).then(() => {
        alert("আপলোড সফল হয়েছে!"); fileInput.value = ''; document.getElementById('gallery-title').value = '';
    });
}

window.openImageViewer = function(url) {
    document.getElementById('full-size-image').src = url;
    document.getElementById('image-viewer-modal').classList.remove('hidden');
}

window.closeImageViewer = function() {
    document.getElementById('image-viewer-modal').classList.add('hidden');
    document.getElementById('full-size-image').src = '';
}

function loadGallery() {
    const galleryRef = window.dbRef(window.database, `data/${activeMainCategory}/gallery/${currentYear}`);
    window.dbOnValue(galleryRef, (snapshot) => {
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                let previewHtml = item.url.startsWith('data:image') 
                    ? `<img src="${item.url}" alt="${item.title}" onclick="openImageViewer('${item.url}')" style="cursor:pointer;">`
                    : `<div class="pdf-preview-box">📄<span style="font-size:12px; margin-top:8px;">PDF</span><a href="${item.url}" download="${item.title}.pdf" class="pdf-download-btn">⬇️ ডাউনলোড</a></div>`;
                const deleteHtml = isAdmin ? `<div style="margin-top:8px;"><button class="delete-entry-btn" onclick="deleteData('gallery/${currentYear}/${key}')" style="width:100%;">🗑️ ডিলিট</button></div>` : '';
                grid.innerHTML += `<div class="gallery-card">${previewHtml}<h4>${item.title}</h4><p>📅 ${formatDateForDisplay(item.date)}</p>${deleteHtml}</div>`;
            });
        }
    });
}

// =========================================
// ৯. মডাল ও ক্যাটাগরি ডেটা
// =========================================
window.openCategoryModal = function(categoryId, title) {
    currentCategory = categoryId;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('data-modal').classList.remove('hidden');
    loadCategoryData();
}

window.closeCategoryModal = function() {
    document.getElementById('data-modal').classList.add('hidden');
    currentCategory = '';
}

function loadCategoryData() {
    if(!currentCategory) return;
    const catRef = window.dbRef(window.database, `data/${activeMainCategory}/funds/${currentYear}/${currentCategory}`);
    window.dbOnValue(catRef, (snapshot) => {
        const tbody = document.getElementById('modal-table-body');
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                const safeName = item.name.replace(/"/g, '&quot;');
                const actionHtml = isAdmin ? `
                    <td class="admin-only no-print" style="white-space: nowrap;">
                        <button onclick="shareWhatsApp('${safeName}', '${item.amount}')" style="background:#25D366;color:white;border:none;padding:5px 8px;border-radius:4px;cursor:pointer;font-size:11px;margin-right:3px;font-weight:bold;">💬 শেয়ার</button>
                        <button class="edit-entry-btn" data-name="${safeName}" data-amount="${item.amount}" onclick="editCategory('${key}', this.getAttribute('data-name'), this.getAttribute('data-amount'))">এডিট</button>
                        <button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/${currentCategory}/${key}')">ডিলিট</button>
                    </td>` : '<td class="admin-only hidden no-print"></td>';
                
                tbody.innerHTML += `<tr><td>${formatDateForDisplay(item.date)}</td><td>${item.name}</td><td style="color:#2ed573; font-weight:bold;">₹${item.amount}</td>${actionHtml}</tr>`;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো এন্ট্রি নেই</td></tr>`;
        }
    });
}

// =========================================
// ১০. ডেটা সেভ করা (Add)
// =========================================
window.addNewNotice = function() {
    const text = document.getElementById('new-notice-text').value;
    if (!text) { alert("নোটিশ ফাঁকা রাখা যাবে না!"); return; }
    window.dbPush(window.dbRef(window.database, `data/${activeMainCategory}/notices/${currentYear}`), { text: text, date: getFormattedDate() })
        .then(() => document.getElementById('new-notice-text').value = '');
}

window.addExpenseEntry = function() {
    const purpose = document.getElementById('exp-purpose').value;
    const amount = document.getElementById('exp-amount').value;
    const dateInput = document.getElementById('exp-date').value;
    if (!purpose || !amount) { alert("বিবরণ এবং টাকার পরিমাণ দিন!"); return; }
    window.dbPush(window.dbRef(window.database, `data/${activeMainCategory}/funds/${currentYear}/expenses`), { purpose: purpose, amount: Number(amount), date: getFormattedDate(dateInput) })
        .then(() => { document.getElementById('exp-purpose').value = ''; document.getElementById('exp-amount').value = ''; });
}

window.addCategoryDataEntry = function() {
    const name = document.getElementById('data-name').value;
    const amount = document.getElementById('data-amount').value;
    const dateInput = document.getElementById('data-date').value;
    if (!name || !amount) { alert("নাম এবং টাকার পরিমাণ দিন!"); return; }
    window.dbPush(window.dbRef(window.database, `data/${activeMainCategory}/funds/${currentYear}/${currentCategory}`), { name: name, amount: Number(amount), date: getFormattedDate(dateInput) })
        .then(() => { document.getElementById('data-name').value = ''; document.getElementById('data-amount').value = ''; });
}

// =========================================
// ১১. ডেটা এডিট করা (Edit)
// =========================================
window.editNotice = function(key, currentText) {
    const newText = prompt("নোটিশ আপডেট করুন:", currentText);
    if (newText && newText !== currentText) {
        window.dbUpdate(window.dbRef(window.database, `data/${activeMainCategory}/notices/${currentYear}/${key}`), { text: newText });
    }
}

window.editExpense = function(key, currentPurpose, currentAmount) {
    const newPurpose = prompt("খরচের বিবরণ:", currentPurpose);
    if (newPurpose === null) return; 
    const newAmount = prompt("টাকার পরিমাণ:", currentAmount);
    if (newAmount && newPurpose.trim() !== "") {
        window.dbUpdate(window.dbRef(window.database, `data/${activeMainCategory}/funds/${currentYear}/expenses/${key}`), { purpose: newPurpose, amount: Number(newAmount) });
    }
}

window.editCategory = function(key, currentName, currentAmount) {
    const newName = prompt("নাম:", currentName);
    if (newName === null) return;
    const newAmount = prompt("টাকার পরিমাণ:", currentAmount);
    if (newAmount && newName.trim() !== "") {
        window.dbUpdate(window.dbRef(window.database, `data/${activeMainCategory}/funds/${currentYear}/${currentCategory}/${key}`), { name: newName, amount: Number(newAmount) });
    }
}

// =========================================
// ১২. ডেটা ডিলিট (Delete)
// =========================================
window.deleteData = function(subPath) {
    if(confirm("আপনি কি নিশ্চিত যে এই এন্ট্রিটি ডিলিট করতে চান?")) {
        window.dbRemove(window.dbRef(window.database, `data/${activeMainCategory}/${subPath}`));
    }
}

// =========================================
// ১৩. ভিউ কাউন্টার
// =========================================
function setupViewCounter() {
    const viewsRef = window.dbRef(window.database, `data/${activeMainCategory}/system/viewCount`);
    window.dbOnValue(viewsRef, (snapshot) => {
        let count = snapshot.exists() ? snapshot.val() : 0;
        const counterElement = document.getElementById('app-view-count');
        if (counterElement) counterElement.innerText = count.toLocaleString('bn-IN');
    });

    const sessionKey = `hasCountedView_${activeMainCategory}`;
    if (!sessionStorage.getItem(sessionKey)) {
        window.dbOnValue(viewsRef, (snapshot) => {
            let currentCount = snapshot.exists() ? snapshot.val() : 0;
            window.dbSet(viewsRef, currentCount + 1);
            sessionStorage.setItem(sessionKey, 'true');
        }, { onlyOnce: true });
    }
}

// =========================================
// ১৪. লাইভ সার্চ এবং পিডিএফ
// =========================================
window.searchTable = function(inputId, tbodyId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    let rows = document.getElementById(tbodyId).getElementsByTagName('tr');
    for (let i = 0; i < rows.length; i++) {
        let text = rows[i].getElementsByTagName('td')[1];
        if (text) {
            rows[i].style.display = text.innerText.toLowerCase().includes(input) ? "" : "none";
        }
    }
}

window.shareWhatsApp = function(name, amount) {
    const message = `নমস্কার ${name}, গ্রাম পুজো কমিটির তরফ থেকে জানানো হচ্ছে যে, আপনার দেওয়া ${amount} টাকা সফলভাবে পুজো তহবিলে জমা হয়েছে। ধন্যবাদ! 🙏`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
}

window.printSection = function(title, containerId) {
    let tableHtml = document.getElementById(containerId).innerHTML;
    let printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(`<html><head><title>${title} রিপোর্ট</title><style>
        body{font-family:sans-serif;padding:20px;color:black;} h2{text-align:center;border-bottom:2px solid #ccc;padding-bottom:10px;}
        table{width:100%;border-collapse:collapse;margin-top:20px;} th,td{border:1px solid #333;padding:10px;text-align:left;}
        th{background-color:#f2f2f2;font-weight:bold;} .no-print, .hidden{display:none !important;}
    </style></head><body><h2>${title} (${currentYear} সাল)</h2>${tableHtml}</body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
}

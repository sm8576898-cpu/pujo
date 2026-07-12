let isAdmin = false;
let currentYear = new Date().getFullYear().toString(); 
let currentCategory = ''; 
let availableYears = []; 

// =========================================
// ১. ইনিশিয়ালাইজেশন এবং লগইন চেক
// =========================================
window.onload = () => {
    setTimeout(() => {
        loadYearsFromDatabase();
        loadClubDetails(); 
        
        if (window.onAuthStateChanged) {
            window.onAuthStateChanged(window.auth, (user) => {
                if (user) {
                    isAdmin = true;
                    document.getElementById('admin-login-btn').classList.add('hidden');
                    document.getElementById('admin-logout-btn').classList.remove('hidden');
                    let adminElements = document.querySelectorAll('.admin-only');
                    adminElements.forEach(el => el.classList.remove('hidden'));
                } else {
                    isAdmin = false;
                    document.getElementById('admin-login-btn').classList.remove('hidden');
                    document.getElementById('admin-logout-btn').classList.add('hidden');
                    let adminElements = document.querySelectorAll('.admin-only');
                    adminElements.forEach(el => el.classList.add('hidden'));
                }
                loadAllData();
                setupViewCounter();
            });
        }
    }, 1000);
};

// =========================================
// ২. বছর বা সাল কন্ট্রোল
// =========================================
function loadYearsFromDatabase() {
    const yearsRef = window.dbRef(window.database, 'system/years');
    window.dbOnValue(yearsRef, (snapshot) => {
        if (snapshot.exists()) {
            availableYears = snapshot.val();
        } else {
            availableYears = [currentYear];
            window.dbSet(yearsRef, availableYears);
        }
        renderYearSelector();
    });
}

function renderYearSelector() {
    const yearSelect = document.getElementById('year-select');
    yearSelect.innerHTML = '';
    availableYears.sort((a, b) => b - a).forEach(year => {
        let opt = document.createElement('option');
        opt.value = year;
        opt.innerText = year;
        if (year === currentYear) opt.selected = true;
        yearSelect.appendChild(opt);
    });
}

function openAddYearPrompt() {
    const newYear = prompt("নতুন পুজো বছর লিখুন (যেমন: 2027):");
    if (newYear && newYear.trim().length === 4 && !isNaN(newYear)) {
        if (!availableYears.includes(newYear)) {
            availableYears.push(newYear);
            window.dbSet(window.dbRef(window.database, 'system/years'), availableYears).then(() => {
                currentYear = newYear; 
                renderYearSelector();
                loadAllData(); 
                alert(newYear + " সাল সফলভাবে যোগ করা হয়েছে!");
            });
        } else {
            alert("এই সালটি আগে থেকেই ড্রপডাউনে আছে!");
            currentYear = newYear;
            renderYearSelector();
            loadAllData();
        }
    } else if (newYear !== null) {
        alert("দয়া করে সঠিক ৪ সংখ্যার সাল লিখুন!");
    }
}

window.deleteYearPrompt = function() {
    const yearToDelete = prompt("আপনি কোন সালটি ডিলিট করতে চান? (যেমন: 3000):");
    if (!yearToDelete) return;

    const yearStr = yearToDelete.trim();
    if (!availableYears.includes(yearStr)) {
        alert("এই সালটি ড্রপডাউন লিস্টে খুঁজে পাওয়া যায়নি!");
        return;
    }

    if (availableYears.length === 1) {
        alert("কমপক্ষে একটি সাল সিস্টেমে রাখতেই হবে! আপনি এটি ডিলিট করতে পারবেন না।");
        return;
    }

    const fundRef = window.dbRef(window.database, `funds/${yearStr}`);
    const noticeRef = window.dbRef(window.database, `notices/${yearStr}`);
    const galleryRef = window.dbRef(window.database, `gallery/${yearStr}`);

    window.dbOnValue(fundRef, (fundSnap) => {
        window.dbOnValue(noticeRef, (noticeSnap) => {
            window.dbOnValue(galleryRef, (gallerySnap) => {
                
                const hasAnyData = fundSnap.exists() || noticeSnap.exists() || gallerySnap.exists();

                if (hasAnyData) {
                    let firstConfirm = confirm(`⚠️ সাবধান! ${yearStr} সালে চাঁদা, খরচ বা গ্যালারির হিসাব জমা আছে!\n\nআপনি কি সত্যিই এই সালের সমস্ত ডেটা মুছে ফেলতে চান?`);
                    if (firstConfirm) {
                        let secondConfirm = confirm(`🚨 শেষ সতর্কবার্তা (Final Warning)!\n\n${yearStr} সাল ডিলিট করলে এর সমস্ত হিসাব চিরকালের মতো মুছে যাবে এবং আর ফিরে পাওয়া যাবে না!\n\nআপনি কি ১০০% নিশ্চিত?`);
                        if (secondConfirm) {
                            performDeleteYear(yearStr);
                        } else {
                            alert("ডিলিট প্রক্রিয়া বাতিল করা হয়েছে। আপনার ডেটা সুরক্ষিত আছে!");
                        }
                    }
                } else {
                    if (confirm(`${yearStr} সালটি একদম ফাঁকা (কোনো এন্ট্রি নেই)। আপনি কি এটি লিস্ট থেকে মুছে ফেলতে চান?`)) {
                        performDeleteYear(yearStr);
                    }
                }

            }, { onlyOnce: true });
        }, { onlyOnce: true });
    }, { onlyOnce: true });
}

function performDeleteYear(yearStr) {
    availableYears = availableYears.filter(y => y !== yearStr);
    window.dbSet(window.dbRef(window.database, 'system/years'), availableYears).then(() => {
        window.dbRemove(window.dbRef(window.database, `funds/${yearStr}`));
        window.dbRemove(window.dbRef(window.database, `notices/${yearStr}`));
        window.dbRemove(window.dbRef(window.database, `gallery/${yearStr}`));
        window.dbRemove(window.dbRef(window.database, `system/pujaDates/${yearStr}`)); // ওই সালের ডেট ডিলিট

        if (currentYear === yearStr) {
            currentYear = availableYears[0];
        }
        renderYearSelector();
        loadAllData();
        alert(`${yearStr} সাল সফলভাবে ডিলিট করা হয়েছে!`);
    });
}

function handleYearChange() {
    currentYear = document.getElementById('year-select').value;
    loadAllData(); 
}

// =========================================
// ৩. অ্যাডমিন লগইন / লগআউট কন্ট্রোল
// =========================================
function toggleAdminModal() { document.getElementById('auth-modal').classList.toggle('hidden'); }

function togglePasswordVisibility() {
    const passInput = document.getElementById('admin-password');
    const eyeSpan = document.getElementById('toggle-password-eye');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeSpan.innerText = '🙈';
    } else {
        passInput.type = 'password';
        eyeSpan.innerText = '👁️';
    }
}

function submitAdminLogin() {
    const email = document.getElementById('admin-email').value.trim(); 
    const password = document.getElementById('admin-password').value;
    
    if (!email || !password) { alert("দয়া করে ইমেইল এবং পিন দিন!"); return; }
    window.signInWithEmailAndPassword(window.auth, email, password)
        .then(() => {
            alert("লগইন সফল হয়েছে!");
            toggleAdminModal();
            document.getElementById('admin-email').value = '';
            document.getElementById('admin-password').value = '';
        })
        .catch((error) => { alert("ভুল ইমেইল বা পাসওয়ার্ড! আবার চেষ্টা করুন।"); });
}

function logoutAdmin() {
    if(confirm("আপনি কি লগআউট করতে চান?")) {
        window.signOut(window.auth).then(() => alert("লগআউট সফল হয়েছে!"));
    }
}

// =========================================
// ৪. স্পেশাল ডেট কনভার্টার (DD/MM/YYYY)
// =========================================
function getFormattedDate(inputDate) {
    if (inputDate) {
        const parts = inputDate.split('-');
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0]}`; // Convert YYYY-MM-DD to DD/MM/YYYY
        }
        return inputDate; // Fallback
    }
    // যদি ম্যানুয়াল ডেট না দেওয়া থাকে, তবে আজকের ডেট নেবে
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// =========================================
// ৫. ক্লাব প্রোফাইল এবং ডায়নামিক তারিখ লোড
// =========================================
function loadClubDetails() {
    const clubRef = window.dbRef(window.database, 'system/clubDetails');
    window.dbOnValue(clubRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('display-club-name').innerText = data.name || "🪔 আমাদের গ্রাম্য পুজো কমিটি";
            document.getElementById('display-club-address').innerText = "📍 গ্রাম + পোস্ট: " + (data.address || "বাগনান, উলুবেড়িয়া, হাওড়া");
            document.getElementById('display-club-mobile').innerText = "📞 মোবাইল: " + (data.mobile || "যোগাযোগ নম্বর দেওয়া নেই");
            document.getElementById('display-club-members').innerText = "👥 কমিটি / মূল সদস্য: " + (data.members || "অ্যাডমিন প্যানেল থেকে নাম যোগ করুন");
        }
    });
}

function loadPujaDate() {
    const dateRef = window.dbRef(window.database, `system/pujaDates/${currentYear}`);
    window.dbOnValue(dateRef, (snapshot) => {
        let dateVal = snapshot.exists() ? snapshot.val() : "";
        document.getElementById('display-club-date').innerText = "📅 পুজোর তারিখ: " + (dateVal || "অ্যাডমিন প্যানেল থেকে যোগ করুন");
        document.getElementById('edit-club-date').value = dateVal; // এডিট মডালের বক্সে আপডেট
    });
}

function openClubEditModal() {
    const clubRef = window.dbRef(window.database, 'system/clubDetails');
    window.dbOnValue(clubRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : {};
        document.getElementById('edit-club-name').value = data.name || "🪔 আমাদের গ্রাম্য পুজো কমিটি";
        document.getElementById('edit-club-address').value = data.address || "বাগনান, উলুবেড়িয়া, হাওড়া";
        document.getElementById('edit-club-mobile').value = data.mobile || "";
        document.getElementById('edit-club-members').value = data.members || ""; 
        // ডেট অলরেডি loadPujaDate থেকে ইনপুটে বসে গেছে
        document.getElementById('club-edit-modal').classList.remove('hidden');
    }, { onlyOnce: true });
}

function closeClubEditModal() {
    document.getElementById('club-edit-modal').classList.add('hidden');
}

function saveClubDetails() {
    const name = document.getElementById('edit-club-name').value.trim();
    const address = document.getElementById('edit-club-address').value.trim();
    const mobile = document.getElementById('edit-club-mobile').value.trim();
    const members = document.getElementById('edit-club-members').value.trim();
    const pujaDate = document.getElementById('edit-club-date').value.trim();

    if (!name) { alert("ক্লাবের নাম ফাঁকা রাখা যাবে না!"); return; }

    // গ্লোবাল ডিটেলস সেভ
    window.dbSet(window.dbRef(window.database, 'system/clubDetails'), {
        name: name,
        address: address,
        mobile: mobile,
        members: members
    }).then(() => {
        // শুধুমাত্র এই নির্দিষ্ট সালের জন্য ডেট সেভ
        window.dbSet(window.dbRef(window.database, `system/pujaDates/${currentYear}`), pujaDate).then(() => {
            alert("ক্লাবের বিবরণ এবং তারিখ সফলভাবে আপডেট হয়েছে!");
            closeClubEditModal();
        });
    });
}

// =========================================
// ৬. ডেটা লোড করা (Notices, Funds, Expenses, Gallery)
// =========================================
function loadAllData() {
    loadPujaDate(); // সাল পাল্টালে তারিখ পাল্টাবে
    loadNotices();
    loadFinancialData();
    loadExpenses();
    loadGallery(); 
    if (currentCategory) loadCategoryData(); 
}

function loadNotices() {
    const noticesRef = window.dbRef(window.database, `notices/${currentYear}`);
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
                
                noticeList.innerHTML += `
                    <div class="notice-item">
                        <span class="notice-date">${notice.date}</span>
                        ${notice.text}
                        ${actionHtml}
                    </div>
                `;
            });
        } else {
            noticeList.innerHTML = '<p style="color:#a0a0b5; font-size:14px;">এই সালের কোনো নোটিশ নেই।</p>';
        }
    });
}

function loadFinancialData() {
    const yearRef = window.dbRef(window.database, `funds/${currentYear}`);
    window.dbOnValue(yearRef, (snapshot) => {
        let totalIncome = 0; let totalExpense = 0;
        
        let categoryTotals = { 'mukto_haste': 0, 'guest_card': 0, 'matha_pichu': 0, 'adhai': 0 };

        if (snapshot.exists()) {
            const data = snapshot.val();
            ['mukto_haste', 'guest_card', 'matha_pichu', 'adhai'].forEach(cat => {
                if (data[cat]) {
                    Object.values(data[cat]).forEach(item => {
                        let amount = Number(item.amount || 0);
                        totalIncome += amount;
                        categoryTotals[cat] += amount;
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
    const expensesRef = window.dbRef(window.database, `funds/${currentYear}/expenses`);
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
                
                tbody.innerHTML += `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.purpose}</td>
                        <td style="color:#ff4757; font-weight:bold;">₹${item.amount}</td>
                        ${actionHtml}
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো খরচের হিসাব নেই</td></tr>`;
        }
    });
}

// =========================================
// ৭. গ্যালারি ও পিডিএফ লোড এবং আপলোড
// =========================================
function uploadToGallery() {
    const fileInput = document.getElementById('gallery-file-input');
    const titleInput = document.getElementById('gallery-title').value.trim();
    
    if (!fileInput.files || fileInput.files.length === 0) { alert("দয়া করে একটি ছবি বা PDF ফাইল সিলেক্ট করুন!"); return; }
    if (!titleInput) { alert("দয়া করে ছবি বা ডকুমেন্টের একটা নাম বা বিবরণ দিন!"); return; }
    
    const file = fileInput.files[0];
    const maxSize = 1024 * 1024; 
    
    if (file.size > maxSize) {
        alert("⚠️ ফাইল সাইজ ১ এমবি (1MB)-র চেয়ে বড়! দয়া করে 1MB-র নিচের ফাইল সিলেক্ট করুন।");
        fileInput.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const dateStr = getFormattedDate(); // DD/MM/YYYY
        
        window.dbPush(window.dbRef(window.database, `gallery/${currentYear}`), {
            title: titleInput,
            url: base64Data,
            type: file.type,
            date: dateStr
        }).then(() => {
            alert("ফাইল সফলভাবে গ্যালারিতে আপলোড হয়েছে!");
            fileInput.value = '';
            document.getElementById('gallery-title').value = '';
        }).catch(err => { alert("আপলোড ব্যর্থ হয়েছে! নেটওয়ার্ক চেক করুন।"); });
    };
    reader.readAsDataURL(file);
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
    const galleryRef = window.dbRef(window.database, `gallery/${currentYear}`);
    window.dbOnValue(galleryRef, (snapshot) => {
        const grid = document.getElementById('gallery-grid');
        grid.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                let previewHtml = '';
                if (item.url && item.url.startsWith('data:image')) {
                    previewHtml = `<img src="${item.url}" alt="${item.title}" onclick="openImageViewer('${item.url}')" style="cursor:pointer;" title="বড় করে দেখতে ক্লিক করুন">`;
                } else {
                    previewHtml = `
                        <div class="pdf-preview-box">📄<span style="font-size:12px; color:#fff; margin-top:8px;">PDF ডকুমেন্ট</span>
                            <a href="${item.url}" download="${item.title}.pdf" class="pdf-download-btn" style="margin-top:10px;">⬇️ ডাউনলোড করুন</a>
                        </div>`;
                }
                const deleteHtml = isAdmin ? `<div style="margin-top:8px;"><button class="delete-entry-btn" onclick="deleteData('gallery/${currentYear}/${key}')" style="background:#ff4757; width:80%;">🗑️ ডিলিট করুন</button></div>` : '';
                grid.innerHTML += `<div class="gallery-card">${previewHtml}<h4>${item.title}</h4><p>📅 ${item.date}</p>${deleteHtml}</div>`;
            });
        } else {
            grid.innerHTML = '<p style="color:#a0a0b5; font-size:14px; grid-column: 1/-1; text-align:center;">এই সালের গ্যালারিতে কোনো ছবি বা ডকুমেন্ট আপলোড করা হয়নি।</p>';
        }
    });
}

// =========================================
// ৮. মডাল ও ক্যাটাগরি ডেটা (অ্যাকশন কলাম হাইড সহ)
// =========================================
function openCategoryModal(categoryId, title) {
    currentCategory = categoryId;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('data-modal').classList.remove('hidden');
    document.getElementById('search-modal').value = '';
    loadCategoryData();
}

function closeCategoryModal() {
    document.getElementById('data-modal').classList.add('hidden');
    currentCategory = '';
}

function loadCategoryData() {
    if(!currentCategory) return;
    const catRef = window.dbRef(window.database, `funds/${currentYear}/${currentCategory}`);
    window.dbOnValue(catRef, (snapshot) => {
        const tbody = document.getElementById('modal-table-body');
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                const safeName = item.name.replace(/"/g, '&quot;');
                
                // শুধুমাত্র অ্যাডমিন হলে পুরো অ্যাকশন কলাম (শেয়ার, এডিট, ডিলিট) লোড হবে
                const actionHtml = isAdmin ? `
                    <td class="admin-only no-print" style="white-space: nowrap;">
                        <button onclick="shareWhatsApp('${safeName}', '${item.amount}')" style="background:#25D366;color:white;border:none;padding:5px 8px;border-radius:4px;cursor:pointer;font-size:11px;margin-right:3px;font-weight:bold;">💬 শেয়ার</button>
                        <button class="edit-entry-btn" data-name="${safeName}" data-amount="${item.amount}" onclick="editCategory('${key}', this.getAttribute('data-name'), this.getAttribute('data-amount'))">এডিট</button>
                        <button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/${currentCategory}/${key}')">ডিলিট</button>
                    </td>` : '<td class="admin-only hidden no-print"></td>';
                
                tbody.innerHTML += `
                    <tr>
                        <td>${item.date}</td>
                        <td>${item.name}</td>
                        <td style="color:#2ed573; font-weight:bold;">₹${item.amount}</td>
                        ${actionHtml}
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">কোনো এন্ট্রি নেই</td></tr>`;
        }
    });
}

// =========================================
// ৯. ডেটা সেভ করা (DD/MM/YYYY কনভার্টার সহ)
// =========================================
function addNewNotice() {
    const text = document.getElementById('new-notice-text').value;
    if (!text) { alert("নোটিশ ফাঁকা রাখা যাবে না!"); return; }
    const dateStr = getFormattedDate(); // DD/MM/YYYY
    window.dbPush(window.dbRef(window.database, `notices/${currentYear}`), { text: text, date: dateStr })
        .then(() => document.getElementById('new-notice-text').value = '');
}

function addExpenseEntry() {
    const purpose = document.getElementById('exp-purpose').value;
    const amount = document.getElementById('exp-amount').value;
    const dateInput = document.getElementById('exp-date').value;
    const dateStr = getFormattedDate(dateInput); // DD/MM/YYYY
    if (!purpose || !amount) { alert("বিবরণ এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    window.dbPush(window.dbRef(window.database, `funds/${currentYear}/expenses`), { purpose: purpose, amount: Number(amount), date: dateStr })
        .then(() => { document.getElementById('exp-purpose').value = ''; document.getElementById('exp-amount').value = ''; });
}

function addCategoryDataEntry() {
    const name = document.getElementById('data-name').value;
    const amount = document.getElementById('data-amount').value;
    const dateInput = document.getElementById('data-date').value;
    const dateStr = getFormattedDate(dateInput); // DD/MM/YYYY
    if (!name || !amount) { alert("নাম এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    window.dbPush(window.dbRef(window.database, `funds/${currentYear}/${currentCategory}`), { name: name, amount: Number(amount), date: dateStr })
        .then(() => { document.getElementById('data-name').value = ''; document.getElementById('data-amount').value = ''; });
}

// =========================================
// ১০. ডেটা এডিট করা (Edit)
// =========================================
function editNotice(key, currentText) {
    const newText = prompt("নোটিশ আপডেট করুন:", currentText);
    if (newText !== null && newText.trim() !== "" && newText !== currentText) {
        window.dbUpdate(window.dbRef(window.database, `notices/${currentYear}/${key}`), { text: newText });
    }
}

function editExpense(key, currentPurpose, currentAmount) {
    const newPurpose = prompt("খরচের বিবরণ আপডেট করুন:", currentPurpose);
    if (newPurpose === null) return; 
    const newAmountStr = prompt("টাকার পরিমাণ আপডেট করুন (₹):", currentAmount);
    if (newAmountStr === null) return;
    if (newPurpose.trim() !== "" && newAmountStr.trim() !== "") {
        window.dbUpdate(window.dbRef(window.database, `funds/${currentYear}/expenses/${key}`), { purpose: newPurpose, amount: Number(newAmountStr) });
    }
}

function editCategory(key, currentName, currentAmount) {
    const newName = prompt("নাম / বিবরণ আপডেট করুন:", currentName);
    if (newName === null) return;
    const newAmountStr = prompt("টাকার পরিমাণ আপডেট করুন (₹):", currentAmount);
    if (newAmountStr === null) return;
    if (newName.trim() !== "" && newAmountStr.trim() !== "") {
        window.dbUpdate(window.dbRef(window.database, `funds/${currentYear}/${currentCategory}/${key}`), { name: newName, amount: Number(newAmountStr) });
    }
}

// =========================================
// ১১. ডেটা ডিলিট করা
// =========================================
function deleteData(path) {
    if(confirm("আপনি কি নিশ্চিত যে এই এন্ট্রিটি ডিলিট করতে চান?")) {
        window.dbRemove(window.dbRef(window.database, path));
    }
}

// =========================================
// ১২. ভিউ কাউন্টার লজিক
// =========================================
function setupViewCounter() {
    const viewsRef = window.dbRef(window.database, 'system/viewCount');
    window.dbOnValue(viewsRef, (snapshot) => {
        let count = snapshot.exists() ? snapshot.val() : 0;
        const counterElement = document.getElementById('app-view-count');
        if (counterElement) {
            counterElement.innerText = count.toLocaleString('bn-IN');
        }
    });

    if (!sessionStorage.getItem('hasCountedView')) {
        window.dbOnValue(viewsRef, (snapshot) => {
            let currentCount = snapshot.exists() ? snapshot.val() : 0;
            window.dbSet(viewsRef, currentCount + 1);
            sessionStorage.setItem('hasCountedView', 'true');
        }, { onlyOnce: true });
    }
}

// =========================================
// ১৩. লাইভ সার্চ (Live Search)
// =========================================
function searchTable(inputId, tbodyId) {
    let input = document.getElementById(inputId).value.toLowerCase();
    let rows = document.getElementById(tbodyId).getElementsByTagName('tr');
    
    for (let i = 0; i < rows.length; i++) {
        let text = rows[i].getElementsByTagName('td')[1];
        if (text) {
            let textValue = text.innerText.toLowerCase();
            if (textValue.includes(input)) {
                rows[i].style.display = "";
            } else {
                rows[i].style.display = "none";
            }
        }
    }
}

// =========================================
// ১৪. হোয়াটসঅ্যাপ শেয়ার (WhatsApp Share)
// =========================================
function shareWhatsApp(name, amount) {
    const message = `নমস্কার ${name}, গ্রাম পুজো কমিটির তরফ থেকে জানানো হচ্ছে যে, আপনার দেওয়া ${amount} টাকা সফলভাবে পুজো তহবিলে জমা হয়েছে। ধন্যবাদ! 🙏`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// =========================================
// ১৫. পিডিএফ / প্রিন্ট রিপোর্ট (PDF / Print)
// =========================================
function printSection(title, containerId) {
    let tableHtml = document.getElementById(containerId).innerHTML;
    let printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>' + title + ' রিপোর্ট</title>');
    printWindow.document.write(`
        <style>
            body { font-family: sans-serif; padding: 20px; color: black; }
            h2 { text-align: center; color: #333; margin-bottom: 20px; border-bottom: 2px solid #ccc; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #333; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; color: black; font-weight: bold; }
            .no-print { display: none !important; }
            .hidden { display: none !important; }
        </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>' + title + ' (' + currentYear + ' সাল)</h2>');
    printWindow.document.write(tableHtml);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

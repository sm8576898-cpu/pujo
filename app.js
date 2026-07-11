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
// ৪. ক্লাব প্রোফাইল লোড এবং এডিট
// =========================================
function loadClubDetails() {
    const clubRef = window.dbRef(window.database, 'system/clubDetails');
    window.dbOnValue(clubRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('display-club-name').innerText = data.name || "🪔 আমাদের গ্রাম্য পুজো কমিটি";
            document.getElementById('display-club-address').innerText = "📍 গ্রাম + পোস্ট: " + (data.address || "বাগনান, উলুবেড়িয়া, হাওড়া");
            
            let contactText = "";
            if (data.mobile) contactText += `📞 মোবাইল: ${data.mobile} `;
            if (data.date) contactText += `| 📅 পুজোর তারিখ: ${data.date}`;
            if (!contactText) contactText = "📞 মোবাইল ও তারিখ অ্যাডমিন প্যানেল থেকে যোগ করুন";
            
            document.getElementById('display-club-contact').innerText = contactText;
        } else {
            document.getElementById('display-club-contact').innerText = "📞 মোবাইল ও তারিখ অ্যাডমিন প্যানেল থেকে যোগ করুন";
        }
    });
}

function openClubEditModal() {
    const clubRef = window.dbRef(window.database, 'system/clubDetails');
    window.dbOnValue(clubRef, (snapshot) => {
        const data = snapshot.exists() ? snapshot.val() : {};
        document.getElementById('edit-club-name').value = data.name || "🪔 আমাদের গ্রাম্য পুজো কমিটি";
        document.getElementById('edit-club-address').value = data.address || "বাগনান, উলুবেড়িয়া, হাওড়া";
        document.getElementById('edit-club-mobile').value = data.mobile || "";
        document.getElementById('edit-club-date').value = data.date || "";
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
    const date = document.getElementById('edit-club-date').value.trim();

    if (!name) { alert("ক্লাবের নাম ফাঁকা রাখা যাবে না!"); return; }

    window.dbSet(window.dbRef(window.database, 'system/clubDetails'), {
        name: name,
        address: address,
        mobile: mobile,
        date: date
    }).then(() => {
        alert("ক্লাবের বিবরণ সফলভাবে আপডেট হয়েছে!");
        closeClubEditModal();
    });
}

// =========================================
// ৫. ডেটা লোড করা (Notices, Funds, Expenses, Gallery)
// =========================================
function loadAllData() {
    loadNotices();
    loadFinancialData();
    loadExpenses();
    loadGallery(); // নতুন: গ্যালারি লোড হবে
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
        if (snapshot.exists()) {
            const data = snapshot.val();
            ['mukto_haste', 'guest_card', 'matha_pichu', 'adhai'].forEach(cat => {
                if (data[cat]) Object.values(data[cat]).forEach(item => totalIncome += Number(item.amount || 0));
            });
            if (data.expenses) Object.values(data.expenses).forEach(item => totalExpense += Number(item.amount || 0));
        }
        document.getElementById('total-income').innerText = `₹${totalIncome.toFixed(2)}`;
        document.getElementById('total-expense').innerText = `₹${totalExpense.toFixed(2)}`;
        document.getElementById('net-balance').innerText = `₹${(totalIncome - totalExpense).toFixed(2)}`;
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
// ৬. নতুন: গ্যালারি ও পিডিএফ লোড এবং আপলোড (Max 1MB)
// =========================================
function uploadToGallery() {
    const fileInput = document.getElementById('gallery-file-input');
    const titleInput = document.getElementById('gallery-title').value.trim();
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert("দয়া করে একটি ছবি বা PDF ফাইল সিলেক্ট করুন!");
        return;
    }
    if (!titleInput) {
        alert("দয়া করে ছবি বা ডকুমেন্টের একটা নাম বা বিবরণ দিন!");
        return;
    }
    
    const file = fileInput.files[0];
    const maxSize = 1024 * 1024; // 1 MB in Bytes (ঠিক ১ এমবি লিমিট)
    
    if (file.size > maxSize) {
        alert("⚠️ ফাইল সাইজ ১ এমবি (1MB)-র চেয়ে বড়! দয়া করে 1MB-র নিচের ফাইল সিলেক্ট করুন।");
        fileInput.value = '';
        return;
    }
    
    // ফাইলকে Base64 ডেটায় রূপান্তর করে ডেটাবেসে সেভ করা হচ্ছে
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Data = e.target.result;
        const dateStr = new Date().toLocaleDateString('bn-IN');
        
        window.dbPush(window.dbRef(window.database, `gallery/${currentYear}`), {
            title: titleInput,
            url: base64Data,
            type: file.type,
            date: dateStr
        }).then(() => {
            alert("ফাইল সফলভাবে গ্যালারিতে আপলোড হয়েছে!");
            fileInput.value = '';
            document.getElementById('gallery-title').value = '';
        }).catch(err => {
            alert("আপলোড ব্যর্থ হয়েছে! নেটওয়ার্ক চেক করুন।");
            console.error(err);
        });
    };
    reader.readAsDataURL(file);
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
                
                // ছবি হলে ইমেজ দেখাবে, PDF হলে ডাউনলোড বাটন দেখাবে
                if (item.url && item.url.startsWith('data:image')) {
                    previewHtml = `<img src="${item.url}" alt="${item.title}" onclick="window.open('${item.url}', '_blank')" style="cursor:pointer;" title="বড় করে দেখতে ক্লিক করুন">`;
                } else {
                    previewHtml = `
                        <div class="pdf-preview-box">
                            📄
                            <span style="font-size:12px; color:#fff; margin-top:8px;">PDF ডকুমেন্ট</span>
                            <a href="${item.url}" download="${item.title}.pdf" class="pdf-download-btn" style="margin-top:10px;">⬇️ ডাউনলোড করুন</a>
                        </div>`;
                }
                
                const deleteHtml = isAdmin ? `
                    <div style="margin-top:8px;">
                        <button class="delete-entry-btn" onclick="deleteData('gallery/${currentYear}/${key}')" style="background:#ff4757; width:80%;">🗑️ ডিলিট করুন</button>
                    </div>` : '';
                
                grid.innerHTML += `
                    <div class="gallery-card">
                        ${previewHtml}
                        <h4>${item.title}</h4>
                        <p>📅 ${item.date}</p>
                        ${deleteHtml}
                    </div>
                `;
            });
        } else {
            grid.innerHTML = '<p style="color:#a0a0b5; font-size:14px; grid-column: 1/-1; text-align:center;">এই সালের গ্যালারিতে কোনো ছবি বা ডকুমেন্ট আপলোড করা হয়নি।</p>';
        }
    });
}

// =========================================
// ৭. মডাল ও ক্যাটাগরি ডেটা
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
                
                const editDelHtml = isAdmin ? `
                    <button class="edit-entry-btn" data-name="${safeName}" data-amount="${item.amount}" onclick="editCategory('${key}', this.getAttribute('data-name'), this.getAttribute('data-amount'))">এডিট</button>
                    <button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/${currentCategory}/${key}')">ডিলিট</button>
                ` : '';
                
                const actionHtml = `
                    <td class="no-print" style="white-space: nowrap;">
                        <button onclick="shareWhatsApp('${safeName}', '${item.amount}')" style="background:#25D366;color:white;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;margin-right:5px;font-weight:bold;">💬 শেয়ার</button>
                        ${editDelHtml}
                    </td>`;
                
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
// ৮. ডেটা সেভ করা (Add)
// =========================================
function addNewNotice() {
    const text = document.getElementById('new-notice-text').value;
    if (!text) { alert("নোটিশ ফাঁকা রাখা যাবে না!"); return; }
    const dateStr = new Date().toLocaleDateString('bn-IN');
    window.dbPush(window.dbRef(window.database, `notices/${currentYear}`), { text: text, date: dateStr })
        .then(() => document.getElementById('new-notice-text').value = '');
}

function addExpenseEntry() {
    const purpose = document.getElementById('exp-purpose').value;
    const amount = document.getElementById('exp-amount').value;
    let date = document.getElementById('exp-date').value || new Date().toISOString().split('T')[0];
    if (!purpose || !amount) { alert("বিবরণ এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    window.dbPush(window.dbRef(window.database, `funds/${currentYear}/expenses`), { purpose: purpose, amount: Number(amount), date: date })
        .then(() => { document.getElementById('exp-purpose').value = ''; document.getElementById('exp-amount').value = ''; });
}

function addCategoryDataEntry() {
    const name = document.getElementById('data-name').value;
    const amount = document.getElementById('data-amount').value;
    let date = document.getElementById('data-date').value || new Date().toISOString().split('T')[0];
    if (!name || !amount) { alert("নাম এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    window.dbPush(window.dbRef(window.database, `funds/${currentYear}/${currentCategory}`), { name: name, amount: Number(amount), date: date })
        .then(() => { document.getElementById('data-name').value = ''; document.getElementById('data-amount').value = ''; });
}

// =========================================
// ৯. ডেটা এডিট করা (Edit)
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
// ১০. ডেটা ডিলিট করা
// =========================================
function deleteData(path) {
    if(confirm("আপনি কি নিশ্চিত যে এই এন্ট্রিটি ডিলিট করতে চান?")) {
        window.dbRemove(window.dbRef(window.database, path));
    }
}

// =========================================
// ১১. ভিউ কাউন্টার লজিক
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
// ১২. লাইভ সার্চ (Live Search)
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
// ১৩. হোয়াটসঅ্যাপ শেয়ার (WhatsApp Share)
// =========================================
function shareWhatsApp(name, amount) {
    const message = `নমস্কার ${name}, গ্রাম পুজো কমিটির তরফ থেকে জানানো হচ্ছে যে, আপনার দেওয়া ${amount} টাকা সফলভাবে পুজো তহবিলে জমা হয়েছে। ধন্যবাদ! 🙏`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// =========================================
// ১৪. পিডিএফ / প্রিন্ট রিপোর্ট (PDF / Print)
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

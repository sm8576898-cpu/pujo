// app.js - Full Complete Code

let isAdmin = false;
let currentYear = new Date().getFullYear().toString(); // ডিফল্ট চলতি বছর (যেমন: ২০২৬)
let currentCategory = ''; // মডাল খুললে কোন ক্যাটাগরিতে ডেটা যাবে তার জন্য

// =========================================
// ১. ইনিশিয়ালাইজেশন এবং লগইন চেক
// =========================================
window.onload = () => {
    // বছর সিলেক্টর তৈরি করা
    setupYearSelector();

    setTimeout(() => {
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
                // লগইন অবস্থা চেক করার পর ডেটা লোড করো
                loadAllData();
            });
        }
    }, 1000);
};

// =========================================
// ২. অ্যাডমিন লগইন / লগআউট কন্ট্রোল
// =========================================
function toggleAdminModal() {
    document.getElementById('auth-modal').classList.toggle('hidden');
}

function submitAdminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;

    if (!email || !password) {
        alert("দয়া করে ইমেইল এবং পিন দুটোই দিন!");
        return;
    }

    window.signInWithEmailAndPassword(window.auth, email, password)
        .then(() => {
            alert("লগইন সফল হয়েছে!");
            toggleAdminModal();
            document.getElementById('admin-email').value = '';
            document.getElementById('admin-password').value = '';
        })
        .catch((error) => {
            console.error("লগইন এরর:", error.message);
            alert("ভুল ইমেইল বা পাসওয়ার্ড! আবার চেষ্টা করুন।");
        });
}

function logoutAdmin() {
    if(confirm("আপনি কি লগআউট করতে চান?")) {
        window.signOut(window.auth).then(() => {
            alert("লগআউট সফল হয়েছে!");
        }).catch(error => console.error("লগআউট এরর:", error));
    }
}

// =========================================
// ৩. বছরের হিসাব কন্ট্রোল (Year Setup)
// =========================================
function setupYearSelector() {
    const yearSelect = document.getElementById('year-select');
    yearSelect.innerHTML = `<option value="${currentYear}">${currentYear}</option>`;
}

function handleYearChange() {
    currentYear = document.getElementById('year-select').value;
    loadAllData();
}

// =========================================
// ৪. ফায়ারবেস থেকে ডেটা লোড করা (Real-time)
// =========================================
function loadAllData() {
    loadNotices();
    loadFinancialData();
    loadExpenses();
}

// নোটিশ লোড করা
function loadNotices() {
    const noticesRef = window.dbRef(window.database, 'notices');
    window.dbOnValue(noticesRef, (snapshot) => {
        const noticeList = document.getElementById('notice-list');
        noticeList.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            // ডেটা উল্টো করে (নতুনটা আগে) সাজানো
            Object.keys(data).reverse().forEach(key => {
                const notice = data[key];
                const deleteBtn = isAdmin ? `<button onclick="deleteData('notices/${key}')" style="background:red;color:white;border:none;padding:2px 5px;font-size:10px;cursor:pointer;margin-top:5px;border-radius:3px;">Delete</button>` : '';
                noticeList.innerHTML += `
                    <div class="notice-item">
                        <span class="notice-date">${notice.date}</span>
                        ${notice.text}
                        <div class="notice-actions">${deleteBtn}</div>
                    </div>
                `;
            });
        } else {
            noticeList.innerHTML = '<p style="color:#a0a0b5; font-size:13px;">কোনো নোটিশ নেই।</p>';
        }
    });
}

// মূল তহবিলের হিসাব লোড করা
function loadFinancialData() {
    const yearRef = window.dbRef(window.database, `funds/${currentYear}`);
    window.dbOnValue(yearRef, (snapshot) => {
        let totalIncome = 0;
        let totalExpense = 0;

        if (snapshot.exists()) {
            const data = snapshot.val();
            
            // আয়ের ক্যাটাগরিগুলো যোগ করা
            const incomeCategories = ['mukto_haste', 'guest_card', 'matha_pichu', 'adhai'];
            incomeCategories.forEach(cat => {
                if (data[cat]) {
                    Object.values(data[cat]).forEach(item => {
                        totalIncome += Number(item.amount || 0);
                    });
                }
            });

            // খরচের হিসাব যোগ করা
            if (data.expenses) {
                Object.values(data.expenses).forEach(item => {
                    totalExpense += Number(item.amount || 0);
                });
            }
        }

        // ড্যাশবোর্ডে আপডেট করা
        document.getElementById('total-income').innerText = `₹${totalIncome.toFixed(2)}`;
        document.getElementById('total-expense').innerText = `₹${totalExpense.toFixed(2)}`;
        document.getElementById('net-balance').innerText = `₹${(totalIncome - totalExpense).toFixed(2)}`;
    });
}

// খরচের তালিকা লোড করা
function loadExpenses() {
    const expensesRef = window.dbRef(window.database, `funds/${currentYear}/expenses`);
    window.dbOnValue(expensesRef, (snapshot) => {
        const tbody = document.getElementById('expense-table-body');
        tbody.innerHTML = '';
        if (snapshot.exists()) {
            const data = snapshot.val();
            Object.keys(data).reverse().forEach(key => {
                const item = data[key];
                const actionHtml = isAdmin ? `<td class="admin-only"><button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/expenses/${key}')">ডিলিট</button></td>` : '<td class="admin-only hidden"></td>';
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
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#a0a0b5;">কোনো খরচের হিসাব নেই</td></tr>`;
        }
    });
}

// =========================================
// ৫. ডেটা সেভ করার ফাংশন (Add Data)
// =========================================

// নোটিশ যোগ করা
function addNewNotice() {
    const text = document.getElementById('new-notice-text').value;
    if (!text) { alert("নোটিশ ফাঁকা রাখা যাবে না!"); return; }

    const dateStr = new Date().toLocaleDateString('bn-IN');
    const noticesRef = window.dbRef(window.database, 'notices');
    
    window.dbPush(noticesRef, { text: text, date: dateStr }).then(() => {
        document.getElementById('new-notice-text').value = '';
    }).catch(error => alert("এরর: " + error.message));
}

// খরচ যোগ করা
function addExpenseEntry() {
    const purpose = document.getElementById('exp-purpose').value;
    const amount = document.getElementById('exp-amount').value;
    let date = document.getElementById('exp-date').value;

    if (!purpose || !amount) { alert("বিবরণ এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    if (!date) { date = new Date().toISOString().split('T')[0]; } // আজকের তারিখ

    const expensesRef = window.dbRef(window.database, `funds/${currentYear}/expenses`);
    
    window.dbPush(expensesRef, { purpose: purpose, amount: Number(amount), date: date }).then(() => {
        document.getElementById('exp-purpose').value = '';
        document.getElementById('exp-amount').value = '';
        document.getElementById('exp-date').value = '';
    }).catch(error => alert("এরর: " + error.message));
}

// =========================================
// ৬. মডাল কন্ট্রোল ও ক্যাটাগরি ডেটা (মুক্ত হস্ত, চাঁদা ইত্যাদি)
// =========================================
function openCategoryModal(categoryId, title) {
    currentCategory = categoryId;
    document.getElementById('modal-title').innerText = title;
    document.getElementById('data-modal').classList.remove('hidden');
    loadCategoryData();
}

function closeCategoryModal() {
    document.getElementById('data-modal').classList.add('hidden');
    currentCategory = '';
}

// মডালের ভেতরের টেবিল লোড করা
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
                const actionHtml = isAdmin ? `<td class="admin-only"><button class="delete-entry-btn" onclick="deleteData('funds/${currentYear}/${currentCategory}/${key}')">ডিলিট</button></td>` : '<td class="admin-only hidden"></td>';
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
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#a0a0b5;">কোনো এন্ট্রি নেই</td></tr>`;
        }
    });
}

// ক্যাটাগরিতে নতুন এন্ট্রি করা
function addCategoryDataEntry() {
    const name = document.getElementById('data-name').value;
    const amount = document.getElementById('data-amount').value;
    let date = document.getElementById('data-date').value;

    if (!name || !amount) { alert("নাম এবং টাকার পরিমাণ দিতেই হবে!"); return; }
    if (!date) { date = new Date().toISOString().split('T')[0]; }

    const catRef = window.dbRef(window.database, `funds/${currentYear}/${currentCategory}`);
    
    window.dbPush(catRef, { name: name, amount: Number(amount), date: date }).then(() => {
        document.getElementById('data-name').value = '';
        document.getElementById('data-amount').value = '';
        document.getElementById('data-date').value = '';
    }).catch(error => alert("এরর: " + error.message));
}

// =========================================
// ৭. ডেটা ডিলিট করার ফাংশন
// =========================================
function deleteData(path) {
    if(confirm("আপনি কি নিশ্চিত যে এই এন্ট্রিটি ডিলিট করতে চান?")) {
        const itemRef = window.dbRef(window.database, path);
        window.dbRemove(itemRef).catch(error => alert("ডিলিট করতে এরর হয়েছে: " + error.message));
    }
}

// =========================================
// ৮. ক্লাব প্রোফাইল এডিট
// =========================================
function toggleClubEditModal(show) {
    const modal = document.getElementById('club-edit-modal');
    if (show) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}
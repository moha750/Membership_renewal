'use strict';

// Ensure Supabase client exists (from supabase-config.js)
if (!window.supabaseClient) {
  console.error('Supabase client not initialized. Check supabase-config.js');
}

const tableWrap = document.getElementById('tableWrap');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const refreshBtn = document.getElementById('refreshBtn');
const totalCountEl = document.getElementById('totalCount');
const renewCountEl = document.getElementById('renewCount');
const notRenewCountEl = document.getElementById('notRenewCount');
const renewPctEl = document.getElementById('renewPct');
const notRenewPctEl = document.getElementById('notRenewPct');

let cache = [];

function updateStats(rows) {
  const total = rows?.length || 0;
  const renew = rows?.filter(r => String(r.action || '') === 'تجديد العضوية').length || 0;
  const notRenew = rows?.filter(r => String(r.action || '') === 'عدم التجديد').length || 0;
  const pct = (n, d) => d > 0 ? Math.round((n / d) * 100) + '%' : '0%';

  if (totalCountEl) totalCountEl.textContent = String(total);
  if (renewCountEl) renewCountEl.textContent = String(renew);
  if (notRenewCountEl) notRenewCountEl.textContent = String(notRenew);
  if (renewPctEl) renewPctEl.textContent = pct(renew, total);
  if (notRenewPctEl) notRenewPctEl.textContent = pct(notRenew, total);
}

function renderTable(rows) {
  if (!rows || rows.length === 0) {
    tableWrap.innerHTML = '<div class="empty">لا توجد بيانات</div>';
    updateStats([]);
    return;
  }

  const html = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الاسم</th>
          <th>الحالة</th>
          <th>تاريخ التسجيل</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r, i) => `
              <tr>
                <td>${rows.length - i}</td>
                <td>${escapeHtml(r.name || '')}</td>
                <td>${renderStatus(r.action)}</td>
                <td>${formatDate(r.created_at)}</td>
              </tr>
            `
          )
          .join('')}
      </tbody>
    </table>
  `;
  tableWrap.innerHTML = html;
  updateStats(rows);
}

function renderStatus(actionRaw) {
  const action = String(actionRaw || '');
  if (action === 'تجديد العضوية') {
    return '<span class="status-badge renew">تجديد العضوية</span>';
  }
  if (action === 'عدم التجديد') {
    return '<span class="status-badge not-renew">عدم التجديد</span>';
  }
  return escapeHtml(action);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  // Format: yyyy-mm-dd hh:MM ص/م (12-hour)
  const pad = (n) => String(n).padStart(2, '0');
  let hours = d.getHours();
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hours)}:${pad(d.getMinutes())} ${period}`;
}

function normalizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function dedupeByName(rows) {
  const byName = new Map();
  for (const r of rows || []) {
    const key = normalizeName(r.name);
    if (!key) continue;
    const prev = byName.get(key);
    if (!prev) {
      byName.set(key, r);
    } else {
      const prevTime = new Date(prev.created_at || 0).getTime();
      const currTime = new Date(r.created_at || 0).getTime();
      if (currTime >= prevTime) {
        byName.set(key, r);
      }
    }
  }
  // Include entries with empty names as-is (unique by identity)
  const empties = (rows || []).filter(r => !normalizeName(r.name));
  return [...byName.values(), ...empties];
}

async function fetchRegistrations() {
  tableWrap.innerHTML = '<div class="empty">جارٍ التحميل...</div>';
  const { data, error } = await window.supabaseClient
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    if (window.Swal) {
      Swal.fire({ icon: 'error', title: 'خطأ في الجلب', text: error.message || 'تعذر جلب البيانات' });
    }
    tableWrap.innerHTML = '<div class="empty">تعذر جلب البيانات</div>';
    return [];
  }

  const rows = Array.isArray(data) ? data : [];
  cache = dedupeByName(rows);
  applyFilter();
  return cache;
}

function applyFilter() {
  const q = (searchInput.value || '').toLowerCase().trim();
  const status = (statusFilter && statusFilter.value) ? statusFilter.value : '';

  let rows = cache;

  if (q) {
    rows = rows.filter((r) => {
      const name = String(r.name || '').toLowerCase();
      const action = String(r.action || '').toLowerCase();
      return name.includes(q) || action.includes(q);
    });
  }

  if (status) {
    rows = rows.filter((r) => String(r.action || '') === status);
  }

  renderTable(rows);
}

// Realtime updates: reflect DB changes without manual refresh
let registrationsChannel;

function upsertIntoCache(row) {
  if (!row) return;
  const id = row.id;
  if (id == null) return;
  const idx = cache.findIndex(r => r.id === id);
  if (idx === -1) {
    cache.unshift(row);
  } else {
    cache[idx] = row;
  }
}

function removeFromCache(row) {
  if (!row) return;
  const id = row.id;
  if (id == null) return;
  cache = cache.filter(r => r.id !== id);
}

function setupRealtime() {
  if (!window.supabaseClient || registrationsChannel) return;
  registrationsChannel = window.supabaseClient
    .channel('registrations-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, (payload) => {
      try {
        if (payload.eventType === 'INSERT') {
          upsertIntoCache(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          upsertIntoCache(payload.new);
        } else if (payload.eventType === 'DELETE') {
          removeFromCache(payload.old);
        }
        // Ensure deduplication and refresh view
        cache = dedupeByName(cache);
        applyFilter();
      } catch (e) {
        console.warn('Realtime apply failed, refetching...', e);
        fetchRegistrations();
      }
    })
    .subscribe((status) => {
      // Optional: could log status
    });
}
searchInput.addEventListener('input', applyFilter);
statusFilter && statusFilter.addEventListener('change', applyFilter);
refreshBtn && refreshBtn.addEventListener('click', () => {
  // Reload the whole page
  location.reload();
});

// initial load + realtime
fetchRegistrations().then(setupRealtime);

// Back to Top button behavior (static button under users-card)
document.addEventListener('DOMContentLoaded', () => {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  // Smooth scroll to top on click
  backToTopBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

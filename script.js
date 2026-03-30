/**
 * Smart Traffic Fine Verification & Dispute System
 * script.js — Main Frontend Logic
 */

/* ========================================
   SHARED UTILITIES
   ======================================== */

/** Mark the active nav link based on current page */
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

/** Show an alert inside a container element */
function showAlert(containerId, type, message) {
  const icons = { error: '⚠️', success: '✅', info: 'ℹ️' };
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="alert alert-${type}">
      <span>${icons[type] || ''}</span>
      <span>${message}</span>
    </div>`;
}

/** Show loading spinner */
function showSpinner(containerId, message = 'Fetching data…') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="spinner-wrap">
      <div class="spinner"></div>
      <span>${message}</span>
    </div>`;
}

/** Hide an element by id */
function hide(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/** Show an element by id */
function show(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

/** Read URL query param */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

/* ========================================
   INDEX PAGE — Vehicle Search
   ======================================== */

function initIndexPage() {
  setActiveNav();
  const form = document.getElementById('searchForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = document.getElementById('vehicleInput');
    const val = input.value.trim().toUpperCase();
    if (!val) {
      showAlert('alertBox', 'error', 'Please enter a vehicle number.');
      return;
    }
    // Redirect to fine details page
    window.location.href = `fine.html?vehicle=${encodeURIComponent(val)}`;
  });

  // Auto-uppercase input
  const inp = document.getElementById('vehicleInput');
  if (inp) inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase(); });
}

/* ========================================
   FINE DETAILS PAGE
   ======================================== */

function initFinePage() {
  setActiveNav();
  const vehicleNumber = getParam('vehicle');
  const resultBox = document.getElementById('resultBox');

  if (!vehicleNumber) {
    resultBox.innerHTML = `<div class="alert alert-error">⚠️ No vehicle number provided. <a href="index.html">Go back</a></div>`;
    return;
  }

  // Show vehicle number in heading
  const vnLabel = document.getElementById('vehicleLabel');
  if (vnLabel) vnLabel.textContent = vehicleNumber;

  // Show spinner
  showSpinner('resultBox', `Looking up records for ${vehicleNumber}…`);

  // Fetch from PHP backend
  fetch(`backend/get_fine.php?vehicle=${encodeURIComponent(vehicleNumber)}`)
    .then(res => res.json())
    .then(data => {
      if (data.status === 'found') {
        renderFineCard(data.fine);
      } else {
        resultBox.innerHTML = `
          <div class="empty-state">
            <div class="icon">🔍</div>
            <h3>No Fine Found</h3>
            <p>We couldn't find any pending fine for <strong>${vehicleNumber}</strong>.</p>
            <br>
            <a href="index.html" class="btn btn-outline" style="margin-top:1rem">← Search Again</a>
          </div>`;
      }
    })
    .catch(err => {
      console.error(err);
      resultBox.innerHTML = `<div class="alert alert-error">⚠️ Error connecting to server. Make sure XAMPP is running and the backend is set up.</div>`;
    });
}

function renderFineCard(fine) {
  const resultBox = document.getElementById('resultBox');

  // Build Google Maps embed URL using static coordinates
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY&q=${fine.latitude},${fine.longitude}&zoom=15`;
  // fallback static map iframe (OpenStreetMap, no API key needed)
  const osmSrc = `https://maps.google.com/maps?q=${fine.latitude},${fine.longitude}&z=15&output=embed`;

  const html = `
    <div class="fine-card">
      <div class="fine-card-header">
        <div>
          <div style="font-size:0.75rem;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.3rem;">Vehicle Number</div>
          <div class="vehicle-num">${fine.vehicle_number}</div>
        </div>
        <span class="violation-badge">${fine.violation}</span>
      </div>

      <div class="fine-card-body">
        <!-- Left: details -->
        <div>
          <div class="fine-details-grid">
            <div class="detail-item">
              <label>Date</label>
              <div class="value">${formatDate(fine.date)}</div>
            </div>
            <div class="detail-item">
              <label>Time</label>
              <div class="value">${fine.time || '—'}</div>
            </div>
            <div class="detail-item" style="grid-column:1/-1">
              <label>Location</label>
              <div class="value">${fine.location}</div>
            </div>
            <div class="detail-item" style="grid-column:1/-1">
              <label>Violation</label>
              <div class="value">${fine.violation}</div>
            </div>
            <div class="detail-item amount" style="grid-column:1/-1">
              <label>Fine Amount</label>
              <div class="value">₹ ${Number(fine.amount).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <!-- Right: evidence image -->
        <div class="evidence-section">
          <h3>📷 Evidence</h3>
          <div class="evidence-img-wrap" onclick="openLightbox('${fine.image_url}')">
            <img src="${fine.image_url}" alt="Evidence" onerror="this.src='https://placehold.co/600x400/161a22/7a8499?text=Evidence+Image'">
            <div class="zoom-hint">🔍 Click to zoom</div>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div style="padding:0 2rem 2rem">
        <div class="map-section">
          <h3>📍 Violation Location</h3>
          <iframe
            src="${osmSrc}"
            allowfullscreen
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            title="Violation Location Map">
          </iframe>
        </div>
      </div>

      <div class="fine-card-footer">
        <a href="dispute.html?vehicle=${encodeURIComponent(fine.vehicle_number)}&fine_id=${fine.id}"
           class="btn btn-danger">⚖️ Raise a Dispute</a>
        <a href="status.html" class="btn btn-outline">📋 Track Status</a>
        <a href="index.html" class="btn btn-outline">← Back</a>
      </div>
    </div>
  `;

  resultBox.innerHTML = html;
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

/* ---- Lightbox ---- */
function openLightbox(src) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.querySelector('img').src = src;
  lb.classList.add('open');
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
}

/* ========================================
   DISPUTE FORM PAGE
   ======================================== */

function initDisputePage() {
  setActiveNav();
  const vehicleNumber = getParam('vehicle');
  const fineId = getParam('fine_id');

  // Pre-fill vehicle number
  const vInput = document.getElementById('disputeVehicle');
  if (vInput && vehicleNumber) {
    vInput.value = vehicleNumber;
  }

  const fineInput = document.getElementById('disputeFineId');
  if (fineInput && fineId) {
    fineInput.value = fineId;
  }

  const form = document.getElementById('disputeForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    submitDispute(form);
  });
}

function submitDispute(form) {
  // Basic validation
  const name    = form.querySelector('#name').value.trim();
  const email   = form.querySelector('#email').value.trim();
  const vehicle = form.querySelector('#disputeVehicle').value.trim();
  const reason  = form.querySelector('#reason').value.trim();

  if (!name || !email || !vehicle || !reason) {
    showAlert('formAlert', 'error', 'Please fill in all required fields.');
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const formData = new FormData(form);

  fetch('backend/submit_dispute.php', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Dispute';

      if (data.status === 'success') {
        form.reset();
        showAlert('formAlert', 'success',
          `✅ Dispute submitted successfully! Your reference ID is <strong>#${data.dispute_id}</strong>. We'll respond within 5–7 business days.`);
        // Scroll to alert
        document.getElementById('formAlert').scrollIntoView({ behavior: 'smooth' });
      } else {
        showAlert('formAlert', 'error', data.message || 'Something went wrong. Please try again.');
      }
    })
    .catch(err => {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Dispute';
      showAlert('formAlert', 'error', 'Server error. Make sure XAMPP is running.');
    });
}

/* ========================================
   STATUS TRACKING PAGE
   ======================================== */

function initStatusPage() {
  setActiveNav();

  showSpinner('disputeTableWrap', 'Loading disputes…');

  fetch('backend/get_disputes.php')
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        renderDisputeTable(data.disputes);
        updateStats(data.disputes);
      } else {
        document.getElementById('disputeTableWrap').innerHTML =
          `<div class="alert alert-error">⚠️ ${data.message}</div>`;
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById('disputeTableWrap').innerHTML =
        `<div class="alert alert-error">⚠️ Server error. Is XAMPP running?</div>`;
    });
}

function renderDisputeTable(disputes) {
  const wrap = document.getElementById('disputeTableWrap');

  if (!disputes || disputes.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <h3>No Disputes Found</h3>
        <p>No disputes have been submitted yet.</p>
      </div>`;
    return;
  }

  const rows = disputes.map(d => `
    <tr>
      <td><span class="text-muted" style="font-size:0.8rem;">#${d.id}</span></td>
      <td><span class="vehicle-tag">${d.vehicle_number}</span></td>
      <td>${escapeHtml(d.name)}</td>
      <td><a href="mailto:${escapeHtml(d.email)}" style="color:var(--muted)">${escapeHtml(d.email)}</a></td>
      <td style="max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(d.reason)}">${escapeHtml(d.reason)}</td>
      <td>${formatDate(d.created_at)}</td>
      <td>${statusBadge(d.status)}</td>
    </tr>`).join('');

  wrap.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Vehicle</th>
            <th>Name</th>
            <th>Email</th>
            <th>Reason</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function statusBadge(status) {
  const s = (status || '').toLowerCase();
  const map = { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected' };
  const cls = map[s] || 'badge-pending';
  return `<span class="badge ${cls}">${status || 'Pending'}</span>`;
}

function updateStats(disputes) {
  const total    = disputes.length;
  const pending  = disputes.filter(d => d.status.toLowerCase() === 'pending').length;
  const approved = disputes.filter(d => d.status.toLowerCase() === 'approved').length;
  const rejected = disputes.filter(d => d.status.toLowerCase() === 'rejected').length;

  setEl('statTotal',    total);
  setEl('statPending',  pending);
  setEl('statApproved', approved);
  setEl('statRejected', rejected);
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ========================================
   ROUTER — Run init based on page
   ======================================== */
document.addEventListener('DOMContentLoaded', function () {
  const page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '') initIndexPage();
  else if (page === 'fine.html')            initFinePage();
  else if (page === 'dispute.html')         initDisputePage();
  else if (page === 'status.html')          initStatusPage();
  else setActiveNav(); // fallback
});

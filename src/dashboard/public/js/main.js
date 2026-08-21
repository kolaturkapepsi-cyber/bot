// Bildirim sistemi
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'circle-xmark'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  // Stil enjeksiyon
  if (!document.getElementById('toast-style')) {
    const style = document.createElement('style');
    style.id = 'toast-style';
    style.textContent = `
      .toast {
        position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
        display: flex; align-items: center; gap: 10px;
        padding: 14px 20px; border-radius: 10px;
        font-size: 0.9rem; font-weight: 600;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        animation: slideIn 0.3s ease;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .toast--success { background: #1a3a2a; color: #57F287; }
      .toast--error   { background: #3a1a1a; color: #ED4245; }
      @keyframes slideIn {
        from { transform: translateX(120%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => toast.remove(), 3500);
}

// Lockdown butonu
const lockdownBtn = document.getElementById('lockdown-btn');
if (lockdownBtn) {
  lockdownBtn.addEventListener('click', async () => {
    const guildId = lockdownBtn.dataset.guild;
    const currentState = lockdownBtn.dataset.state === 'true';
    const newState = !currentState;

    lockdownBtn.disabled = true;
    lockdownBtn.textContent = 'İşleniyor...';

    try {
      const res = await fetch(`/api/guild/${guildId}/lockdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      });
      const data = await res.json();

      if (data.success) {
        lockdownBtn.dataset.state = String(newState);
        lockdownBtn.textContent = newState ? '🔓 Kilidi Aç' : '🔒 Kilitle';
        lockdownBtn.className = `btn ${newState ? 'btn-danger' : 'btn-success'}`;
        document.getElementById('lockdown-status').textContent = newState ? 'AKTİF' : 'PASİF';
        showToast(newState ? '🔒 Lockdown aktif edildi!' : '🔓 Lockdown kaldırıldı!', 'success');
      } else {
        showToast('Hata: ' + data.message, 'error');
      }
    } catch (err) {
      showToast('Bağlantı hatası!', 'error');
    } finally {
      lockdownBtn.disabled = false;
    }
  });
}

// Log temizle butonu
const clearLogsBtn = document.getElementById('clear-logs-btn');
if (clearLogsBtn) {
  clearLogsBtn.addEventListener('click', async () => {
    if (!confirm('Tüm logları silmek istediğine emin misin?')) return;
    const guildId = clearLogsBtn.dataset.guild;

    try {
      const res = await fetch(`/api/guild/${guildId}/clear-logs`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        document.getElementById('log-list').innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-check-circle"></i>
            <p>Loglar temizlendi.</p>
          </div>
        `;
        showToast('Loglar temizlendi!', 'success');
      }
    } catch (err) {
      showToast('Hata oluştu!', 'error');
    }
  });
}

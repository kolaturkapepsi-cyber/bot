// Ayarlar formu
const settingsForm = document.getElementById('settings-form');
if (settingsForm) {
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const guildId = settingsForm.dataset.guild;
    const saveStatus = document.getElementById('save-status');
    const submitBtn = settingsForm.querySelector('[type="submit"]');

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kaydediliyor...';

    const formData = new FormData(settingsForm);
    const body = {};
    formData.forEach((val, key) => { body[key] = val; });

    // Checkbox enabled — işaretlenmemişse 'off' olur
    if (!body.enabled) body.enabled = 'off';

    try {
      const res = await fetch(`/api/guild/${guildId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        saveStatus.textContent = '✓ Kaydedildi!';
        saveStatus.className = 'save-status success';
        showToast('Ayarlar başarıyla kaydedildi!', 'success');
      } else {
        saveStatus.textContent = '✗ Hata: ' + data.message;
        saveStatus.className = 'save-status error';
        showToast('Kayıt hatası: ' + data.message, 'error');
      }
    } catch (err) {
      saveStatus.textContent = '✗ Bağlantı hatası!';
      saveStatus.className = 'save-status error';
      showToast('Bağlantı hatası!', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Kaydet';
      setTimeout(() => { saveStatus.textContent = ''; saveStatus.className = 'save-status'; }, 4000);
    }
  });
}

// Chart.js grafiği
async function loadChart() {
  const guildId = window.GUILD_ID;
  if (!guildId) return;

  const canvas = document.getElementById('activityChart');
  if (!canvas) return;

  try {
    const res = await fetch(`/api/guild/${guildId}/stats`);
    const data = await res.json();

    const labels = data.days?.map(d => d.label) || [];
    const counts = data.days?.map(d => d.count) || [];

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Engellenen Olaylar',
          data: counts,
          backgroundColor: 'rgba(88, 101, 242, 0.5)',
          borderColor: '#5865F2',
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#161b22',
            borderColor: '#30363d',
            borderWidth: 1,
            titleColor: '#e6edf3',
            bodyColor: '#8b949e',
          },
        },
        scales: {
          x: {
            grid: { color: '#30363d' },
            ticks: { color: '#8b949e' },
          },
          y: {
            grid: { color: '#30363d' },
            ticks: { color: '#8b949e', stepSize: 1 },
            beginAtZero: true,
          },
        },
      },
    });
  } catch (err) {
    console.error('Grafik yüklenemedi:', err);
  }
}

loadChart();

document.addEventListener('DOMContentLoaded', async () => {
  const timeList = document.getElementById('timeList');

  // Avoid adding duplicate elements
  if (!document.getElementById('totalTime')) {
    const totalTimeDiv = document.createElement('div');
    totalTimeDiv.id = 'totalTime';
    totalTimeDiv.style.marginBottom = '10px';
    timeList.before(totalTimeDiv);

    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export to CSV';
    exportButton.style.marginBottom = '10px';
    exportButton.addEventListener('click', exportToCSV);
    totalTimeDiv.after(exportButton);
  }

  function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function exportToCSV() {
    const rows = [['Domain', 'Time Spent (ms)']];
    Object.entries(window.lastTimeData || {}).forEach(([domain, time]) => {
      rows.push([domain, time]);
    });
    const csvContent = rows.map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'website_time_data.csv';
    a.click();
  }

  async function updateTimes() {
    try {
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentDomain = new URL(currentTab.url).hostname;

      const timeData = await chrome.runtime.sendMessage({ type: 'getCurrentTimes' });
      window.lastTimeData = timeData;

      const sortedSites = Object.entries(timeData).sort(([, a], [, b]) => b - a);
      timeList.innerHTML = '';

      const totalTimeDiv = document.getElementById('totalTime');
      if (sortedSites.length === 0) {
        const div = document.createElement('div');
        div.className = 'site-time';
        div.textContent = 'No tracking data yet';
        timeList.appendChild(div);
        if (totalTimeDiv) totalTimeDiv.textContent = '';
        return;
      }

      let total = 0;
      const fragment = document.createDocumentFragment();

      sortedSites.forEach(([domain, time]) => {
        total += time;
        const div = document.createElement('div');
        div.className = 'site-time';
        div.textContent = `${domain}: ${formatTime(time)}`;
        if (domain === currentDomain) {
          div.style.fontWeight = 'bold';
          div.style.color = '#481f01';
        }
        fragment.appendChild(div);
      });

      timeList.appendChild(fragment);
      if (totalTimeDiv) {
        totalTimeDiv.textContent = `Total time today: ${formatTime(total)}`;
      }
    } catch (error) {
      console.error('Error loading time data:', error);
      timeList.innerHTML = '<div class="error">Error loading tracking data</div>';
      const totalTimeDiv = document.getElementById('totalTime');
      if (totalTimeDiv) totalTimeDiv.textContent = '';
    }
  }

  await updateTimes();
  setInterval(updateTimes, 1000);
});

/* global Chart */

const args = new URLSearchParams(location.search);
if (args.get('mode') === 'popup') {
  document.body.style.width = '600px';
  document.body.style.height = '300px';
  document.body.style.margin = '5px';
}

const configs = {
  color: '#ff0000',
  records: 100,
  interval: 100, // ms
  db: {
    max: 100
  },
  volume: {
    reference: 0.001
  }
};

let history = [];
const stat = {
  min: Infinity,
  avg: 0,
  max: 0
};

const c = document.querySelector('canvas');
const myLineChart = new Chart(c, {
  type: 'line',
  data: {
    labels: Array.from(Array(configs.records).keys()),
    datasets: [{
      data: []
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0
    },
    legend: {
      display: false
    },
    elements: {
      point: {
        radius: 0
      }
    },
    scales: {
      xAxes: [{
        display: false
      }],
      yAxes: [{
        display: true,
        ticks: {
          beginAtZero: true,
          steps: 20,
          max: configs.db.max
        }
      }]
    }
  }
});
/* 0dB - 100dB */
const update = () => {
  myLineChart.data.datasets[0] = {
    data: history,
    borderColor: configs.color,
    borderWidth: 1,
    fill: false
  };
  myLineChart.update();
};

navigator.getUserMedia({
  audio: true,
  video: false
}, async stream => {
  document.body.dataset.action = false;
  chrome.runtime.sendMessage({
    method: 'check'
  });

  const context = new AudioContext();
  await context.audioWorklet.addModule('meter.js');
  const microphone = context.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(context, 'vumeter', {
    processorOptions: {
      interval: configs.interval
    }
  });
  node.port.onmessage = ({data: {volume}}) => {
    volume *= 100;
    /* volume is between 0 - 100 */
    const db = 20 * Math.log10(volume / configs.volume.reference);
    for (let i = 0; i < 20; i += 1) {
      document.querySelector(`[data-volume="${i}"]`).dataset.active = db / 10 >= i;
    }
    if (db !== -Infinity) {
      history.push(db);
      history = history.slice(-configs.records);
      stat.min = Math.min(stat.min, db);
      stat.max = Math.max(stat.max, db);
      stat.avg = history.reduce((p, c) => p + c, 0) / history.length;
      document.getElementById('min').textContent = stat.min.toFixed(1) + 'dB';
      document.getElementById('max').textContent = stat.max.toFixed(1) + 'dB';
      document.getElementById('avg').textContent = stat.avg.toFixed(1) + 'dB';
    }

    document.getElementById('dB').textContent = db.toFixed(1) + 'dB';
    update();
    // console.log(volume, db);
  };
  microphone.connect(node).connect(context.destination);
}, e => console.error(e));


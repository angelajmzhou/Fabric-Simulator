import Input from './input.js';

let clippedPoints = [];

// Example handlers (already shared earlier)
function clipPointToModel() {
  console.log('Clipping point to the model...');
  const mockPosition = { x: Input.mousex, y: Input.mousey };
  clippedPoints.push(mockPosition);
  console.log('Clipped point:', mockPosition);
}

function showClippedPoints() {
  console.log('Showing all clipped points:');
  clippedPoints.forEach((point, index) => {
    console.log(`Point ${index + 1}:`, point);
  });
}

function clearClippedPoints() {
  console.log('Clearing all clipped points...');
  clippedPoints = [];
  showClippedPoints();
}

export function setupUIHandlers() {
  const SButton = document.getElementById("clipToModel");
  const AButton = document.getElementById("drawmodePoints");
  const LButton = document.getElementById("RemovePoints");

  document.getElementById('drawmodePoints').addEventListener('click', showClippedPoints);
  document.getElementById('clipToModel').addEventListener('click', clipPointToModel);
  document.getElementById('RemovePoints').addEventListener('click', clearClippedPoints);

  window.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 's') {
      console.log('[S] Key pressed');
      clipPointToModel();
      SButton.style.backgroundColor = "#ffcccc";
    }
    if (event.key.toLowerCase() === 'a') {
      AButton.style.backgroundColor = "#ffcccc";
    }
    if (event.key.toLowerCase() === 'l') {
      LButton.style.backgroundColor = "#ffcccc";
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key.toLowerCase() === 's') {
      SButton.style.backgroundColor = "#ecf1fb";
    }
    if (event.key.toLowerCase() === 'a') {
      console.log('[A] Key released');
      showClippedPoints();
      AButton.style.backgroundColor = "#ecf1fb";
    }
    if (event.key.toLowerCase() === 'l') {
      console.log('[L] Key released');
      clearClippedPoints();
      LButton.style.backgroundColor = "#ecf1fb";
    }
  });
}

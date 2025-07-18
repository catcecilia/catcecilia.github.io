function goTo(url) {
  window.location.href = url;
}

// 🐾 Virtual Pet Walking Script
const pet = document.getElementById('virtual-pet');
let petX = 0;
let direction = 1;

function walkPet() {
  const screenWidth = window.innerWidth;
  petX += direction * 2;

  if (petX > screenWidth - 60) {
    direction = -1;
    pet.style.transform = 'scaleX(-1)';
  } else if (petX < 0) {
    direction = 1;
    pet.style.transform = 'scaleX(1)';
  }

  pet.style.left = petX + 'px';
  requestAnimationFrame(walkPet);
}

walkPet();
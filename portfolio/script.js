function goTo(url) {
  window.location.href = url;
}

// 🐾 Virtual Pet Walker
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

// 🌟 Animate all cards on hover of any one
const cards = document.querySelectorAll('.project-card');

cards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    cards.forEach(c => c.classList.add('animated'));
  });

  card.addEventListener('mouseleave', () => {
    cards.forEach(c => c.classList.remove('animated'));
  });
});
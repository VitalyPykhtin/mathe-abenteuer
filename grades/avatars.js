/* Twelve available heroes for personal Mathe-Abenteuer Grades 1–3. */
(function (root) {
  'use strict';
  const avatars = [
    { id: 'girl', label: 'Mädchen', image: 'img/e/girl.png' },
    { id: 'boy', label: 'Junge', image: 'img/e/boy.png' },
    { id: 'astronaut', label: 'Astronaut', image: 'img/e/man_astronaut.png' },
    { id: 'robot', label: 'Roboter', image: 'img/e/robot.svg' },
    { id: 'pirate', label: 'Pirat', image: 'img/e/pirate.svg' },
    { id: 'knight', label: 'Ritter', image: 'img/e/knight.svg' },
    { id: 'princess', label: 'Prinzessin', image: 'img/e/princess.png' },
    { id: 'wizard', label: 'Zauberer', image: 'img/e/man_mage.png' },
    { id: 'fox', label: 'Fuchs', image: 'img/e/fox.png' },
    { id: 'owl', label: 'Eule', image: 'img/e/owl.png' },
    { id: 'dragon', label: 'Drache', image: 'img/e/dragon.png' },
    { id: 'unicorn', label: 'Einhorn', image: 'img/e/unicorn.png' }
  ];
  root.MATHE_AVATARS = Object.freeze(avatars.map(a => Object.freeze(a)));
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MATHE_AVATARS;
})(typeof globalThis !== 'undefined' ? globalThis : this);

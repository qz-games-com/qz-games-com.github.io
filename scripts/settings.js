const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.section');
tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});


(function() {
  const COOKIE_NAME = 'theme';
  const DEFAULT_THEME = 'default';
  const themesContainer = document.getElementById('themeoptioncent');



  function activateOption(type) {
    document.querySelectorAll('.themeoption.activenav')
            .forEach(el => el.classList.remove('activenav'));
    const opt = document.querySelector(`.themeoption[themetype="${type}"]`);
    if (opt) opt.classList.add('activenav');
  }

  document.addEventListener('DOMContentLoaded', () => {
    let saved = getCookie(COOKIE_NAME);
    if (!saved) {
      saved = DEFAULT_THEME;
      setCookie(COOKIE_NAME, saved);
    }
    activateOption(saved);
  });

  themesContainer.addEventListener('click', event => {
    const option = event.target.closest('.themeoption');
    if (!option) return;

    const type = option.getAttribute('themetype');
    activateOption(type);
    setCookie(COOKIE_NAME, type);
  });
})();
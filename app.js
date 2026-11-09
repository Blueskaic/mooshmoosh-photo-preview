'use strict';

document.documentElement.classList.add('js');

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  navigation.classList.toggle('is-open', !isOpen);
});
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});

const galleryLinks = [...document.querySelectorAll('[data-gallery]')];
const dialog = document.querySelector('#photo-dialog');
const dialogImage = document.querySelector('#lightbox-image');
const dialogCaption = document.querySelector('#lightbox-caption');
const dialogStage = document.querySelector('.lightbox-stage');
let currentPhoto = 0;

function showPhoto(index) {
  currentPhoto = (index + galleryLinks.length) % galleryLinks.length;
  const link = galleryLinks[currentPhoto];
  dialogImage.src = link.getAttribute('href');
  dialogImage.alt = link.querySelector('img').alt;
  dialogCaption.textContent = link.dataset.caption || 'צילום סטילס · MooshMoosh';
  document.querySelector('#photo-counter').textContent = `${currentPhoto + 1} / ${galleryLinks.length}`;
}
galleryLinks.forEach((link, index) => {
  link.addEventListener('click', (event) => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    showPhoto(index);
    dialog.showModal();
    document.body.classList.add('dialog-open');
  });
});
document.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
document.querySelector('#previous-photo').addEventListener('click', () => showPhoto(currentPhoto - 1));
document.querySelector('#next-photo').addEventListener('click', () => showPhoto(currentPhoto + 1));
dialog.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showPhoto(currentPhoto + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog || event.target === dialogStage) dialog.close();
});
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

const sessionType = document.querySelector('#session-type');
const message = document.querySelector('#inquiry-message');
const status = document.querySelector('#inquiry-status');
const whatsappLink = document.querySelector('#whatsapp-link');
let lastGeneratedMessage = message.defaultValue;
function updateWhatsAppLink() {
  whatsappLink.href = `https://wa.me/972503300547?text=${encodeURIComponent(message.value)}`;
}
function updateMessage() {
  if (message.value.trim() && message.value !== lastGeneratedMessage) {
    updateWhatsAppLink();
    status.textContent = 'סוג הצילום עודכן. הטקסט שכתבתם נשמר — אפשר להתאים אותו ידנית.';
    return;
  }
  const subject = sessionType.value === 'עוד לא החלטנו' ? 'סשן צילומים' : `צילומי ${sessionType.value}`;
  message.value = `היי MooshMoosh, נשמח לשמוע על ${subject}. אנחנו מאזור ___, וחשבנו להצטלם ב___. אפשר לקבל פרטים?`;
  lastGeneratedMessage = message.value;
  updateWhatsAppLink();
  status.textContent = 'נפתח טיוטה ב־WhatsApp. השליחה מתבצעת רק על ידכם.';
}
message.addEventListener('input', () => {
  updateWhatsAppLink();
  status.textContent = 'נפתח טיוטה ב־WhatsApp. השליחה מתבצעת רק על ידכם.';
});
updateWhatsAppLink();
sessionType.addEventListener('change', updateMessage);
document.querySelectorAll('[data-session]').forEach((link) => {
  link.addEventListener('click', () => {
    sessionType.value = link.dataset.session;
    updateMessage();
  });
});
document.querySelector('#copy-message').addEventListener('click', async () => {
  if (!message.value.trim()) {
    status.textContent = 'כתבו הודעה קצרה לפני ההעתקה.';
    message.focus();
    return;
  }
  try {
    await navigator.clipboard.writeText(message.value);
    status.textContent = 'ההודעה הועתקה. אפשר להמשיך ל־WhatsApp ולשלוח אותה משם.';
  } catch {
    message.focus();
    message.select();
    status.textContent = 'ההעתקה האוטומטית לא זמינה. הטקסט סומן — אפשר להעתיק אותו ידנית.';
  }
});
document.querySelector('#current-year').textContent = String(new Date().getFullYear());

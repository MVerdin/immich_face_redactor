const $ = (id) => document.getElementById(id);
let people = [];
function status(text, error = false) { $('status').textContent = text; $('status').style.color = error ? '#b42318' : '#526174'; }
function render(data) {
  people = data.people;
  const root = $('people'); root.textContent = '';
  if (!people.length) { root.innerHTML = '<p class="empty">No people were found in this library.</p>'; return; }
  people.forEach((person) => {
    const label = document.createElement('label'); label.className = 'person';
    const image = document.createElement('img'); const encoded = data.thumbnails[person.id];
    if (encoded) image.src = `data:image/jpeg;base64,${encoded}`;
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.dataset.id = person.id;
    const text = document.createElement('span'); text.innerHTML = `<strong></strong><small>${person.faceCount} face${person.faceCount === 1 ? '' : 's'}</small>`; text.querySelector('strong').textContent = person.name;
    label.append(checkbox, image, text); root.append(label);
  });
}
$('load').addEventListener('click', async () => {
  $('load').disabled = true; status('Loading people and thumbnails...');
  try { render(await window.immich.loadPeople({ serverUrl: $('server').value, token: $('token').value })); status(`Loaded ${people.length} people. Select faces to redact.`); }
  catch (error) { status(error.message || 'Unable to load people. Check the log for details.', true); }
  finally { $('load').disabled = false; }
});
$('review').addEventListener('click', () => {
  const selected = [...document.querySelectorAll('.person input:checked')].map((input) => people.find((p) => p.id === input.dataset.id));
  if (!selected.length) { status('Select at least one person to review.', true); return; }
  status(`Reviewing ${selected.length} selected ${selected.length === 1 ? 'person' : 'people'} with ${$('style').value} redaction. No photos have been modified.`);
});

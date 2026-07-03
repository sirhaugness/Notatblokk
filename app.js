const STORAGE_KEY = "mini-notatblokk-notes";

const noteForm = document.getElementById("noteForm");
const noteInput = document.getElementById("noteInput");
const notesList = document.getElementById("notesList");
const noteCount = document.getElementById("noteCount");
const emptyState = document.getElementById("emptyState");

let notes = loadNotes();
let editingId = null;

function loadNotes() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function createId() {
  return crypto.randomUUID();
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString("no-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateCount() {
  const count = notes.length;
  noteCount.textContent = String(count);
  emptyState.classList.toggle("hidden", count > 0);
}

function getSortedNotes() {
  return [...notes].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function render() {
  notesList.innerHTML = "";
  updateCount();

  for (const note of getSortedNotes()) {
    notesList.appendChild(createNoteElement(note));
  }
}

function createNoteElement(note) {
  const li = document.createElement("li");
  li.className = `note-card${note.done ? " done" : ""}`;
  li.dataset.id = note.id;

  if (editingId === note.id) {
    li.appendChild(createEditView(note));
  } else {
    li.appendChild(createDisplayView(note));
  }

  return li;
}

function createDisplayView(note) {
  const fragment = document.createDocumentFragment();

  const row = document.createElement("div");
  row.className = "note-row";

  const text = document.createElement("p");
  text.className = "note-text";
  text.textContent = note.text;

  const actions = document.createElement("div");
  actions.className = "note-actions";

  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.className = `btn btn-icon btn-ghost btn-done${note.done ? " active" : ""}`;
  doneBtn.title = note.done ? "Marker som uferdig" : "Marker som ferdig";
  doneBtn.textContent = note.done ? "↩" : "✓";
  doneBtn.addEventListener("click", () => toggleDone(note.id));

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-icon btn-ghost";
  editBtn.title = "Rediger";
  editBtn.textContent = "✎";
  editBtn.addEventListener("click", () => startEdit(note.id));

  actions.append(doneBtn, editBtn);
  row.append(text, actions);

  const date = document.createElement("span");
  date.className = "note-date";
  date.textContent = formatDate(note.createdAt);

  fragment.append(row, date);
  return fragment;
}

function createEditView(note) {
  const fragment = document.createDocumentFragment();

  const textarea = document.createElement("textarea");
  textarea.className = "note-edit-area";
  textarea.value = note.text;
  textarea.rows = 2;

  const editActions = document.createElement("div");
  editActions.className = "edit-actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "btn btn-ghost";
  cancelBtn.textContent = "Avbryt";
  cancelBtn.addEventListener("click", () => {
    editingId = null;
    render();
  });

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn btn-primary";
  saveBtn.textContent = "Lagre";
  saveBtn.addEventListener("click", () => saveEdit(note.id, textarea.value));

  editActions.append(cancelBtn, saveBtn);
  fragment.append(textarea, editActions);

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      editingId = null;
      render();
    }
    if (e.key === "Enter" && e.ctrlKey) {
      saveEdit(note.id, textarea.value);
    }
  });

  return fragment;
}

function addNote(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  notes.push({
    id: createId(),
    text: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
  });

  saveNotes();
  render();
}

function toggleDone(id) {
  const note = notes.find((n) => n.id === id);
  if (!note) return;

  note.done = !note.done;
  saveNotes();
  render();
}

function startEdit(id) {
  editingId = id;
  render();
}

function saveEdit(id, text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const note = notes.find((n) => n.id === id);
  if (!note) return;

  note.text = trimmed;
  editingId = null;
  saveNotes();
  render();
}

noteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addNote(noteInput.value);
  noteInput.value = "";
  noteInput.focus();
});

noteInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    noteForm.requestSubmit();
  }
});

render();

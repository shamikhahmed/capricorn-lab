import { TASKS } from './products.js';
import { sfx } from './sounds.js';

export { TASKS };

const STORAGE_KEY = 'cap-tasks-done';

function loadDone() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDone(done) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
  } catch { /* private browsing */ }
}

let doneSet = loadDone();

function taskKey(t, i) {
  return t.social ? `social:${t.social}` : `app:${t.slug || i}`;
}

function openCount() {
  return TASKS.filter((t, i) => !doneSet.has(taskKey(t, i))).length;
}

function taskItemsHTML() {
  return TASKS.map((t, i) => {
    const key = taskKey(t, i);
    const isDone = doneSet.has(key);
    const attrs = t.action === 'app'
      ? `type="button" data-open-app="${t.slug}" data-task-key="${key}"`
      : `type="button" data-task-social="${t.social}" data-task-key="${key}"`;
    return `
      <li>
        <button class="task__item${isDone ? ' is-done' : ''}" ${attrs} aria-pressed="${isDone}">
          <span class="task__check" aria-hidden="true"></span>
          <span class="task__main">
            <span class="task__label">${t.label}</span>
            <span class="task__detail">${t.detail}</span>
          </span>
          <span class="task__tag">${t.tag}</span>
        </button>
      </li>`;
  }).join('');
}

function refreshTaskMeta(root) {
  const n = openCount();
  root?.querySelectorAll('.task__meta .num').forEach((el) => { el.textContent = String(n); });
}

function toggleTask(btn) {
  const key = btn.dataset.taskKey;
  if (!key) return;
  if (doneSet.has(key)) doneSet.delete(key);
  else doneSet.add(key);
  saveDone(doneSet);
  const on = doneSet.has(key);
  btn.classList.toggle('is-done', on);
  btn.setAttribute('aria-pressed', String(on));
  refreshTaskMeta(btn.closest('.mw--tasks, .ios-tasks'));
}

export function renderDesktopTasks() {
  return `
    <div class="mw mw--tasks" aria-label="Tasks">
      <header class="task__head">
        <span class="task__title">Tasks</span>
        <span class="task__meta"><span class="num">${openCount()}</span> open · tap to act</span>
      </header>
      <ul class="task__list os-scroll os-scroll--show" aria-label="Capricorn tasks">${taskItemsHTML()}</ul>
    </div>
  `;
}

export function renderMobileTasks() {
  return `
    <div class="ios-tasks" aria-label="Tasks">
      <header class="task__head task__head--ios">
        <span class="task__title">Tasks</span>
        <span class="task__meta"><span class="num">${openCount()}</span> open · tap to act</span>
      </header>
      <ul class="task__list task__list--ios os-scroll os-scroll--show">${taskItemsHTML()}</ul>
    </div>
  `;
}

export function bindTaskClicks(root, { onOpen, onSocial } = {}) {
  root.querySelectorAll('.task__item[data-open-app]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      toggleTask(btn);
      onOpen?.(btn.dataset.openApp);
    });
  });

  root.querySelectorAll('.task__item[data-task-social]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sfx.click();
      toggleTask(btn);
      onSocial?.(btn.dataset.taskSocial);
    });
  });
}

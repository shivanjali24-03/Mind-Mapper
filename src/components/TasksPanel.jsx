import { useMemo, useState } from 'react';
import { CalendarClock, Check, X } from 'lucide-react';
import { dueStatus, shortDate, taskList, todayISO } from '../lib/tasks.js';

const GROUPS = [
  ['overdue', 'Overdue'],
  ['today', 'Today'],
  ['soon', 'Next 7 days'],
  ['later', 'Later'],
  ['none', 'No due date'],
];

export default function TasksPanel({ nodes, onToggle, onSelect, onClose }) {
  const [showDone, setShowDone] = useState(false);
  const today = todayISO();
  const all = useMemo(() => taskList(nodes, { includeDone: true }), [nodes]);
  const open = all.filter((n) => !n.data.task.done);
  const done = all.filter((n) => n.data.task.done);

  const groups = GROUPS.map(([key, title]) => [key, title, open.filter((n) => dueStatus(n.data.task.due, today) === key)]).filter(
    ([, , items]) => items.length,
  );

  const Row = ({ n }) => (
    <li className={`task-row${n.data.task.done ? ' is-done' : ''}`}>
      <button
        className={`task-check${n.data.task.done ? ' is-on' : ''}`}
        onClick={() => onToggle(n.id)}
        aria-label={n.data.task.done ? `Mark "${n.data.label}" as not done` : `Mark "${n.data.label}" as done`}
      >
        {n.data.task.done && <Check size={12} strokeWidth={3} />}
      </button>
      <button className="task-row__main" onClick={() => onSelect(n.id)}>
        <span className="task-row__label">{n.data.label}</span>
        <span className="task-row__meta">
          {n.data.task.priority && <span className={`prio prio--${n.data.task.priority}`}>{n.data.task.priority}</span>}
          {n.data.task.due && (
            <span className={`due due--${dueStatus(n.data.task.due, today)}`}>
              <CalendarClock size={12} /> {shortDate(n.data.task.due)}
            </span>
          )}
        </span>
      </button>
    </li>
  );

  return (
    <aside className="inspector tasks-panel" aria-label="Tasks">
      <div className="inspector__head">
        <h2>
          Tasks · {done.length}/{all.length} done
        </h2>
        <button className="icon-btn" onClick={onClose} aria-label="Close tasks">
          <X size={17} />
        </button>
      </div>

      {all.length === 0 && (
        <p className="tasks-empty">
          No tasks yet. Select an idea and press <kbd>X</kbd>, or tick <b>This idea is a task</b> in the idea panel.
        </p>
      )}
      {all.length > 0 && open.length === 0 && <p className="tasks-empty">🎉 All tasks are done.</p>}

      {groups.map(([key, title, items]) => (
        <section key={key} className="task-group">
          <h3 className={`task-group__title due--${key}`}>
            {title} <span>{items.length}</span>
          </h3>
          <ul>
            {items.map((n) => (
              <Row key={n.id} n={n} />
            ))}
          </ul>
        </section>
      ))}

      {done.length > 0 && (
        <section className="task-group">
          <button className="link-btn" onClick={() => setShowDone((v) => !v)}>
            {showDone ? 'Hide' : 'Show'} {done.length} done
          </button>
          {showDone && (
            <ul>
              {done.map((n) => (
                <Row key={n.id} n={n} />
              ))}
            </ul>
          )}
        </section>
      )}
    </aside>
  );
}

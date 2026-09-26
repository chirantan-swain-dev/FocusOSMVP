"use client";

import { useEffect, useMemo, useState } from "react";

type Task = { id: number; title: string; done: boolean; priority: "Low" | "Medium" | "High"; minutes: number };
type Habit = { id: number; name: string; completed: boolean };
type Goal = { id: number; title: string; progress: number };

const initialTasks: Task[] = [
  { id: 1, title: "Review today's priorities", done: false, priority: "High", minutes: 10 },
  { id: 2, title: "Finish FocusOS landing page", done: false, priority: "High", minutes: 45 },
  { id: 3, title: "Reply to important messages", done: false, priority: "Medium", minutes: 20 },
  { id: 4, title: "Plan tomorrow", done: false, priority: "Low", minutes: 10 }
];

const initialHabits: Habit[] = [
  { id: 1, name: "Drink water", completed: true },
  { id: 2, name: "10-minute walk", completed: false },
  { id: 3, name: "Read / learn", completed: false }
];

const initialGoals: Goal[] = [
  { id: 1, title: "Launch FocusOS MVP", progress: 62 },
  { id: 2, title: "Build a consistent morning routine", progress: 38 }
];

export default function Home() {
  const [section, setSection] = useState("Dashboard");
  const [energy, setEnergy] = useState("Medium");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [goals] = useState<Goal[]>(initialGoals);
  const [newTask, setNewTask] = useState("");
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [focusRunning, setFocusRunning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("focusos-state");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.tasks) setTasks(state.tasks);
        if (state.habits) setHabits(state.habits);
        if (state.energy) setEnergy(state.energy);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("focusos-state", JSON.stringify({ tasks, habits, energy }));
  }, [tasks, habits, energy]);

  useEffect(() => {
    if (!focusRunning) return;
    const timer = setInterval(() => {
      setFocusSeconds((value) => {
        if (value <= 1) {
          setFocusRunning(false);
          return 25 * 60;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [focusRunning]);

  const completedTasks = tasks.filter((task) => task.done).length;
  const completedHabits = habits.filter((habit) => habit.completed).length;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const nextTask = useMemo(
    () => tasks.find((task) => !task.done && task.priority === "High") ?? tasks.find((task) => !task.done),
    [tasks]
  );

  function addTask() {
    const title = newTask.trim();
    if (!title) return;
    setTasks((items) => [
      ...items,
      { id: Date.now(), title, done: false, priority: "Medium", minutes: 20 }
    ]);
    setNewTask("");
  }

  function toggleTask(id: number) {
    setTasks((items) => items.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  }

  function toggleHabit(id: number) {
    setHabits((items) => items.map((habit) => habit.id === id ? { ...habit, completed: !habit.completed } : habit));
  }

  const minutes = Math.floor(focusSeconds / 60).toString().padStart(2, "0");
  const seconds = (focusSeconds % 60).toString().padStart(2, "0");

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div><strong>FocusOS</strong><span>Personal OS</span></div>
        </div>

        <nav>
          {["Dashboard", "Tasks", "Habits", "Goals", "Focus"].map((item) => (
            <button key={item} className={section === item ? "nav-item active" : "nav-item"} onClick={() => setSection(item)}>
              <span>{item === "Dashboard" ? "⌂" : item === "Tasks" ? "✓" : item === "Habits" ? "↻" : item === "Goals" ? "◎" : "◉"}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-card">
            <span>Today</span>
            <strong>{completedTasks}/{tasks.length} tasks</strong>
            <div className="bar"><i style={{ width: `${progress}%` }} /></div>
          </div>
          <button className="settings" onClick={() => alert("Settings will be connected in the next phase.")}>⚙ Settings</button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">SATURDAY, SEPTEMBER 26</p>
            <h1>{section === "Dashboard" ? "Good morning." : section}</h1>
          </div>
          <div className="top-actions">
            <button className="icon-btn" onClick={() => setSection("Focus")} title="Focus mode">◉</button>
            <div className="avatar">CS</div>
          </div>
        </header>

        {section === "Dashboard" && (
          <>
            <section className="hero-grid">
              <div className="card next-card">
                <div className="card-head"><span className="label">NEXT UP</span><span className="pill high">High priority</span></div>
                <h2>{nextTask?.title ?? "Everything is done."}</h2>
                <p>{nextTask ? `A focused ${nextTask.minutes}-minute step is enough. Start small.` : "Take a moment to review your day."}</p>
                {nextTask && <button className="primary" onClick={() => setSection("Focus")}>Start focus →</button>}
              </div>

              <div className="card energy-card">
                <div className="card-head"><span className="label">ENERGY CHECK-IN</span><span>Today</span></div>
                <h3>How much capacity do you have?</h3>
                <div className="energy-options">
                  {["Low", "Medium", "High"].map((level) => (
                    <button key={level} className={energy === level ? "energy selected" : "energy"} onClick={() => setEnergy(level)}>
                      <span>{level === "Low" ? "○" : level === "Medium" ? "◐" : "●"}</span>{level}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <div className="stats-grid">
              <Stat label="Tasks complete" value={`${completedTasks}/${tasks.length}`} sub={`${progress}% today`} />
              <Stat label="Habits" value={`${completedHabits}/${habits.length}`} sub="daily check-in" />
              <Stat label="Focus streak" value="4 days" sub="keep it simple" />
              <Stat label="Focus time" value="1h 20m" sub="this week" />
            </div>

            <section className="main-grid">
              <div className="card">
                <div className="section-title"><div><span className="label">TODAY</span><h3>Tasks</h3></div><button className="text-btn" onClick={() => setSection("Tasks")}>View all →</button></div>
                <div className="task-list">
                  {tasks.slice(0, 4).map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)}
                </div>
              </div>

              <div className="card">
                <div className="section-title"><div><span className="label">ROUTINE</span><h3>Habits</h3></div><button className="text-btn" onClick={() => setSection("Habits")}>View all →</button></div>
                <div className="habit-list">
                  {habits.map((habit) => (
                    <button className="habit-row" key={habit.id} onClick={() => toggleHabit(habit.id)}>
                      <span className={habit.completed ? "check checked" : "check"}>{habit.completed ? "✓" : ""}</span>
                      <span className={habit.completed ? "done-text" : ""}>{habit.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {section === "Tasks" && (
          <section className="card page-card">
            <div className="section-title"><div><span className="label">CAPTURE</span><h3>Task inbox</h3></div></div>
            <div className="quick-add"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="What needs to get done?" /><button className="primary" onClick={addTask}>Add task</button></div>
            <div className="task-list">{tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)}</div>
          </section>
        )}

        {section === "Habits" && (
          <section className="card page-card">
            <span className="label">CONSISTENCY</span><h3>Daily habits</h3>
            <p className="muted">Small actions count. Check them off as you go.</p>
            <div className="habit-list large">{habits.map((habit) => (
              <button className="habit-row" key={habit.id} onClick={() => toggleHabit(habit.id)}>
                <span className={habit.completed ? "check checked" : "check"}>{habit.completed ? "✓" : ""}</span>
                <span className={habit.completed ? "done-text" : ""}>{habit.name}</span>
              </button>
            ))}</div>
          </section>
        )}

        {section === "Goals" && (
          <section className="card page-card">
            <span className="label">DIRECTION</span><h3>Goals & milestones</h3>
            <div className="goal-list">{goals.map((goal) => (
              <div className="goal" key={goal.id}><div className="goal-head"><strong>{goal.title}</strong><span>{goal.progress}%</span></div><div className="bar"><i style={{ width: `${goal.progress}%` }} /></div><small>Keep the next step visible, not the entire mountain.</small></div>
            ))}</div>
          </section>
        )}

        {section === "Focus" && (
          <section className="focus-page">
            <div className="focus-card card">
              <span className="label">FOCUS MODE</span>
              <h2>{nextTask?.title ?? "Choose one thing."}</h2>
              <div className="timer">{minutes}:{seconds}</div>
              <p>One task. One timer. No need to finish everything.</p>
              <div className="focus-actions">
                <button className="primary" onClick={() => setFocusRunning(!focusRunning)}>{focusRunning ? "Pause" : "Start focus"}</button>
                <button className="secondary" onClick={() => { setFocusRunning(false); setFocusSeconds(25 * 60); }}>Reset</button>
              </div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="stat card"><span className="label">{label}</span><strong>{value}</strong><small>{sub}</small></div>;
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  return (
    <button className="task-row" onClick={onToggle}>
      <span className={task.done ? "check checked" : "check"}>{task.done ? "✓" : ""}</span>
      <span className={task.done ? "done-text task-title" : "task-title"}>{task.title}</span>
      <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
      <span className="task-time">{task.minutes}m</span>
    </button>
  );
}
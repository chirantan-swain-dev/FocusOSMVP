"use client";
import { useEffect, useState } from "react";
type Task={id:number;title:string;done:boolean;priority:"Low"|"Medium"|"High";minutes:number};
type Habit={id:number;name:string;completed:boolean};
const seedTasks:Task[]=[
{id:1,title:"Review today's priorities",done:false,priority:"High",minutes:10},
{id:2,title:"Finish FocusOS landing page",done:false,priority:"High",minutes:45},
{id:3,title:"Reply to important messages",done:false,priority:"Medium",minutes:20},
{id:4,title:"Plan tomorrow",done:false,priority:"Low",minutes:10}];
const seedHabits:Habit[]=[
{id:1,name:"Drink water",completed:true},
{id:2,name:"10-minute walk",completed:false},
{id:3,name:"Read / learn",completed:false}];

export default function Home(){
 const [tab,setTab]=useState("Dashboard"),[energy,setEnergy]=useState("Medium"),[tasks,setTasks]=useState<Task[]>(seedTasks),[habits,setHabits]=useState<Habit[]>(seedHabits),[newTask,setNewTask]=useState(""),[seconds,setSeconds]=useState(1500),[running,setRunning]=useState(false);
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem("focusos")||"{}");if(s.tasks)setTasks(s.tasks);if(s.habits)setHabits(s.habits);if(s.energy)setEnergy(s.energy)}catch{}},[]);
 useEffect(()=>{localStorage.setItem("focusos",JSON.stringify({tasks,habits,energy}))},[tasks,habits,energy]);
 useEffect(()=>{if(!running)return;const t=setInterval(()=>setSeconds(v=>{if(v<=1){setRunning(false);return 1500}return v-1}),1000);return()=>clearInterval(t)},[running]);
 const done=tasks.filter(t=>t.done).length,next=tasks.find(t=>!t.done&&t.priority==="High")||tasks.find(t=>!t.done),pct=tasks.length?Math.round(done/tasks.length*100):0;
 const add=()=>{const title=newTask.trim();if(!title)return;setTasks(v=>[...v,{id:Date.now(),title,done:false,priority:"Medium",minutes:20}]);setNewTask("")};
 const toggleTask=(id:number)=>setTasks(v=>v.map(t=>t.id===id?{...t,done:!t.done}:t));
 const toggleHabit=(id:number)=>setHabits(v=>v.map(h=>h.id===id?{...h,completed:!h.completed}:h));
 const mm=String(Math.floor(seconds/60)).padStart(2,"0"),ss=String(seconds%60).padStart(2,"0");
 return <main className="shell"><aside className="side"><div className="brand"><b>F</b><span><strong>FocusOS</strong><small>Personal OS</small></span></div><nav>{["Dashboard","Tasks","Habits","Goals","Focus"].map(x=><button className={tab===x?"nav active":"nav"} key={x} onClick={()=>setTab(x)}>{x==="Dashboard"?"⌂":x==="Tasks"?"✓":x==="Habits"?"↻":x==="Goals"?"◎":"◉"}<em>{x}</em></button>)}</nav><div className="sidebox"><small>TODAY</small><strong>{done}/{tasks.length} tasks</strong><div className="bar"><i style={{width:pct+"%"}}/></div></div></aside>
 <section className="content"><header><div><small>SATURDAY, SEPTEMBER 26</small><h1>{tab==="Dashboard"?"Good morning.":tab}</h1></div><div className="avatar">CS</div></header>
 {tab==="Dashboard"&&<><div className="hero"><div className="card next"><small>NEXT UP</small><span className="tag">High priority</span><h2>{next?.title||"Everything is done."}</h2><p>{next?"A focused "+next.minutes+"-minute step is enough. Start small.":"Take a moment to review your day."}</p>{next&&<button onClick={()=>setTab("Focus")}>Start focus →</button>}</div><div className="card"><small>ENERGY CHECK-IN</small><h3>How much capacity do you have?</h3><div className="energies">{["Low","Medium","High"].map(x=><button className={energy===x?"selected":""} key={x} onClick={()=>setEnergy(x)}>{x}</button>)}</div></div></div>
 <div className="stats"><Stat a="Tasks complete" b={done+"/"+tasks.length} c={pct+"% today"}/><Stat a="Habits" b={habits.filter(h=>h.completed).length+"/"+habits.length} c="daily check-in"/><Stat a="Focus streak" b="4 days" c="keep it simple"/><Stat a="Focus time" b="1h 20m" c="this week"/></div>
 <div className="grid"><div className="card"><small>TODAY</small><h3>Tasks</h3>{tasks.map(t=><TaskRow key={t.id} t={t} click={()=>toggleTask(t.id)}/>)}</div><div className="card"><small>ROUTINE</small><h3>Habits</h3>{habits.map(h=><button className="row" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"strike":""}>{h.name}</span></button>)}</div></div></>}
 {tab==="Tasks"&&<div className="card page"><small>CAPTURE</small><h3>Task inbox</h3><div className="add"><input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="What needs to get done?"/><button onClick={add}>Add task</button></div>{tasks.map(t=><TaskRow key={t.id} t={t} click={()=>toggleTask(t.id)}/>)}</div>}
 {tab==="Habits"&&<div className="card page"><small>CONSISTENCY</small><h3>Daily habits</h3><p>Small actions count. Check them off as you go.</p>{habits.map(h=><button className="row" key={h.id} onClick={()=>toggleHabit(h.id)}><span className={h.completed?"check yes":"check"}>{h.completed?"✓":""}</span><span className={h.completed?"strike":""}>{h.name}</span></button>)}</div>}
 {tab==="Goals"&&<div className="card page"><small>DIRECTION</small><h3>Goals & milestones</h3><Goal title="Launch FocusOS MVP" pct={62}/><Goal title="Build a consistent morning routine" pct={38}/></div>}
 {tab==="Focus"&&<div className="focus"><div className="card"><small>FOCUS MODE</small><h2>{next?.title||"Choose one thing."}</h2><div className="timer">{mm}:{ss}</div><p>One task. One timer. No need to finish everything.</p><button onClick={()=>setRunning(!running)}>{running?"Pause":"Start focus"}</button><button className="reset" onClick={()=>{setRunning(false);setSeconds(1500)}}>Reset</button></div></div>}
 </section></main>;
}
function Stat({a,b,c}:{a:string;b:string;c:string}){return <div className="card stat"><small>{a}</small><strong>{b}</strong><span>{c}</span></div>}
function TaskRow({t,click}:{t:Task;click:()=>void}){return <button className="row" onClick={click}><span className={t.done?"check yes":"check"}>{t.done?"✓":""}</span><span className={t.done?"strike task":"task"}>{t.title}</span><span className={"prio "+t.priority.toLowerCase()}>{t.priority}</span><small>{t.minutes}m</small></button>}
function Goal({title,pct}:{title:string;pct:number}){return <div className="goal"><div><strong>{title}</strong><b>{pct}%</b></div><div className="bar"><i style={{width:pct+"%"}}/></div></div>}
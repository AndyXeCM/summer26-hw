const STORE_KEY = 'aoodySummerHomeworkV3';
const NOTES_KEY = 'aoodySummerHomeworkNotesV3';
function loadState(){try{return JSON.parse(localStorage.getItem(STORE_KEY)||'{}')}catch(e){return {}}}
function saveState(state){localStorage.setItem(STORE_KEY, JSON.stringify(state)); updateProgress(); stampSaved();}
function stampSaved(){document.querySelectorAll('[data-save-state]').forEach(el=>{el.textContent='已自动保存：'+new Date().toLocaleString('zh-CN')})}
function taskDone(id){return !!loadState()[id]}
function setTask(id,val){const s=loadState(); s[id]=val; saveState(s)}
function renderProgressCards(){
  const tasks = window.HOMEWORK_TASKS || [];
  const courses = [...new Set(tasks.map(t=>t.course))];
  document.querySelectorAll('[data-progress-cards]').forEach(container=>{
    container.innerHTML = courses.map(c=>{
      const list = tasks.filter(t=>t.course===c); const done = list.filter(t=>taskDone(t.id)).length;
      const pct = list.length ? Math.round(done/list.length*100) : 0;
      return `<div class="card tight course-card"><div><div class="label">${c}</div><div class="mini">${done}/${list.length} 项完成</div><div class="progress-wrap" style="margin-top:8px"><div class="progress-bar" style="width:${pct}%"></div></div></div><div class="big-number">${pct}%</div></div>`
    }).join('');
  });
}
function renderTasks(filter='全部'){
  const target = document.querySelector('[data-task-list]');
  if(!target) return;
  const tasks = window.HOMEWORK_TASKS || [];
  const filtered = filter==='全部' ? tasks : tasks.filter(t=>t.course===filter);
  target.innerHTML = filtered.map(t=>{
    const checked = taskDone(t.id) ? 'checked' : '';
    const done = taskDone(t.id) ? 'done' : '';
    return `<label class="task ${done}" data-course="${t.course}"><input type="checkbox" data-task-id="${t.id}" ${checked}><div><div class="task-course">${t.course}</div><div class="task-title">${t.title}</div><div class="task-detail">${t.detail}</div></div></label>`
  }).join('');
  target.querySelectorAll('input[data-task-id]').forEach(cb=>{
    cb.addEventListener('change',e=>{setTask(e.target.dataset.taskId, e.target.checked); e.target.closest('.task').classList.toggle('done', e.target.checked);});
  })
}
function renderFilters(){
  const f = document.querySelector('[data-filters]'); if(!f) return;
  const courses = ['全部', ...new Set((window.HOMEWORK_TASKS||[]).map(t=>t.course))];
  f.innerHTML = courses.map((c,i)=>`<button class="filter ${i===0?'active':''}" data-filter="${c}">${c}</button>`).join('');
  f.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    f.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active'); renderTasks(btn.dataset.filter);
  }))
}
function updateProgress(){
  const tasks = window.HOMEWORK_TASKS || []; const state = loadState();
  const done = tasks.filter(t=>state[t.id]).length; const pct = tasks.length ? Math.round(done/tasks.length*100) : 0;
  document.querySelectorAll('[data-total-progress]').forEach(el=>el.textContent = pct + '%');
  document.querySelectorAll('[data-total-count]').forEach(el=>el.textContent = `${done}/${tasks.length}`);
  document.querySelectorAll('[data-total-bar]').forEach(el=>el.style.width = pct + '%');
  renderProgressCards();
}
function renderDaily(){
  const target = document.querySelector('[data-daily-plan]'); if(!target) return;
  target.innerHTML = (window.DAILY_PLAN||[]).map((d,i)=>`<div class="card day-card"><div class="date-chip">${d[0]}</div><div><h3>${d[1]}</h3><p>${d[2]}</p><label class="task"><input type="checkbox" data-task-id="day-${i}"><div><div class="task-title">这一天完成了</div><div class="task-detail">勾选后同样会自动保存。</div></div></label></div></div>`).join('');
  const state = loadState();
  target.querySelectorAll('input[data-task-id]').forEach(cb=>{cb.checked=!!state[cb.dataset.taskId];cb.closest('.task').classList.toggle('done',cb.checked);cb.addEventListener('change',e=>{setTask(e.target.dataset.taskId,e.target.checked);e.target.closest('.task').classList.toggle('done',e.target.checked)})})
}
function setupNotes(){
  document.querySelectorAll('[data-notes]').forEach(area=>{
    const key = NOTES_KEY + ':' + (area.dataset.notes || location.pathname);
    area.value = localStorage.getItem(key) || '';
    area.addEventListener('input',()=>{localStorage.setItem(key, area.value); stampSaved();});
  })
}
function setupButtons(){
  document.querySelectorAll('[data-export]').forEach(btn=>btn.addEventListener('click',()=>{
    const payload = {version:3, exportedAt:new Date().toISOString(), tasks:loadState(), notes:{}};
    Object.keys(localStorage).forEach(k=>{ if(k.startsWith(NOTES_KEY)) payload.notes[k]=localStorage.getItem(k); });
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='aoody-homework-progress-backup.json'; a.click(); URL.revokeObjectURL(a.href);
  }));
  document.querySelectorAll('[data-import]').forEach(input=>input.addEventListener('change',()=>{
    const file = input.files[0]; if(!file) return;
    const reader = new FileReader(); reader.onload = () => {try{const data=JSON.parse(reader.result); if(data.tasks) localStorage.setItem(STORE_KEY, JSON.stringify(data.tasks)); if(data.notes) Object.entries(data.notes).forEach(([k,v])=>localStorage.setItem(k,v)); location.reload();}catch(e){alert('导入失败：文件格式不对')}}; reader.readAsText(file);
  }));
  document.querySelectorAll('[data-reset]').forEach(btn=>btn.addEventListener('click',()=>{ if(confirm('确定清空所有勾选状态吗？')){localStorage.removeItem(STORE_KEY); location.reload();} }));
  document.querySelectorAll('[data-print]').forEach(btn=>btn.addEventListener('click',()=>window.print()));
}
function markActiveNav(){
  const file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a').forEach(a=>{if(a.getAttribute('href')===file) a.classList.add('active')})
}
document.addEventListener('DOMContentLoaded',()=>{markActiveNav(); renderFilters(); renderTasks(); renderDaily(); setupNotes(); setupButtons(); updateProgress(); stampSaved();});

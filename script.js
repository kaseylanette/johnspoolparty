const ADMIN_PASSWORD = 'bigjohn365';
  const EMOJIS = ['🏊','🎉','🌅','🌊','🎶','🍹','🕶️','🎱','🌴','🏖️','🎊','🔥','🎈','🥳','⚡','🫧'];
  let selectedEmoji = '🎉';
  let nextId = 1;
  let notifiedTotal = 0;
  let inviteList = [];
  let inviteMode = 'email';
  let cart = { event: null, qty: 1 };
  let events = [];
  let validCodes = {};

  function totalGuests() { return events.reduce((s,e)=>s+(e.guests||[]).reduce((a,g)=>a+g.tickets,0),0); }
  function totalRevenue() { return events.reduce((s,e)=>s+(e.guests||[]).reduce((a,g)=>a+g.tickets*e.price,0),0); }
  function calcRating() {
    const rated = events.filter(e=>e.rating);
    if(!rated.length) return '—';
    return (rated.reduce((s,e)=>s+e.rating,0)/rated.length).toFixed(1)+'★';
  }
  function updateStats() {
    document.getElementById('stat-events').textContent = events.length;
    document.getElementById('stat-guests').textContent = totalGuests();
    document.getElementById('stat-rating').textContent = calcRating();
    if(document.getElementById('as-events')) {
      document.getElementById('as-events').textContent = events.length;
      document.getElementById('as-guests').textContent = totalGuests();
      document.getElementById('as-revenue').textContent = '$'+totalRevenue().toLocaleString();
    }
  }

  function renderCard(e, delay) {
    const soldOut = !e.available && e.upcoming;
    const revealed = e.addrReleased || e.isToday;
    const gc = (e.guests||[]).reduce((a,g)=>a+g.tickets,0);
    return `<div class="event-card" style="animation-delay:${delay||0}ms" onclick="${e.upcoming&&e.available?`openTicket(${e.id})`:''}">
      <div class="event-img ${e.upcoming?'upcoming':'past'}"><span class="big-emoji">${e.emoji}</span></div>
      <div class="event-body">
        <div style="margin-bottom:6px">
          <span class="badge ${e.isToday?'badge-today':e.upcoming?(soldOut?'badge-sold':'badge-upcoming'):'badge-past'}">${e.isToday?'Tonight!':e.upcoming?(soldOut?'Sold out':'Upcoming'):'Past'}</span>
        </div>
        <div class="event-title">${e.title}</div>
        <div class="event-meta">${e.date}</div>
        <div class="addr-pill ${revealed?'revealed':'locked'}">
          <span>${revealed?'📍':'🔒'}</span>
          <span>${revealed?'Address revealed':e.location+' · drops day-of'}</span>
        </div>
        <div class="event-footer">
          <span class="price">${e.upcoming?`$${e.price}/person`:`${gc} ticket${gc!==1?'s':''}`}</span>
          ${e.upcoming&&e.available?`<button class="btn-sm coral" onclick="event.stopPropagation();openTicket(${e.id})">Get tickets</button>`:''}
          ${soldOut?`<span style="font-size:12px;color:var(--gray-mid)">Sold out</span>`:''}
          ${revealed&&e.upcoming?`<button class="btn-sm green" onclick="event.stopPropagation();showPage('lookup')">Find address</button>`:''}
          ${!e.upcoming?`<button class="btn-sm">View</button>`:''}
        </div>
      </div>
    </div>`;
  }

  function emptyState(msg, sub) {
    return `<div class="empty-state"><div class="empty-icon">🎉</div><strong>${msg}</strong><p>${sub}</p></div>`;
  }

  function renderHome() {
    const up = events.filter(e=>e.upcoming&&e.available);
    document.getElementById('home-events').innerHTML = up.length
      ? up.map((e,i)=>renderCard(e,i*80)).join('')
      : emptyState('No upcoming events yet','Check back soon — Big John is cooking something up!');
    updateStats();
  }

  function filterEvents(type, btn) {
    document.querySelectorAll('#page-events .tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    const filtered = events.filter(e=>e.upcoming===(type==='upcoming'));
    document.getElementById('all-events').innerHTML = filtered.length
      ? filtered.map((e,i)=>renderCard(e,i*80)).join('')
      : emptyState(type==='upcoming'?'No upcoming events yet':'No past events yet', type==='upcoming'?'Events created in the admin panel will show up here.':'Past events will appear here after they happen.');
  }

  function populateInviteSelect() {
    const sel = document.getElementById('invite-event');
    sel.innerHTML = '<option value="">Select an event...</option>';
    events.filter(e=>e.upcoming&&e.available).forEach(e=>{
      const o = document.createElement('option'); o.value=e.id; o.text=`${e.emoji} ${e.title} · ${e.date}`; sel.appendChild(o);
    });
  }

  function showPage(p) {
    document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
    document.getElementById('ticket-modal').classList.remove('open');
    document.getElementById('page-'+p).classList.add('active');
    const map={home:0,events:1,invite:2,lookup:3,admin:4};
    document.querySelectorAll('.nav-btn')[map[p]].classList.add('active');
    if(p==='events') filterEvents('upcoming',document.querySelector('#page-events .tab'));
    window.scrollTo(0,0);
  }

  function openTicket(id) {
    cart.event = events.find(e=>e.id===id); cart.qty=1;
    renderModal('buy');
    document.getElementById('ticket-modal').classList.add('open');
  }
  function closeModal(e) { if(e.target===document.getElementById('ticket-modal')) document.getElementById('ticket-modal').classList.remove('open'); }
  function genCode() { return 'BJE-'+Math.floor(1000+Math.random()*9000); }

  function renderModal(state) {
    const mb = document.getElementById('modal-body');
    if(state==='buy') {
      const ev = cart.event;
      mb.innerHTML = `
        <div style="font-size:15px;font-weight:700;margin-bottom:3px">${ev.emoji} ${ev.title}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">${ev.date} · ${ev.location}</div>
        <div class="form-group"><label class="form-label">Your name</label><input class="form-input" id="m-name" placeholder="Full name"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="m-email" placeholder="you@email.com"></div>
        <div class="form-group"><label class="form-label">Phone (for address text)</label><input class="form-input" id="m-phone" placeholder="(702) 555-0123"></div>
        <div class="form-group"><label class="form-label">Number of tickets</label>
          <div class="qty-row">
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span id="qty-display" style="font-size:16px;font-weight:700;min-width:24px;text-align:center">${cart.qty}</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
            <span style="font-size:13px;color:var(--text-muted)">× $${ev.price} each</span>
          </div>
        </div>
        <div class="total-row"><span>Total</span><span style="color:var(--coral)">$${(cart.qty*ev.price).toFixed(2)}</span></div>
        <div class="form-group" style="margin-top:12px"><label class="form-label">Card number</label><input class="form-input" placeholder="4242 4242 4242 4242" maxlength="19"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div><label class="form-label">Expiry</label><input class="form-input" placeholder="MM/YY" maxlength="5"></div>
          <div><label class="form-label">CVV</label><input class="form-input" placeholder="123" maxlength="3"></div>
        </div>
        <button class="btn-full coral" id="pay-btn" onclick="processPayment()">Pay $${(cart.qty*ev.price).toFixed(2)} 🎉</button>
        <button class="btn-full ghost" onclick="document.getElementById('ticket-modal').classList.remove('open')">Cancel</button>`;
    } else if(state==='success') {
      const code = genCode();
      const name = document.getElementById('m-name').value;
      const phone = document.getElementById('m-phone').value||'';
      const email = document.getElementById('m-email').value||'';
      cart.event.guests.push({name,email,phone,tickets:cart.qty,code,checkedIn:false});
      validCodes[code] = {eventId:cart.event.id, name:name.split(' ')[0]};
      updateStats();
      mb.innerHTML = `
        <div style="text-align:center;padding:10px 0">
          <div style="font-size:52px;margin-bottom:12px;animation:float 2s ease-in-out infinite">🎊</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:6px">You're in!</div>
          <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Confirmation sent to your email &amp; phone.</div>
          <div style="background:var(--amber-light);border-radius:var(--radius-lg);padding:16px;text-align:left;font-size:13px;margin-bottom:14px">
            <div style="font-weight:700;margin-bottom:4px">${cart.event.emoji} ${cart.event.title} — ${cart.qty} ticket${cart.qty>1?'s':''}</div>
            <div style="color:var(--amber-mid);margin-bottom:10px">${cart.event.date}</div>
            <div class="ticket-code-box">
              <div><div style="font-size:10px;color:var(--amber-mid);margin-bottom:2px;font-weight:600">Your ticket code</div><div class="ticket-code">${code}</div></div>
              <div style="font-size:26px">🎫</div>
            </div>
            <div style="margin-top:10px;background:var(--green-light);border-radius:var(--radius);padding:10px 12px;font-size:12px;color:var(--green-deep);display:flex;gap:7px">
              <span style="font-size:14px">📲</span>
              <span>The full address will be texted &amp; emailed to you the morning of the event. Use your code to look it up anytime.</span>
            </div>
          </div>
          <button class="btn-full coral" onclick="document.getElementById('ticket-modal').classList.remove('open');showPage('lookup')">Look up address with code</button>
          <button class="btn-full ghost" onclick="document.getElementById('ticket-modal').classList.remove('open');showPage('invite')">Invite your crew 🎶</button>
        </div>`;
    }
  }

  function changeQty(d) {
    cart.qty = Math.max(1,Math.min(8,cart.qty+d));
    document.getElementById('qty-display').textContent = cart.qty;
    const p = (cart.qty*cart.event.price).toFixed(2);
    document.querySelectorAll('.total-row span')[1].textContent = '$'+p;
    document.getElementById('pay-btn').textContent = 'Pay $'+p+' 🎉';
  }
  function processPayment() {
    if(!document.getElementById('m-name').value||!document.getElementById('m-email').value){alert('Please enter your name and email.');return;}
    renderModal('success');
  }

  function lookupTicket() {
    const raw = document.getElementById('ticket-code').value.trim().toUpperCase();
    const err = document.getElementById('lookup-error'); err.style.display='none';
    const match = validCodes[raw];
    if(!match){err.textContent='Invalid code. Double-check your confirmation message.';err.style.display='block';return;}
    const ev = events.find(e=>e.id===match.eventId);
    const released = ev&&(ev.addrReleased||ev.isToday);
    if(!released){err.textContent=`Address for ${ev?ev.title:'this event'} hasn't been released yet — check back the morning of!`;err.style.display='block';return;}
    document.getElementById('lookup-form').style.display='none';
    document.getElementById('lock-icon').textContent='🔓';
    document.getElementById('lookup-heading').textContent=`Hey ${match.name}, here's the address!`;
    document.getElementById('lookup-sub').textContent='';
    document.getElementById('addr-result').style.display='block';
    document.getElementById('addr-result').innerHTML=`<div class="addr-reveal">
      <div style="display:flex;justify-content:center;gap:8px;font-size:18px;margin-bottom:8px">🎉🏊🎶🍹🎉</div>
      <div style="font-size:34px;margin-bottom:8px">📍</div>
      <div class="addr-text">${ev.fullAddr}</div>
      <div class="addr-sub">${ev.title} · ${ev.date}</div>
      <div style="margin-top:10px;font-size:13px;color:var(--green-dark)">See you there!</div>
      <a href="https://maps.google.com?q=${encodeURIComponent(ev.fullAddr)}" target="_blank" style="display:inline-block;margin-top:12px">
        <button class="btn-sm green">Get directions 📍</button>
      </a>
    </div>`;
  }

  function setInviteMode(mode, btn) {
    inviteMode=mode;
    document.querySelectorAll('.toggle-opt').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    document.getElementById('email-field').style.display=mode==='email'?'':'none';
    document.getElementById('text-field').style.display=mode==='text'?'':'none';
    document.getElementById('sms-preview-wrap').style.display=mode==='text'?'':'none';
    if(mode==='text') updateSmsPreview();
  }
  function updateSmsPreview() {
    const evId=document.getElementById('invite-event').value;
    const note=document.getElementById('invite-note').value;
    const ev=evId?events.find(e=>e.id==evId):null;
    let msg=`Hey! You're invited to Big John's Events 🎉`;
    if(ev) msg+=`\n\n${ev.emoji} ${ev.title}\n${ev.date}\n${ev.location}\n$${ev.price}/person`;
    if(note) msg+=`\n\n"${note}"`;
    msg+=`\n\n🔒 Address drops day-of\nbigjohnsevents.com`;
    document.getElementById('sms-preview-text').textContent=msg;
  }
  document.getElementById('invite-event').addEventListener('change',updateSmsPreview);
  function addInvite() {
    const val=inviteMode==='email'?document.getElementById('invite-email').value.trim():document.getElementById('invite-phone').value.trim();
    if(!val||inviteList.find(x=>x.val===val)) return;
    inviteList.push({val,mode:inviteMode});
    if(inviteMode==='email') document.getElementById('invite-email').value='';
    else document.getElementById('invite-phone').value='';
    renderChips();
  }
  function removeInvite(val){inviteList=inviteList.filter(x=>x.val!==val);renderChips();}
  function renderChips(){
    document.getElementById('invite-chips').innerHTML=inviteList.map(x=>`
      <div class="invite-chip">
        <span style="display:flex;align-items:center;gap:7px"><span>${x.mode==='text'?'💬':'✉️'}</span>${x.val}</span>
        <button class="remove-btn" onclick="removeInvite('${x.val}')">×</button>
      </div>`).join('');
  }
  function sendInvites(){
    const evId=document.getElementById('invite-event').value;
    if(!evId){alert('Please select an event.');return;}
    if(!inviteList.length){alert('Add at least one contact.');return;}
    const ec=inviteList.filter(x=>x.mode==='email').length;
    const tc=inviteList.filter(x=>x.mode==='text').length;
    let msg=''; if(ec) msg+=`${ec} email${ec>1?'s':''} sent`; if(tc) msg+=(msg?' · ':'')+`${tc} text${tc>1?'s':''} sent`;
    document.getElementById('invite-form').style.display='none';
    document.getElementById('invite-success').style.display='block';
    document.getElementById('invite-success-msg').textContent=msg+' — your crew is on their way!';
  }
  function resetInvite(){
    inviteList=[];
    ['invite-email','invite-phone','invite-note'].forEach(id=>document.getElementById(id).value='');
    document.getElementById('invite-event').value='';
    document.getElementById('invite-chips').innerHTML='';
    document.getElementById('invite-form').style.display='';
    document.getElementById('invite-success').style.display='none';
    document.getElementById('sms-preview-wrap').style.display='none';
  }

  function adminLogin(){
    if(document.getElementById('admin-pass').value===ADMIN_PASSWORD){
      document.getElementById('admin-login-screen').style.display='none';
      document.getElementById('admin-dashboard').style.display='block';
      renderAdminEvents(); updateStats();
    } else { document.getElementById('admin-error').style.display='block'; }
  }
  function adminLogout(){
    document.getElementById('admin-login-screen').style.display='block';
    document.getElementById('admin-dashboard').style.display='none';
    document.getElementById('admin-pass').value='';
    document.getElementById('admin-error').style.display='none';
  }
  function adminTab(tab, btn){
    document.querySelectorAll('.tab.purple').forEach(t=>t.classList.remove('active')); btn.classList.add('active');
    ['address','guestlists','create'].forEach(t=>document.getElementById('atab-'+t).style.display='none');
    document.getElementById('atab-'+tab).style.display='block';
    if(tab==='guestlists') renderAdminGuestLists();
    if(tab==='create'){renderEmojiGrid();document.getElementById('create-success').style.display='none';document.getElementById('create-btn').style.display='';}
  }

  function renderAdminEvents(){
    const upcoming = events.filter(e=>e.upcoming);
    if(!upcoming.length){
      document.getElementById('admin-events-list').innerHTML=`<div class="empty-state"><div class="empty-icon">📋</div><strong>No events yet</strong><p>Use the "+ New event" tab to create your first event.</p></div>`;
      return;
    }
    document.getElementById('admin-events-list').innerHTML=upcoming.map((e,i)=>{
      const released=e.addrReleased||e.isToday;
      const tc=(e.guests||[]).reduce((a,g)=>a+g.tickets,0);
      return `<div class="admin-card" id="acard-${e.id}" style="animation-delay:${i*70}ms">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:26px">${e.emoji}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.title}</div>
            <div style="font-size:11px;color:var(--text-muted)">${e.date} · ${tc} ticket${tc!==1?'s':''} sold</div>
          </div>
          <div id="acard-status-${e.id}" style="font-size:11px;background:${released?'var(--green-light)':'var(--amber-light)'};color:${released?'var(--green-deep)':'var(--amber-mid)'};padding:3px 9px;border-radius:var(--radius-pill);white-space:nowrap;font-weight:600">${released?'🟢 Live':'🟡 Locked'}</div>
        </div>
        <div style="margin-top:10px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:500">Full address</div>
          <div class="addr-input-row">
            <input id="addr-${e.id}" value="${e.fullAddr||''}" placeholder="Enter full address...">
            <button class="btn-sm" id="save-btn-${e.id}" onclick="saveAddr(${e.id})" style="white-space:nowrap">Save</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
          <button id="rel-btn-${e.id}" class="release-btn ${released?'released':''}" onclick="${released?'':'releaseAddr('+e.id+')'}">${released?'✅ Address is live':'📍 Release address now'}</button>
          <button id="notify-btn-${e.id}" class="notify-btn ${e.notified?'sent':''}" onclick="${e.notified?'':'notifyGuests('+e.id+')'}">${e.notified?'✅ Guests notified':'📲 Notify all guests (email + text)'}</button>
          <button class="delete-btn" onclick="confirmDelete(${e.id})">🗑 Delete event</button>
        </div>
        <div class="notify-log" id="notify-log-${e.id}"></div>
        <div class="confirm-delete" id="confirm-${e.id}">
          <p>Delete "${e.title}"? This cannot be undone.</p>
          <div class="confirm-delete-btns">
            <button class="btn-sm" onclick="cancelDelete(${e.id})">Cancel</button>
            <button class="btn-sm red" onclick="deleteEvent(${e.id})">Yes, delete</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function confirmDelete(id){ document.getElementById('confirm-'+id).style.display='block'; }
  function cancelDelete(id){ document.getElementById('confirm-'+id).style.display='none'; }
  function deleteEvent(id){
    Object.keys(validCodes).forEach(code=>{ if(validCodes[code].eventId===id) delete validCodes[code]; });
    events = events.filter(e=>e.id!==id);
    renderAdminEvents(); renderHome(); populateInviteSelect(); updateStats();
  }

  function saveAddr(id){
    const ev=events.find(e=>e.id===id);
    const val=document.getElementById('addr-'+id).value.trim();
    if(!val){alert('Please enter an address.');return;}
    ev.fullAddr=val;
    const btn=document.getElementById('save-btn-'+id);
    btn.textContent='Saved ✓'; btn.style.color='var(--green)';
    setTimeout(()=>{btn.textContent='Save';btn.style.color='';},2000);
  }
  function releaseAddr(id){
    const ev=events.find(e=>e.id===id);
    if(!ev.fullAddr){alert('Save a full address first before releasing.');return;}
    ev.addrReleased=true;
    document.getElementById(`rel-btn-${id}`).className='release-btn released';
    document.getElementById(`rel-btn-${id}`).textContent='✅ Address is live';
    document.getElementById(`rel-btn-${id}`).onclick=null;
    const s=document.getElementById(`acard-status-${id}`);
    s.style.background='var(--green-light)'; s.style.color='var(--green-deep)'; s.textContent='🟢 Live';
    document.getElementById(`acard-${id}`).classList.add('flash');
    setTimeout(()=>document.getElementById(`acard-${id}`).classList.remove('flash'),700);
    renderHome();
  }
  function notifyGuests(id){
    const ev=events.find(e=>e.id===id);
    if(!ev.addrReleased&&!ev.isToday){if(!confirm('Address not released yet — notify anyway?'))return;}
    ev.notified=true;
    const tc=(ev.guests||[]).reduce((a,g)=>a+g.tickets,0);
    notifiedTotal+=tc;
    document.getElementById('as-notified').textContent=notifiedTotal;
    document.getElementById(`notify-btn-${id}`).className='notify-btn sent';
    document.getElementById(`notify-btn-${id}`).textContent='✅ Guests notified';
    document.getElementById(`notify-btn-${id}`).onclick=null;
    const log=document.getElementById(`notify-log-${id}`);
    log.style.display='block';
    log.innerHTML=`<strong>${ev.guests.length} guests notified</strong> via email + text.<br><span style="color:var(--purple)">Sent at ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>`;
  }

  function renderAdminGuestLists(){
    const upcoming=events.filter(e=>e.upcoming);
    if(!upcoming.length){
      document.getElementById('admin-guest-section').innerHTML=`<div class="empty-state"><div class="empty-icon">👥</div><strong>No events yet</strong><p>Create an event first to see guest lists here.</p></div>`;
      return;
    }
    const colors=[['#FAECE7','#993C1D'],['#E1F5EE','#085041'],['#EEEDFE','#3C3489'],['#FBEAF0','#72243E'],['#FAEEDA','#633806']];
    document.getElementById('admin-guest-section').innerHTML=upcoming.map((e,i)=>{
      const guests=e.guests||[];
      const checkedIn=guests.filter(g=>g.checkedIn).length;
      const total=guests.reduce((a,g)=>a+g.tickets,0);
      return `<div class="admin-card" style="animation-delay:${i*60}ms">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:24px">${e.emoji}</span>
            <div><div style="font-size:13px;font-weight:700">${e.title}</div><div style="font-size:11px;color:var(--text-muted)">${e.date}</div></div>
          </div>
          <div style="text-align:right">
            <div style="font-size:13px;font-weight:700;color:var(--coral)">${total} ticket${total!==1?'s':''}</div>
            <div style="font-size:11px;color:var(--green)">${checkedIn}/${guests.length} checked in</div>
          </div>
        </div>
        ${guests.length===0
          ? `<div style="text-align:center;font-size:13px;color:var(--text-muted);padding:16px 0">No guests yet — share the event to get tickets rolling!</div>`
          : guests.map((g,gi)=>{
              const [bg,tc]=colors[gi%colors.length];
              const initials=g.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
              return `<div class="guest-row" id="grow-${e.id}-${gi}">
                <div style="display:flex;align-items:center;gap:9px;flex:1;min-width:0">
                  <div class="guest-avatar" style="background:${bg};color:${tc}">${initials}</div>
                  <div style="min-width:0">
                    <div class="guest-name">${g.name}</div>
                    <div class="guest-meta">${g.phone||g.email||''} · ${g.tickets} ticket${g.tickets!==1?'s':''} · <span style="font-family:monospace">${g.code||''}</span></div>
                  </div>
                </div>
                <button id="ci-${e.id}-${gi}" class="check-in-btn ${g.checkedIn?'checked':''}" onclick="${g.checkedIn?'':'checkIn('+e.id+','+gi+')'}">${g.checkedIn?'✓ In':'Check in'}</button>
              </div>`;
            }).join('')}
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);display:flex;gap:7px">
          <button class="btn-sm" onclick="exportCSV(${e.id})">Export CSV ↓</button>
          <button class="btn-sm coral" onclick="window.print()">Print check-in sheet</button>
        </div>
      </div>`;
    }).join('');
  }

  function checkIn(evId,gi){
    const ev=events.find(e=>e.id===evId); ev.guests[gi].checkedIn=true;
    const btn=document.getElementById(`ci-${evId}-${gi}`);
    btn.className='check-in-btn checked'; btn.textContent='✓ In'; btn.onclick=null;
    const row=document.getElementById(`grow-${evId}-${gi}`);
    row.style.background='var(--green-light)'; row.style.borderRadius='var(--radius)';
    setTimeout(()=>{row.style.background='';row.style.borderRadius='';},1000);
    renderAdminGuestLists();
  }
  function exportCSV(evId){
    const ev=events.find(e=>e.id===evId);
    const rows=[['Name','Email','Phone','Tickets','Code','Checked In'],
      ...(ev.guests||[]).map(g=>[g.name,g.email||'',g.phone||'',g.tickets,g.code||'',g.checkedIn?'Yes':'No'])];
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
    const a=document.createElement('a'); a.href='data:text/csv,'+encodeURIComponent(csv);
    a.download=`${ev.title.replace(/\s/g,'-')}-guests.csv`; a.click();
  }

  function renderEmojiGrid(){
    document.getElementById('emoji-grid').innerHTML=EMOJIS.map(em=>
      `<button class="emoji-opt ${em===selectedEmoji?'selected':''}" onclick="selectEmoji('${em}',this)">${em}</button>`
    ).join('');
  }
  function selectEmoji(em,btn){
    selectedEmoji=em;
    document.querySelectorAll('.emoji-opt').forEach(b=>b.classList.remove('selected')); btn.classList.add('selected');
  }
  function createEvent(){
    const title=document.getElementById('new-title').value.trim();
    const date=document.getElementById('new-date').value.trim();
    const area=document.getElementById('new-area').value.trim();
    const addr=document.getElementById('new-addr').value.trim();
    const price=parseFloat(document.getElementById('new-price').value);
    const spots=parseInt(document.getElementById('new-spots').value);
    const err=document.getElementById('create-error');
    if(!title||!date||!area||!price||!spots){err.textContent='Please fill in all required fields.';err.style.display='block';return;}
    err.style.display='none';
    const newEv={id:nextId++,title,date,location:area,fullAddr:addr||'',price,available:true,upcoming:true,emoji:selectedEmoji,spots,isToday:false,addrReleased:false,notified:false,guests:[]};
    events.unshift(newEv);
    renderHome(); populateInviteSelect(); renderAdminEvents(); updateStats();
    document.getElementById('create-btn').style.display='none';
    document.getElementById('create-success').style.display='block';
    document.getElementById('create-success-msg').textContent=`"${title}" is live! 🎉`;
  }
  function resetCreateForm(){
    ['new-title','new-date','new-area','new-addr','new-price','new-spots'].forEach(id=>document.getElementById(id).value='');
    selectedEmoji='🎉'; renderEmojiGrid();
    document.getElementById('create-success').style.display='none';
    document.getElementById('create-error').style.display='none';
    document.getElementById('create-btn').style.display='';
  }

  renderHome();
  populateInviteSelect();
  filterEvents('upcoming', document.querySelector('#page-events .tab'));
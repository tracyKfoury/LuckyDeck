/* Lucky-Deck master script


/* 1 ────────────────────────────────────────────────────────── */
/* BLACKJACK TABLE  (runs only on blackjack.html)              */
class BlackjackTable {
  #API = 'https://deckofcardsapi.com/api/deck';
  #deckId = '';
  #player = [];
  #dealer = [];
  #finished = false;

  constructor (rootId = 'blackjackTable') {
    this.root = document.getElementById(rootId);
    if (!this.root) return;                // page has no table
    this.cacheDom();
    this.bindEvents();
    this.newGame();
  }

  cacheDom () {
    this.hitBtn   = this.root.querySelector('#btnHit');
    this.standBtn = this.root.querySelector('#btnStand');
    this.newBtn   = this.root.querySelector('#btnNew');
    this.playerUI = this.root.querySelector('#playerCards');
    this.dealerUI = this.root.querySelector('#dealerCards');
    this.status   = this.root.querySelector('#statusTxt');
  }

  bindEvents () {
    this.hitBtn  .addEventListener('click', () => this.hit());
    this.standBtn.addEventListener('click', () => this.stand());
    this.newBtn  .addEventListener('click', () => this.newGame());
  }

  /* helpers */
  cardVal (v){
    if (v === 'ACE') return 11;
    if (['KING','QUEEN','JACK'].includes(v)) return 10;
    return Number(v);
  }
  score (hand){
    let s = hand.reduce((t,c)=>t + this.cardVal(c.value), 0);
    hand.filter(c=>c.value==='ACE').forEach(()=>{ if (s>21) s-=10; });
    return s;
  }
  async draw (n){
    try{
      const r = await fetch(`${this.#API}/${this.#deckId}/draw/?count=${n}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).cards;
    }catch(e){
      console.error(e);
      this.status.textContent = '⚠ Network error – try again';
      return [];
    }
  }
  render (){
    this.playerUI.innerHTML = this.#player
      .map(c=>`<img src="${c.image}" class="card-sm">`).join('');
    this.dealerUI.innerHTML = this.#dealer
      .map((c,i)=>`<img src="${i===0 && !this.#finished ? 'images/back.png':c.image}"
                      class="card-sm">`).join('');
  }

  /* game flow */
  async newGame (){
    try{
      const r = await fetch(`${this.#API}/new/shuffle/`);
      this.#deckId = (await r.json()).deck_id;
      this.#player = [];
      this.#dealer = [];
      this.#finished = false;
      this.status.textContent = '';

      this.#dealer.push(...await this.draw(1));
      this.#player.push(...await this.draw(2));
      this.render();
      this.hitBtn.disabled = this.standBtn.disabled = false;
    }catch(e){
      console.error(e);
      this.status.textContent = '⚠ Unable to shuffle deck.';
    }
  }
  async hit (){
    if (this.#finished) return;
    this.#player.push(...await this.draw(1));
    if (this.score(this.#player) > 21){
      this.#finished = true;
      this.status.textContent = 'Player Busts!';
    }
    this.render();
  }
  async stand (){
    if (this.#finished) return;
    this.#finished = true;

    while (this.score(this.#dealer) < 17){
      this.#dealer.push(...await this.draw(1));
    }
    const ps = this.score(this.#player);
    const ds = this.score(this.#dealer);
    this.status.textContent =
      ds > 21 || ps > ds ? 'Player Wins!' :
      ps === ds          ? 'Push!'        :
                           'Dealer Wins!';
    this.render();
  }
}

/* 2 ────────────────────────────────────────────────────────── */
/* JACKPOT 777 WHEEL  (runs only on jackpot.html)              */
class Wheel777 {
  constructor (wheelId = 'wheel', btnId = 'spinBtn'){
    this.wheel = document.getElementById(wheelId);
    this.btn   = document.getElementById(btnId);
    if (!this.wheel || !this.btn) return;   // page without wheel
    this.prizes = ['30£','90£','200£','400FT','500T','×2',
                   'Bonus','Spin again','30£','90£','1500£','JACKPOT!'];
    this.busy = false;
    this.btn.addEventListener('click', () => this.spin());
  }
  spin (){
    if (this.busy) return;
    this.busy = true;
    const i     = Math.floor(Math.random()*12);
    const slice = 360/12;
    const deg   = 360*5 + (360 - i*slice) - slice/2;
    this.wheel.style.transform = `rotate(${deg}deg)`;
    setTimeout(()=>{
      this.toast(`🎉 You won <strong>${this.prizes[i]}</strong>!`);
      this.busy = false;
    }, 5200);
  }
  toast (html){
    const t = Object.assign(document.createElement('div'),{
      className:'toast text-bg-success border-0 position-fixed bottom-0 end-0 m-3',
      role:'alert',
      innerHTML:`
        <div class="d-flex">
          <div class="toast-body">${html}</div>
          <button class="btn-close btn-close-white me-2 m-auto"
                  data-bs-dismiss="toast"></button>
        </div>`
    });
    document.body.appendChild(t);
    bootstrap.Toast.getOrCreateInstance(t).show();
  }
}

/* 3 ────────────────────────────────────────────────────────── */
/* FAQ  = handled by Bootstrap’s built-in accordion + CSS arrow */


/* 4 ────────────────────────────────────────────────────────── */
/* SIGN-UP FORM  (runs only if #newsletterForm exists)         */
import { initializeApp     } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, addDoc, collection, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

function initSignUpForm (){
  const form = document.getElementById('newsletterForm');
  if (!form) return;

  /* Firebase */
  const app = initializeApp({
    apiKey            : 'YOUR_API_KEY',
    authDomain        : 'YOUR_PROJECT.firebaseapp.com',
    projectId         : 'YOUR_PROJECT',
    storageBucket     : 'YOUR_PROJECT.appspot.com',
    messagingSenderId : '123456789',
    appId             : 'YOUR_APP_ID'
  });
  const db = getFirestore(app);

  const fields = form.querySelectorAll('.form-field');
  fields.forEach(f=>f.addEventListener('input',()=>f.classList.remove('is-invalid')));

  form.addEventListener('submit', async e=>{
    e.preventDefault();

    const [nameEl,emailEl,dobEl] = fields;
    const data = {
      name : nameEl.value.trim(),
      email: emailEl.value.trim(),
      dob  : dobEl.value
    };

    let ok=true;
    if(!data.name)                      { mark(nameEl);  ok=false; }
    if(!/^[\w.+-]+@\w+\.\w{2,}$/.test(data.email))
                                        { mark(emailEl); ok=false; }

    const age = (Date.now()-new Date(data.dob))/3.15576e10;
    if(age < 18 || isNaN(age))          { mark(dobEl);   ok=false; }

    const sense=document.getElementById('sense');
    const ageBox=document.getElementById('age');
    if(!sense.checked || !ageBox.checked) ok=false;

    if(!ok) return;

    try{
      await addDoc(collection(db,'newsletterSignups'),{
        ...data,
        wantsMarketing: document.getElementById('marketing').checked,
        ts: serverTimestamp()
      });
      toast('✅ Thanks – you’re subscribed!');
    }catch(err){
      console.error(err);
      toast('⚠️ Could not save – try later.');
    }finally{
      form.reset();
      window.location.href = 'thanks.html';
    }
  });

  function mark(el){ el.classList.add('is-invalid'); }
  function toast(msg){
    const t=document.createElement('div');
    t.className='toast text-bg-dark border-0 position-fixed bottom-0 end-0 m-3';
    t.role='alert';
    t.innerHTML=`<div class="d-flex">
                   <div class="toast-body">${msg}</div>
                   <button class="btn-close btn-close-white me-2 m-auto"
                           data-bs-dismiss="toast"></button>
                 </div>`;
    document.body.appendChild(t);
    bootstrap.Toast.getOrCreateInstance(t).show();
  }
}

/* ── INITIALISE EVERYTHING ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', ()=>{
  new BlackjackTable();   // auto-detects if table exists
  new Wheel777();         // auto-detects if wheel exists
  initSignUpForm();       // only runs if form exists
});

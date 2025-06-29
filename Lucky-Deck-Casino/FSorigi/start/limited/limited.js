/* Lucky-Deck – Limited Edition HIGH / LOW  */

class HighLowGame{
  #API = 'https://deckofcardsapi.com/api/deck';
  #deckId = '';
  #current = null;
  #streak = 0;

  constructor(rootId='highLow'){
    this.root = document.getElementById(rootId);
    if(!this.root) return;

    /* DOM refs */
    this.cardSpot  = this.root.querySelector('#currentCard');
    this.lowerBtn  = this.root.querySelector('#btnLower');
    this.higherBtn = this.root.querySelector('#btnHigher');
    this.statusTxt = this.root.querySelector('#statusHL');
    this.streakTxt = this.root.querySelector('#streakHL');
    this.restartBtn= this.root.querySelector('#btnRestart');

    /* handlers */
    this.lowerBtn .addEventListener('click',()=>this.guess('lower'));
    this.higherBtn.addEventListener('click',()=>this.guess('higher'));
    this.restartBtn.addEventListener('click',()=>this.startRound());

    this.startRound();
  }

  /* ---------------------------------------------------- */
  async startRound(){
    this.toggleButtons(false);
    this.statusTxt.textContent = '';
    this.streak = 0; this.updateStreak();

    /* shuffle fresh deck */
    try{
      const r=await fetch(`${this.#API}/new/shuffle/?deck_count=1`);
      this.#deckId=(await r.json()).deck_id;
      this.#current = await this.drawOne();
      await this.showCard(this.#current,true);    // show face

      this.toggleButtons(true);
      this.restartBtn.classList.add('d-none');
    }catch(e){
      console.error(e);this.statusTxt.textContent='⚠ Network error';
    }
  }

  async guess(dir){
    this.toggleButtons(false);
    const next=await this.drawOne();

    /* flip animation */
    await this.flipTo(next.image);

    /* compare values */
    const order=['2','3','4','5','6','7','8','9','10','JACK','QUEEN','KING','ACE'];
    const curIdx=order.indexOf(this.#current.value);
    const nxtIdx=order.indexOf(next.value);
    const result = nxtIdx===curIdx ? 'equal'
                 : nxtIdx>curIdx  ? 'higher' : 'lower';

    if(result===dir){          // correct
      this.#current=next;
      this.streak++;
      this.updateStreak();
      if(this.streak===5){
        this.statusTxt.textContent='🎉 YOU WIN THE POT!';
        confetti();
        this.restartBtn.classList.remove('d-none');
      }else{
        this.statusTxt.textContent='✓ Correct – keep going…';
        this.toggleButtons(true);
      }
    }else{                     // wrong
      this.statusTxt.textContent='✖ Wrong – try a new round';
      this.restartBtn.classList.remove('d-none');
    }
  }

  /* ---------------------------------------------------- helpers */
  async drawOne(){
    const r=await fetch(`${this.#API}/${this.#deckId}/draw/?count=1`);
    return (await r.json()).cards[0];
  }
  async showCard(card,instant=false){
    /* build cube with back + face */
    this.cardSpot.innerHTML=`
      <div class="card-img${instant?'':' flip'}">
        <div class="card-back"></div>
        <img src="${card.image}" class="card-face">
      </div>`;
    /* if not instant, wait until CSS flip ends so we don’t overlap */
    if(!instant) await wait(600);
  }
  async flipTo(faceSrc){
    /* replace existing cube with new face but start showing back */
    this.cardSpot.innerHTML=`
      <div class="card-img flip">
        <div class="card-back"></div>
        <img src="${faceSrc}" class="card-face">
      </div>`;
    await wait(600);
  }
  toggleButtons(on){
    [this.lowerBtn,this.higherBtn].forEach(b=>b.disabled=!on);
  }
  updateStreak(){
    this.streakTxt.textContent = `Streak : ${this.streak}/5`;
  }
}

/* util */
const wait = ms=>new Promise(res=>setTimeout(res,ms));

/* cheap confetti (emoji) */
function confetti(){
  const N=24;
  for(let i=0;i<N;i++){
    const s=document.createElement('div');
    s.textContent='💰';
    Object.assign(s.style,{
      position:'fixed',
      left:(Math.random()*100)+'vw',
      top:'-3rem',
      fontSize:'2rem',
      animation:`fall 1.6s ${Math.random()*0.3}s linear forwards`
    });
    document.body.appendChild(s);
    s.addEventListener('animationend',()=>s.remove());
  }
  const style=document.createElement('style');
  style.textContent=`
  @keyframes fall{
    to{transform:translateY(110vh) rotate(600deg);opacity:0}
  }`;
  document.head.appendChild(style);
}

/* initialise */
document.addEventListener('DOMContentLoaded',()=>new HighLowGame());

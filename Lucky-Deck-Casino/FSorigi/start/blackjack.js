/* Lucky Deck – Blackjack  (ES6 class, no deps beyond fetch+Bootstrap) */

class BlackjackTable {
  /* private fields */
  #API = 'https://deckofcardsapi.com/api/deck';
  #deckId = '';
  #player = [];
  #dealer = [];
  #finished = false;

  constructor (rootId='blackjackTable'){
    this.root = document.getElementById(rootId);
    if (!this.root) return;          // not on this page

    /* cache DOM */
    this.hitBtn   = this.root.querySelector('#btnHit');
    this.standBtn = this.root.querySelector('#btnStand');
    this.newBtn   = this.root.querySelector('#btnNew');
    this.playerUI = this.root.querySelector('#playerCards');
    this.dealerUI = this.root.querySelector('#dealerCards');
    this.status   = this.root.querySelector('#statusTxt');
    this.playerTot= document.getElementById('playerTotal');
    this.dealerTot= document.getElementById('dealerTotal');

    /* bind events */
    this.hitBtn  .addEventListener('click',()=>this.hit());
    this.standBtn.addEventListener('click',()=>this.stand());
    this.newBtn  .addEventListener('click',()=>this.newGame());

    this.newGame();
  }

  /* ---------- helpers ---------- */
  cardVal (v){
    if (v==='ACE') return 11;
    if (['KING','QUEEN','JACK'].includes(v)) return 10;
    return Number(v);
  }
  score (hand){
    let s = hand.reduce((t,c)=>t+this.cardVal(c.value),0);
    hand.filter(c=>c.value==='ACE').forEach(()=>{ if(s>21) s-=10; });
    return s;
  }
  async draw (n){
    const url = `${this.#API}/${this.#deckId}/draw/?count=${n}`;
    try{
      const r = await fetch(url);
      if(!r.ok) throw new Error(`HTTP ${r.status}`);
      return (await r.json()).cards;
    }catch(e){
      console.error(e);
      this.status.textContent = '⚠ Network error – hit “New Game”';
      return [];
    }
  }

  /* ---------- render ---------- */
  render (){
    /* player cards */
    this.playerUI.innerHTML = this.#player
      .map(c=>`<img src="${c.image}" class="card-sm">`).join('');

    /* dealer cards (hole-card backs until finished) */
    this.dealerUI.innerHTML = this.#dealer.map((c,i)=>{
      const back   = i===0 && !this.#finished;
      const flipMe = i===0 &&  this.#finished;
      return back
        ? `<div class="card-sm card-back"></div>`
        : `<img src="${c.image}" class="card-sm${flipMe?' card-flip':''}">`;
    }).join('');

    /* update totals */
    this.playerTot.textContent = this.score(this.#player);
    this.dealerTot.textContent = this.#finished
       ? this.score(this.#dealer) : '?';
  }

  /* ---------- game flow ---------- */
  async newGame (){
    try{
      const r = await fetch(`${this.#API}/new/shuffle/`);
      this.#deckId = (await r.json()).deck_id;
      this.#player = []; this.#dealer = []; this.#finished = false;
      this.status.textContent = '';

      this.#dealer.push(...await this.draw(1));
      this.#player.push(...await this.draw(2));
      this.render();

      this.hitBtn.disabled = this.standBtn.disabled = false;
    }catch(e){
      console.error(e);
      this.status.textContent = '⚠ Could not shuffle deck.';
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
    const ps=this.score(this.#player), ds=this.score(this.#dealer);
    this.status.textContent =
      ds>21||ps>ds ? 'Player Wins!' : ps===ds ? 'Push!' : 'Dealer Wins!';

    this.render();
  }
}

/* ---------- initialise when DOM ready ---------- */
document.addEventListener('DOMContentLoaded', ()=> new BlackjackTable());

/* helpers */
const rand = n => Math.floor(Math.random() * n);
const $    = s => document.querySelector(s);

const reels = [...document.querySelectorAll('.reel')];
const btn   = $('#spinBtn');

/* symbols & timing */
const symbols   = ['7','0','1','2','3','4','5','6','8','9'];
const rollTime  = 650;  // ms each reel animates
const delayStep = 180;  // stagger start
let credits = 100;
const creditsEl = document.getElementById('credits');

btn.addEventListener('click', spin);

function spin(){
  btn.disabled = true;

  reels.forEach((reel,i)=>{
    setTimeout(()=>{
      reel.style.animation = `spinRoll ${rollTime}ms ease`;
      setTimeout(()=>{
        reel.style.animation = 'none';
        reel.firstElementChild.textContent = symbols[rand(symbols.length)];

        /* last reel finished? */
        if(i === reels.length - 1){
         credits--;                     // cost per spin
         creditsEl.textContent = credits;

          btn.disabled = false; 
          checkWin();
        }
      }, rollTime);
    }, i * delayStep);
  });
}

function checkWin(){
  /* literal 777 wins – change if you want another rule */
  if(reels.map(r=>r.textContent).join('') === '777'){
    alert('🎉  JACKPOT!  You hit 777!');
    credits += 50;                 // simple win payout
 creditsEl.textContent = credits;

  }
}

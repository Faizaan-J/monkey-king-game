// ── ASSETS ──
const A = {
    idle: "./assets/monkeyking/Monkey-King-Aura-Farm.png",
    fist: "./assets/monkeyking/Fist-Like-Lightning.png",
    kick: "./assets/monkeyking/Thunderous-Foot.png"
};

// ── AUDIO ──
// Each cutscene slide has an array of audio clips that play in sequence
const AUDIO_CLIPS = {
    '1': './assets/audio/1.mp3',
    '2': "./assets/audio/2.mp3",
    '3': "./assets/audio/3.mp3",
    '4': "./assets/audio/4.mp3",
    "5": "./assets/audio/5.mp3",
    "6": "./assets/audio/6.mp3",
    "7": "./assets/audio/7.mp3",
    "8": "./assets/audio/8.mp3",
    "9": "./assets/audio/8.mp3"
};

// Slide → audio clip sequence + image + text + pan
const CS = [
    {
        img: "./assets/pages/page7.png",
        clips: ['1'],
        texts: [
            "One bright and starry night, The Gods, The Goddesses, The Demons, and The Spirits gathered in heaven for a dinner party."
        ],
        from: { x: -3, y: -3 }, to: { x: 3, y: 3 },
    },
    {
        img: "./assets/pages/page8.png",
        clips: ["2", '3'],
        texts: [
            "Their music and the scent of their wine drifted down...",
            "...down... to Flower-Fruit Mountain... where flowers bloomed year-round... and monkeys frolicked under the watchful eye of the magical... MONKEY KING. Now the Monkey King was a deity in his own right."
        ],
        from: { x: 5, y: 0 }, to: { x: -5, y: -3 },
    },
    {
        img: "./assets/pages/page9.png",
        clips: ['4'],
        texts: [
            "Legend had it that long ago, the Monkey King was born of a rock. When his eyes first opened, they flashed rays of light deep into the sky. All of Heaven took notice. He purged Flower-Fruit Mountain of the Tiger-Spirit... and established his kingdom."
        ],
        from: { x: -5, y: -5 }, to: { x: 5, y: 5 },
    },
    {
        img: "./assets/pages/page10.png",
        clips: ['5', '6', '7'],
        texts: [
            "The Monkey King ruled with a firm but gentle hand. He spent his days studying the Arts of Kung-Fu. He quickly mastered thousands of minor disciplines, as well as the Four Major Heavenly Disciplines — prerequisites to immortality.",
            "Discipline One: Fist-Like-Fighting.",
            "Discipline Two: Thunderous Foot.",
        ],
        from: { x: 3, y: -3 }, to: { x: -3, y: 3 },
    },
    {
        img: "./assets/pages/page11.png",
        clips: ['8', '9'],
        texts: [
            "Discipline Three: Heavenly Senses.",
            "Discipline Four: Cloud-As-Steed."
        ],
        from: { x: -5, y: 0 }, to: { x: 5, y: 0 },
    },
];

// ── ENEMIES ──
const ENEMIES = {
    fire: { 
        name: 'I AM FIRE MAN', 
        hp: 100, 
        moves: ['dark_claw', 'inferno', 'curse'], 
        src: "./assets/enemies/fireman.png",
        border: "drop-shadow(2px 0px 0px #ff5722) drop-shadow(-2px 0px 0px #ff5722) drop-shadow(0px 2px 0px #ff5722) drop-shadow(0px -2px 0px #ff5722)"
    },
    ice: { 
        name: "I AM ICE MAN", 
        hp: 80, 
        moves: ['blizzard_fist', 'glacial_stomp', 'ice_shard_volley', 'permafrost_aura', 'arctic_sense', 'frost_cloud'], 
        src: "./assets/enemies/iceman.png",
        border: "drop-shadow(2px 0px 0px #4fc3f7) drop-shadow(-2px 0px 0px #4fc3f7) drop-shadow(0px 2px 0px #4fc3f7) drop-shadow(0px -2px 0px #4fc3f7)"
    }
};

// ── STATE ──
let S = {};
function resetState(enemyKey) {
    const e = ENEMIES[enemyKey];
    S = {
        enemy: enemyKey,
        php: 100, pmaxhp: 100,
        ehp: e.hp, emaxhp: e.hp,
        sizeUp: false, cloudUp: false, senseUp: false,
        pp: { fist: 8, kick: 8, senses: 5, cloud: 5, size: 3, hair: 3 },
        maxpp: { fist: 8, kick: 8, senses: 5, cloud: 5, size: 3, hair: 3 },
        busy: false,
    };
}

// ── AUDIO PLAYER ──
let currentAudio = null;

function stopAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
}

function playClip(clipId) {
    return new Promise(resolve => {
        stopAudio();
        const audio = new Audio(AUDIO_CLIPS[clipId]);
        currentAudio = audio;
        audio.onended = () => { currentAudio = null; resolve(); };
        audio.onerror = () => { currentAudio = null; resolve(); };
        audio.play();
        // audio.play().catch(() => resolve());
    });
}

// ── CUTSCENE ──
let csIdx = 0;
let csAborted = false;
let csTimer = null;
let csAdvanceRequested = false;
let textTimer = null;

function playCutscene() {
    csIdx = 0;
    csAborted = false;
    csAdvanceRequested = false;
    show('cutscene');
    runSlide();
}

async function runSlide() {
    if (csAborted || csIdx >= CS.length) {
        csAdvanceRequested = false;
        stopAudio();
        clearTextTimer();
        showMenu();
        return;
    }

    csAdvanceRequested = false;

    const slide = CS[csIdx];
    const img = document.getElementById('cs-img');
    const ind = document.getElementById('pg-ind');

    // Swap image with fade
    img.style.opacity = '0';
    img.src = slide.img;
    img.onload = () => { img.style.opacity = '1'; };

    // Ken Burns pan — full slide duration
    const totalDur = slide.clips.reduce((acc, id) => {
        // estimate: we'll just use 7s min or let audio drive it
        return acc;
    }, 0);

    img.style.transition = 'none';
    img.style.transform = `translate(${slide.from.x}%,${slide.from.y}%)`;
    setTimeout(() => {
        img.style.transition = `transform 30s ease-in-out, opacity 0.8s ease`;
        img.style.transform = `translate(${slide.to.x}%,${slide.to.y}%)`;
    }, 60);

    ind.textContent = `${csIdx + 1} / ${CS.length}`;

    // Play each clip in sequence, updating text as each starts
    for (let i = 0; i < slide.clips.length; i++) {
        if (csAborted || csAdvanceRequested) return;
        // Update narration text
        typeText(slide.texts[i] || '');
        await playClip(slide.clips[i]);
        if (csAborted || csAdvanceRequested) return;
    }

    // Small pause between slides
    await sleep(600);
    if (csAborted || csAdvanceRequested) return;

    csIdx++;
    runSlide();
}

function clearTextTimer() {
    if (textTimer) {
        clearInterval(textTimer);
        textTimer = null;
    }
}

function typeText(text) {
    const el = document.getElementById('nar-txt');
    clearTextTimer();
    el.textContent = '';
    let i = 0;
    textTimer = setInterval(() => {
        if (csAborted || csAdvanceRequested) {
            clearTextTimer();
            return;
        }
        if (i < text.length) el.textContent += text[i++];
        else clearTextTimer();
    }, 28);
}

function advanceCutscene() {
    if (csAborted || csAdvanceRequested) return;
    csAdvanceRequested = true;
    stopAudio();
    clearTextTimer();
    csIdx++;
    runSlide();
}

function skipCutscene() {
    csAborted = true;
    csAdvanceRequested = false;
    stopAudio();
    clearTextTimer();
    clearTimeout(csTimer);
    showMenu();
}

// ── SCREENS ──
function show(id) {
    ['cutscene', 'menu', 'battle', 'gameover'].forEach(s => {
        document.getElementById(s).style.display = 'none';
    });
    const t = document.getElementById(id);
    t.style.display = ['menu', 'battle', 'gameover'].includes(id) ? 'flex' : 'block';
}

function showMenu() { show('menu'); }
function goMenu() { show('menu'); }

// ── BATTLE START ──
function startBattle(key) {
    resetState(key);
    const e = ENEMIES[key];
    const enemyImg = document.getElementById('enemy-img');
    const playerImg = document.getElementById('player-img');
    document.getElementById('ename').textContent = e.name;
    enemyImg.src = e.src;
    enemyImg.style.filter = e.border;
    enemyImg.classList.remove("death");
    playerImg.src = A.idle;
    playerImg.classList.remove("death");
    document.getElementById('player-spr').style.transform = '';
    document.getElementById('cloud-fx').style.opacity = '0';
    updateHUD(); updatePP();
    log('Choose your move!');
    enableMoves(true);
    show('battle');
}

// ── HUD ──
function updateHUD() {
    const pp = S.php / S.pmaxhp * 100, ep = S.ehp / S.emaxhp * 100;
    const pb = document.getElementById('php'), eb = document.getElementById('ehp');
    pb.style.width = pp + '%'; eb.style.width = ep + '%';
    pb.className = 'hpfill' + (pp < 25 ? ' low' : pp < 50 ? ' mid' : '');
    eb.className = 'hpfill' + (ep < 25 ? ' low' : ep < 50 ? ' mid' : '');
    document.getElementById('phptxt').textContent = `HP: ${Math.max(0, S.php)}/${S.pmaxhp}`;
    document.getElementById('ehptxt').textContent = `HP: ${Math.max(0, S.ehp)}/${S.emaxhp}`;
}
function updatePP() {
    ['fist', 'kick', 'senses', 'cloud', 'size', 'hair'].forEach(k => {
        document.getElementById('pp-' + k).textContent = `PP ${S.pp[k]}/${S.maxpp[k]}`;
    });
}
function log(msg) { document.getElementById('blog').textContent = msg; }
function enableMoves(v) { document.querySelectorAll('.mvbtn').forEach(b => b.disabled = !v); }

// ── MOVES ──
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const MOVES = {
    fist: {
        color: '#facc15', pp: 'fist',
        exec: () => { const d = rand(18, 28) * (S.sizeUp ? 1.5 : 1) | 0; return { dmg: d, log: `⚡ FIST-LIKE-LIGHTNING! ${d} damage!${S.sizeUp ? ' (Size bonus!)' : ''}`, sprite: 'fist', lightning: true }; }
    },
    kick: {
        color: '#a78bfa', pp: 'kick',
        exec: () => { const d = rand(22, 35); return { dmg: d, log: `💥 THUNDEROUS FOOT shakes the earth! ${d} damage!`, sprite: 'kick' }; }
    },
    senses: {
        color: '#34d399', pp: 'senses',
        exec: () => { S.senseUp = true; return { dmg: 0, log: `👁 HEAVENLY SENSES activated! Dodge +40%!`, buff: true }; }
    },
    cloud: {
        color: '#7dd3fc', pp: 'cloud',
        exec: () => { S.cloudUp = true; document.getElementById('cloud-fx').style.opacity = '1'; return { dmg: 0, log: `☁ CLOUD-AS-STEED summoned! Evasion raised!`, buff: true }; }
    },
    size: {
        color: '#fb923c', pp: 'size',
        exec: () => { S.sizeUp = true; return { dmg: 0, log: `⬆ MONKEY KING GROWS COLOSSAL! Attack x1.5!`, buff: true, grow: true }; }
    },
    hair: {
        color: '#f9a8d4', pp: 'hair',
        exec: () => { const d = 3 * rand(8, 14); return { dmg: d, log: `🐒 3 HAIR CLONES attack for ${d} total damage!` }; }
    },
};

async function useMove(key) {
    if (S.busy) return;
    if (S.pp[key] <= 0) { log('No PP left for that move!'); return; }
    S.busy = true; enableMoves(false);
    S.pp[key]--; updatePP();

    const mv = MOVES[key], res = mv.exec();

    if (res.sprite === 'fist') {
        document.getElementById('player-img').src = A.fist;
        setTimeout(() => document.getElementById('player-img').src = A.idle, 650);
    } else if (res.sprite === 'kick') {
        document.getElementById('player-img').src = A.kick;
        setTimeout(() => document.getElementById('player-img').src = A.idle, 650);
    }

    const pspr = document.getElementById('player-spr');
    if (!res.buff) { pspr.classList.add('atk-lunge'); setTimeout(() => pspr.classList.remove('atk-lunge'), 500); }
    else { pspr.style.filter = `drop-shadow(0 0 12px ${mv.color})`; setTimeout(() => pspr.style.filter = '', 800); }
    if (res.grow) { pspr.classList.add('grow-anim'); setTimeout(() => { pspr.classList.remove('grow-anim'); pspr.style.transform = 'scale(1.3)'; }, 600); }

    log(res.log);
    await sleep(600);

    if (res.dmg > 0) {
        if (res.lightning) drawLightning();
        const espr = document.getElementById('enemy-spr');
        espr.classList.add('hit-flash'); setTimeout(() => espr.classList.remove('hit-flash'), 450);
        S.ehp = Math.max(0, S.ehp - res.dmg);
        spawnDmg(540, 180, res.dmg, mv.color);
        updateHUD();
    }

    await sleep(900);
    if (key === 'cloud') setTimeout(() => { S.cloudUp = false; document.getElementById('cloud-fx').style.opacity = '0'; }, 2200);
    if (S.ehp <= 0) { await sleep(300); showGameOver(true); return; }
    await enemyTurn();
    S.busy = false;
    if (S.php > 0) { enableMoves(true); log('Your turn! Choose a move.'); }
}

async function enemyTurn() {
    const e = ENEMIES[S.enemy];
    const mv = e.moves[Math.floor(Math.random() * e.moves.length)];
    await sleep(500);
    let dmg = 0, msg = '';
    switch (mv) {
        case 'scratch': dmg = rand(12, 20); msg = `${e.name} slashes with sharp claws! ${dmg} damage!`; break;
        case 'roar': dmg = rand(8, 15); msg = `${e.name} lets out a terrifying ROAR! ${dmg} damage!`; break;
        case 'pounce': dmg = rand(18, 28); msg = `${e.name} POUNCES forward! ${dmg} damage!`; break;
        case 'spear': dmg = rand(15, 24); msg = `${e.name} thrusts his celestial spear! ${dmg} damage!`; break;
        case 'divine_blast': dmg = rand(20, 32); msg = `${e.name} fires a DIVINE BLAST! ${dmg} damage!`; break;
        case 'shield': dmg = 0; msg = `${e.name} raises his divine shield!`; break;
        case 'dark_claw': dmg = rand(20, 30); msg = `${e.name} strikes with DARK CLAWS! ${dmg} damage!`; break;
        case 'inferno': dmg = rand(25, 38); msg = `${e.name} unleashes INFERNO! ${dmg} damage!`; break;
        case 'curse': dmg = rand(10, 18); msg = `${e.name} casts a CURSE! ${dmg} damage!`; break;
        case 'blizzard_fist': dmg = rand(10, 18) * 2; msg = `${e.name} unleashes BLIZZARD FIST! ${dmg} rapid frozen strikes!`; break;
        case 'glacial_stomp': dmg = rand(25, 40); msg = `${e.name}'s GLACIAL STOMP freezes the ground! ${dmg} damage!`; break;
        case 'ice_shard_volley': dmg = rand(12, 18) * 3; msg = `${e.name} ICE SHARD CLONES shatter into you! ${dmg} total damage!`; break;
        case 'permafrost_aura': dmg = 0; msg = `${e.name} encases himself in ICE ARMOR! Defense raised!`; break;
        case 'arctic_sense': dmg = 0; msg = `ARCTIC SENSE activated! ${e.name} reads your next move!`; break;
        case 'frost_cloud': dmg = 0; msg = `${e.name} vanishes into a FROST CLOUD! Evasion raised!`; break;
    }
    const dodged = dmg > 0 && Math.random() < (S.cloudUp ? 0.6 : S.senseUp ? 0.35 : 0);
    if (S.senseUp) S.senseUp = false;
    const espr = document.getElementById('enemy-spr');
    espr.classList.add('atk-lunge-r'); setTimeout(() => espr.classList.remove('atk-lunge-r'), 500);
    if (dodged) {
        log(`${e.name} attacks... MONKEY KING dodges on his cloud! ☁️`);
        S.cloudUp = false; document.getElementById('cloud-fx').style.opacity = '0';
        await sleep(900); return;
    }
    log(msg);
    if (dmg > 0) {
        await sleep(400);
        const pspr = document.getElementById('player-spr');
        pspr.classList.add('hit-flash'); setTimeout(() => pspr.classList.remove('hit-flash'), 450);
        S.php = Math.max(0, S.php - dmg);
        spawnDmg(140, 180, dmg, '#ef4444');
        updateHUD();
    }
    await sleep(800);
    if (S.php <= 0) { await sleep(300); showGameOver(false); }
}

function showGameOver(win) {
    document.getElementById('go-title').textContent = win ? 'win' : 'lose';
    document.getElementById('go-title').className = win ? 'win' : 'lose';
    document.getElementById('go-sub').textContent = win
        ? 'The Monkey King is just better'
        : 'The Monkey King died on purpose trust';

    const targetElement = document.getElementById(win ? "enemy-img" : "player-img");
    targetElement.classList.add("death");
    targetElement.addEventListener("animationend", () => {
        targetElement.classList.remove("death");
        show('gameover');
    });
}

function spawnDmg(x, y, val, color) {
    const el = document.createElement('div');
    el.className = 'dmg'; el.textContent = val;
    el.style.cssText = `left:${x}px;top:${y}px;color:${color}`;
    document.getElementById('gc').appendChild(el);
    setTimeout(() => el.remove(), 1400);
}

function drawLightning() {
    const cv = document.getElementById('efx'), ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, 800, 600);
    function bolt(x1, y1, x2, y2, d) {
        if (!d) return;
        const mx = (x1 + x2) / 2 + (Math.random() - .5) * 55, my = (y1 + y2) / 2 + (Math.random() - .5) * 25;
        ctx.strokeStyle = `rgba(250,204,21,${d / 4})`; ctx.lineWidth = d;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(mx, my); ctx.lineTo(x2, y2); ctx.stroke();
        bolt(x1, y1, mx, my, d - 1); bolt(mx, my, x2, y2, d - 1);
    }
    bolt(175, 290, 575, 270, 4); bolt(175, 290, 610, 310, 3); bolt(175, 290, 545, 255, 3);
    setTimeout(() => ctx.clearRect(0, 0, 800, 600), 350);
}

window.onload = () => {
    const loadingEl = document.getElementById('loading-screen');
//     loadingEl.id = 'loading-screen';
//     loadingEl.innerHTML = `
//     <div style="font-size:28px; margin-bottom:16px;">LOADING...</div>
//     <div id="load-bar-bg" style="width:280px; height:16px; background:#333; border:2px solid #c8860a; border-radius:2px; overflow:hidden;">
//       <div id="load-bar" style="width:0%; height:100%; background:linear-gradient(90deg,#c8860a,#fde047); transition:width 0.2s ease;"></div>
//     </div>
//     <div id="load-text" style="font-size:13px; margin-top:10px; color:#fff8; letter-spacing:1px;">0 / 9</div>
//     <button id="continue-btn" disabled style="transition: opacity 300ms ease-out; margin-top:18px; padding:12px 22px; border:2px solid #c8860a; background:#111; color:#c8860a; font-family:'Bangers',cursive; font-size:18px; letter-spacing:2px; cursor:pointer; opacity:0;">CLICK TO START</button>
//   `;
//     document.getElementById('gc').appendChild(loadingEl);

    const continueBtn = document.getElementById('continue-btn');
    let readyToContinue = false;

    continueBtn.addEventListener('click', () => {
        if (!readyToContinue) return;
        loadingEl.remove();
        playCutscene();
    });

    document.getElementById('cutscene').addEventListener('click', (event) => {
        if (event.target && event.target.id === 'skip-btn') return;
        if (document.getElementById('cutscene').style.display === 'none') return;
        advanceCutscene();
    });

    const clips = Object.values(AUDIO_CLIPS);
    let loaded = 0;
    const total = clips.length;

    function onLoad() {
        loaded++;
        const pct = Math.round((loaded / total) * 100);
        document.getElementById('load-bar').style.width = pct + '%';
        document.getElementById('load-text').textContent = loaded + ' / ' + total;
        if (loaded === total) {
            readyToContinue = true;
            continueBtn.disabled = false;
            continueBtn.style.opacity = '1';
            continueBtn.textContent = 'CLICK TO START';
        }
    }

    clips.forEach(src => {
        const a = new Audio(src);
        a.addEventListener('canplaythrough', onLoad, { once: true });
        a.addEventListener('error', onLoad, { once: true }); // don't hang on failure
        a.load();
    });
};

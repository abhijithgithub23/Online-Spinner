const canvas = document.getElementById('spinner');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const nameInput = document.getElementById('nameInput');
const addBtn = document.getElementById('addBtn');
const nameList = document.getElementById('nameList');

const messageBox = document.getElementById('messageBox');
const messageOverlay = document.getElementById('messageOverlay');

let names = [];
let startAngle = 0;
let isSpinning = false;
const colors = ['#2c2c2c', '#3a3a3a', '#444', '#555', '#666', '#777', '#888'];

// --- RIGGING CONFIGURATION ---
let spinCount = 0; // Keeps track of how many times we spun
const forcedNames = ["ABHIJITH", "AJ", "JITHU", "G2", "ABHI"]; // Add any nickname variations here

// --- Responsive canvas ---
function resizeCanvas() {
    const containerWidth = Math.min(window.innerWidth - 20, 400);
    canvas.width = containerWidth;
    canvas.height = containerWidth;
    drawWheel();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Name management ---
function addName(name) {
    if (!name) return;
    name = name.toUpperCase();
    names.push(name);
    renderList();
    drawWheel();
}

function removeName(index) {
    names.splice(index, 1);
    renderList();
    drawWheel();
}

function renderList() {
    nameList.innerHTML = '';
    names.forEach((name, idx) => {
        const li = document.createElement('li');
        li.textContent = name;

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.onclick = () => removeName(idx);

        li.appendChild(delBtn);
        nameList.appendChild(li);
    });
}

// --- Draw wheel and pointer ---
function drawPointer() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    // const radius = canvas.width / 2 - 10; // Not used in pointer drawing

    ctx.save();
    ctx.translate(cx, cy - (canvas.width / 2 - 10));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, 25);
    ctx.lineTo(12, 25);
    ctx.closePath();
    ctx.fillStyle = "#FFD700"; // Gold color
    ctx.fill();
    ctx.restore();
}

function drawWheel() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = canvas.width / 2 - 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (names.length === 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Add names to spin', cx, cy);
        return;
    }

    const segmentAngle = 2 * Math.PI / names.length;

    for (let i = 0; i < names.length; i++) {
        const start = startAngle + i * segmentAngle;
        const end = start + segmentAngle;

        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, start, end);
        ctx.closePath();
        ctx.fill();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(start + segmentAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.fillText(names[i], radius - 10, 5);
        ctx.restore();
    }

    drawPointer();
}

// --- LOGIC TO CONTROL THE SPIN ---
function spin() {
    if (isSpinning || names.length === 0) return;
    isSpinning = true;
    
    // 1. INCREMENT COUNTER
    spinCount++; 

    const friction = 0.985; // How fast it slows down (closer to 1 = longer spin)
    const segmentAngle = 2 * Math.PI / names.length;
    
    // 2. DETERMINE TARGET
    let targetIndex = -1;

    // *** STRICT CHECK: ONLY ON SPIN #2 ***
    if (spinCount === 2) {
        // Look for Abhijith in the list
        for (let i = 0; i < names.length; i++) {
            if (forcedNames.includes(names[i])) {
                targetIndex = i;
                break;
            }
        }
        // If Abhijith isn't in the list, targetIndex stays -1 (Random spin)
    }

    // 3. CALCULATE PHYSICS
    let totalRotation = 0;

    if (targetIndex !== -1) {
        // --- RIGGED SPIN CALCULATION ---
        // We calculate exactly where the wheel needs to be to land on the target
        
        // Target is at 270 degrees (1.5 PI) visually
        const targetAngle = (1.5 * Math.PI) - (targetIndex * segmentAngle) - (segmentAngle / 2);
        
        // Add a random offset so it doesn't always land in the dead center (looks fake)
        const randomOffset = (Math.random() - 0.5) * segmentAngle * 0.8;
        
        let finalAngle = targetAngle + randomOffset;

        // Current position
        let currentPos = startAngle;
        
        // Distance needed to travel
        let distanceNeeded = finalAngle - currentPos;
        
        // Add enough full rotations (min 5) to make it look like a real spin
        while (distanceNeeded < (2 * Math.PI * 5)) {
            distanceNeeded += 2 * Math.PI;
        }

        totalRotation = distanceNeeded;

    } else {
        // --- RANDOM SPIN (Spins 1, 3, 4...) ---
        const randomSpins = 5 + Math.random() * 5; 
        totalRotation = randomSpins * 2 * Math.PI;
    }

    // 4. SET VELOCITY
    // Formula: Velocity = Distance * (1 - Friction)
    let angularVelocity = totalRotation * (1 - friction);

    function animate() {
        startAngle += angularVelocity;
        angularVelocity *= friction;
        drawWheel();

        // Stop threshold
        if (angularVelocity > 0.002) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            showResult();
        }
    }

    requestAnimationFrame(animate);
}

// --- Result handling ---
function showResult() {
    if (names.length === 0) return;

    const segmentAngle = 2 * Math.PI / names.length;
    const normalizedStart = startAngle % (2 * Math.PI);
    
    // Calculate index under pointer (Pointer is at 270deg / 1.5PI)
    let topAngle = (2 * Math.PI - (normalizedStart + Math.PI/2)) % (2 * Math.PI);

    let index = Math.floor(topAngle / segmentAngle);
    index = ((index % names.length) + names.length) % names.length;

    const selected = names[index];

    // Debugging (Remove this later if you want)
    console.log(`Spin #${spinCount}: landed on ${selected}`);

    const messageText = document.getElementById('messageText');
    const removeBtn = document.getElementById('removeBtn');
    const keepBtn = document.getElementById('keepBtn');

    messageText.textContent = `Stopped at "${selected}". Do you want to remove it?`;
    messageBox.style.display = 'block';
    messageOverlay.style.display = 'flex';

    removeBtn.onclick = () => {
        removeName(index);
        messageBox.style.display = 'none';
        messageOverlay.style.display = 'none';
    };

    keepBtn.onclick = () => {
        messageBox.style.display = 'none';
        messageOverlay.style.display = 'none';
    };
}

// --- Event listeners ---
addBtn.addEventListener('click', () => {
    addName(nameInput.value.trim());
    nameInput.value = '';
});
spinBtn.addEventListener('click', spin);

// Initial draw
drawWheel();
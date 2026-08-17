/**
 * 3D Periodic Table Data Visualization
 * Primary Developer & Editor: AHMAD AMIRUL FAIZ BIN NAZRI
 */

// Data endpoint and Google OAuth Client ID
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1SpgizARxdeoAL3veuniJwGDodgLrLmqcQcTRp-I6uHU/export?format=csv';
const CLIENT_ID = '881789713644-42g9l58hv737vlupjqj15bf4e3u190tk.apps.googleusercontent.com';

let camera, scene, renderer, controls;
let tokenClient;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [], tetrahedron: [] };

// Initialize Google Identity Services OAuth client
window.onload = function () {
    if (window.google && google.accounts && google.accounts.oauth2) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/userinfo.profile',
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    console.log("OAuth Success. Loading data...");
                    const loginScreen = document.getElementById('login-screen');
                    if (loginScreen) loginScreen.style.display = 'none';
                    loadDataAndInit();
                }
            },
        });
    } else {
        console.warn("Google Identity Services SDK initializing...");
    }
};

function triggerGoogleLogin() {
    if (tokenClient) {
        tokenClient.requestAccessToken();
    } else {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'none';
        loadDataAndInit();
    }
}

// Fetch and parse spreadsheet CSV data Kasatria Candidate Data
function loadDataAndInit() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            const cleanData = results.data.filter(row => {
                const name = row.Name || row.name || row[' Name '] || row['Name '];
                return name && name.trim() !== '';
            });

            if (cleanData.length === 0) {
                alert("Sheet data empty. Check Google Sheet permissions.");
                return;
            }
            init(cleanData);
            animate();
        },
        error: function (err) {
            console.error("CSV error:", err);
            alert("Could not fetch CSV. Make sure sheet is Published as CSV.");
        }
    });
}

// Build 3D DOM cards and register layout switchers
function init(data) {
    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 3000;

    scene = new THREE.Scene();

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const name = item.Name || item.name || item[' Name '] || 'Unknown';
        const photo = item.Photo || item.photo || item[' Photo '] || 'https://via.placeholder.com/60';
        const rawWorth = item[' Net Worth '] || item['Net Worth'] || item.NetWorth || item.worth || '$0';
        const netWorthNum = parseFloat(String(rawWorth).replace(/[\$,]/g, '')) || 0;

        const element = document.createElement('div');
        element.className = 'element';

        // Color coding by net worth tiers
        if (netWorthNum < 100000) {
            element.style.backgroundColor = 'rgba(239, 48, 34, 0.75)';
        } else if (netWorthNum <= 200000) {
            element.style.backgroundColor = 'rgba(255, 152, 0, 0.75)';
        } else {
            element.style.backgroundColor = 'rgba(46, 125, 50, 0.75)';
        }

        element.innerHTML = `
            <div class="number">#${i + 1}</div>
            <div class="photo"><img src="${photo}" alt="profile" /></div>
            <div class="name">${name}</div>
            <div class="net-worth">${rawWorth}</div>
        `;

        const object = new THREE.CSS3DObject(element);
        object.position.x = Math.random() * 4000 - 2000;
        object.position.y = Math.random() * 4000 - 2000;
        object.position.z = Math.random() * 4000 - 2000;
        scene.add(object);
        objects.push(object);
    }

    // Precalculate target coordinates for all 5 layouts
    buildTableLayout(data.length);
    buildSphereLayout(data.length);
    buildDoubleHelixLayout(data.length);
    buildGridLayout(data.length);
    buildTetrahedronLayout(data.length);

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.getElementById('container');
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.minDistance = 500;
    controls.maxDistance = 6000;

    transform(targets.table, 2000);

    // Attach click listeners for layout buttons
    const safeBind = (id, target) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.onclick = () => transform(target, 2000);
        }
    };

    safeBind('table', targets.table);
    safeBind('sphere', targets.sphere);
    safeBind('helix', targets.helix);
    safeBind('grid', targets.grid);
    safeBind('tetrahedron', targets.tetrahedron);

    window.addEventListener('resize', onWindowResize);
}

// 2D Periodic Table Grid
function buildTableLayout(count) {
    const COLS = 20;
    for (let i = 0; i < count; i++) {
        const object = new THREE.Object3D();
        const col = i % COLS;
        const row = Math.floor(i / COLS);

        object.position.x = (col * 140) - (COLS * 140 / 2) + 70;
        object.position.y = -(row * 180) + (10 * 180 / 2) - 90;
        object.position.z = 0;

        targets.table.push(object);
    }
}

// Fibonacci spherical distribution
function buildSphereLayout(count) {
    const vector = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
        const phi = Math.acos(-1 + (2 * i) / count);
        const theta = Math.sqrt(count * Math.PI) * phi;

        const object = new THREE.Object3D();
        object.position.setFromSphericalCoords(800, phi, theta);

        vector.copy(object.position).multiplyScalar(2);
        object.lookAt(vector);

        targets.sphere.push(object);
    }
}

// Double-helix DNA cylindrical layout
function buildDoubleHelixLayout(count) {
    const vector = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
        const object = new THREE.Object3D();

        const strandOffset = (i % 2 === 0) ? 0 : Math.PI;
        const phi = (Math.floor(i / 2) * 0.175) + strandOffset;
        const y = -(Math.floor(i / 2) * 12) + 500;

        object.position.setFromCylindricalCoords(900, phi, y);

        vector.x = object.position.x * 2;
        vector.y = object.position.y;
        vector.z = object.position.z * 2;
        object.lookAt(vector);

        targets.helix.push(object);
    }
}

// 3D Cube Grid layout
function buildGridLayout(count) {
    const X_SIZE = 5;
    const Y_SIZE = 4;
    const Z_SIZE = 10;

    for (let i = 0; i < count; i++) {
        const object = new THREE.Object3D();

        const x = i % X_SIZE;
        const y = Math.floor(i / X_SIZE) % Y_SIZE;
        const z = Math.floor(i / (X_SIZE * Y_SIZE));

        object.position.x = (x * 300) - ((X_SIZE - 1) * 300 / 2);
        object.position.y = -(y * 300) + ((Y_SIZE - 1) * 300 / 2);
        object.position.z = (z * 600) - ((Z_SIZE - 1) * 600 / 2);

        targets.grid.push(object);
    }
}

// 5. 3D Pyramid (Tetrahedron) Layout
// 5. Clean 4-Sided Stepped Pyramid Layout
function buildTetrahedronLayout(count) {
    const vector = new THREE.Vector3();
    const tiers = [
        { count: 4,  radius: 200,  y: 700 },   // Apex tier
        { count: 12, radius: 450,  y: 500 },
        { count: 20, radius: 700,  y: 300 },
        { count: 28, radius: 950,  y: 100 },
        { count: 36, radius: 1200, y: -100 },
        { count: 44, radius: 1450, y: -300 },
        { count: 56, radius: 1700, y: -500 }   // Base tier
    ];

    let currentCard = 0;

    for (let t = 0; t < tiers.length; t++) {
        const tier = tiers[t];
        const itemsInThisTier = Math.min(tier.count, count - currentCard);

        for (let i = 0; i < itemsInThisTier; i++) {
            // Distribute cards along the 4 straight outer walls of the tier
            const progress = (i / tier.count) * 4; // 0 to 4 (4 sides)
            const side = Math.floor(progress);
            const sideProgress = progress - side; // 0 to 1 along the side

            let x = 0, z = 0;
            const r = tier.radius;

            // Map positions along 4 linear perimeter edges
            if (side === 0) {
                x = -r + (2 * r * sideProgress);
                z = r;
            } else if (side === 1) {
                x = r;
                z = r - (2 * r * sideProgress);
            } else if (side === 2) {
                x = r - (2 * r * sideProgress);
                z = -r;
            } else {
                x = -r;
                z = -r + (2 * r * sideProgress);
            }

            const object = new THREE.Object3D();
            object.position.set(x, tier.y, z);

            // Orient cards facing outwards with a slight upward tilt matching pyramid slope
            vector.set(x * 1.5, tier.y - 100, z * 1.5);
            object.lookAt(vector);

            targets.tetrahedron.push(object);
            currentCard++;
        }
    }
}

// Animate objects to target layout using Tween.js
function transform(targetArray, duration) {
    TWEEN.removeAll();

    for (let i = 0; i < objects.length; i++) {
        const object = objects[i];
        const target = targetArray[i];

        new TWEEN.Tween(object.position)
            .to({
                x: target.position.x,
                y: target.position.y,
                z: target.position.z
            }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();

        new TWEEN.Tween(object.rotation)
            .to({
                x: target.rotation.x,
                y: target.rotation.y,
                z: target.rotation.z
            }, Math.random() * duration + duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .start();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();
    controls.update();
    render();
}

function render() {
    renderer.render(scene, camera);
}

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
function buildTetrahedronLayout(count) {
    const scale = 1400;
    const cardsPerFace = Math.ceil(count / 4); 

    // 4 Vertices of a regular tetrahedron
    const v0 = new THREE.Vector3(0, scale, 0);                                       
    const v1 = new THREE.Vector3(-scale, -scale * 0.5, scale * 0.866);              
    const v2 = new THREE.Vector3(scale, -scale * 0.5, scale * 0.866);                
    const v3 = new THREE.Vector3(0, -scale * 0.5, -scale * 1.155);                  

    // 4 Triangular Faces defined by vertex triplets
    const faces = [
        [v0, v1, v2], // Front
        [v0, v2, v3], // Right
        [v0, v3, v1], // Left
        [v1, v3, v2]  // Bottom Base
    ];

    for (let i = 0; i < count; i++) {
        const faceIndex = Math.floor(i / cardsPerFace);
        const face = faces[faceIndex];
        const cardIndex = i % cardsPerFace;

        // Triangular row/col mapping (Row 0 has 1 card, Row 1 has 2 cards, etc.)
        const row = Math.floor((-1 + Math.sqrt(1 + 8 * cardIndex)) / 2);
        const col = cardIndex - (row * (row + 1)) / 2;
        const totalRows = 9;

        // Calculate barycentric coordinates within the triangular face
        const rowRatio = (row + 0.5) / (totalRows + 1);
        const colRatio = row === 0 ? 0.5 : (col + 0.5) / (row + 1);

        const w0 = 1 - rowRatio;
        const w1 = rowRatio * (1 - colRatio);
        const w2 = rowRatio * colRatio;

        const position = new THREE.Vector3()
            .addScaledVector(face[0], w0)
            .addScaledVector(face[1], w1)
            .addScaledVector(face[2], w2);

        // Compute face normal vector perpendicular to the triangle
        const edgeA = new THREE.Vector3().subVectors(face[1], face[0]);
        const edgeB = new THREE.Vector3().subVectors(face[2], face[0]);
        const normal = new THREE.Vector3().crossVectors(edgeA, edgeB).normalize();

        // Ensure normal points away from the center of the pyramid
        const centroid = new THREE.Vector3().add(face[0]).add(face[1]).add(face[2]).divideScalar(3);
        if (normal.dot(centroid) < 0) {
            normal.negate();
        }

        const object = new THREE.Object3D();
        object.position.copy(position);

        // Align card flat against the face and orient it upright along the slope
        const lookTarget = new THREE.Vector3().addVectors(position, normal);
        object.lookAt(lookTarget);

        targets.tetrahedron.push(object);
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

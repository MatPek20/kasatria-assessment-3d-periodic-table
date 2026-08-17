/**
 * 3D Periodic Table Data Visualization
 * Primary Developer & Editor: AHMAD AMIRUL FAIZ BIN NAZRI
 */

const CSV_URL = 'https://docs.google.com/spreadsheets/d/1SpgizARxdeoAL3veuniJwGDodgLrLmqcQcTRp-I6uHU/export?format=csv';
const CLIENT_ID = '881789713644-42g9l58hv737vlupjqj15bf4e3u190tk.apps.googleusercontent.com';

let camera, scene, renderer, controls;
let tokenClient;
const objects = [];
const targets = { table: [], sphere: [], helix: [], grid: [], tetrahedron: [] };

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

function buildTetrahedronLayout(count) {
    const scale = 1100;

    const vertices = [
        new THREE.Vector3(1, 1, 1).multiplyScalar(scale),
        new THREE.Vector3(-1, -1, 1).multiplyScalar(scale),
        new THREE.Vector3(-1, 1, -1).multiplyScalar(scale),
        new THREE.Vector3(1, -1, -1).multiplyScalar(scale)
    ];

    const faces = [
        [vertices[0], vertices[1], vertices[2]],
        [vertices[0], vertices[2], vertices[3]],
        [vertices[0], vertices[3], vertices[1]],
        [vertices[1], vertices[3], vertices[2]]
    ];

    const itemsPerFace = Math.ceil(count / 4);

    for (let i = 0; i < count; i++) {
        const faceIndex = Math.floor(i / itemsPerFace);
        const indexOnFace = i % itemsPerFace;
        const currentFace = faces[faceIndex];

        const row = Math.floor((-1 + Math.sqrt(1 + 8 * indexOnFace)) / 2);
        const col = indexOnFace - (row * (row + 1)) / 2;

        const maxRows = 9;
        const u = maxRows === 0 ? 0 : row / maxRows;
        const v = row === 0 ? 0 : col / (maxRows + 1);
        const w = Math.max(0, 1 - u - v);

        const position = new THREE.Vector3()
            .addScaledVector(currentFace[0], u)
            .addScaledVector(currentFace[1], v)
            .addScaledVector(currentFace[2], w);

        const edge1 = new THREE.Vector3().subVectors(currentFace[1], currentFace[0]);
        const edge2 = new THREE.Vector3().subVectors(currentFace[2], currentFace[0]);
        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

        const centroid = new THREE.Vector3()
            .add(currentFace[0])
            .add(currentFace[1])
            .add(currentFace[2])
            .divideScalar(3);

        if (normal.dot(centroid) < 0) {
            normal.negate();
        }

        const object = new THREE.Object3D();
        object.position.copy(position);

        const lookTarget = new THREE.Vector3().addVectors(position, normal);
        object.lookAt(lookTarget);

        targets.tetrahedron.push(object);
    }
}

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
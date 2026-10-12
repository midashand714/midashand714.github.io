import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const viewer = document.querySelector("[data-cad-model]");

if (viewer) {
  const canvas = viewer.querySelector(".cad-canvas");
  const status = viewer.querySelector("[data-cad-status]");
  const rotateButton = viewer.querySelector('[data-cad-action="rotate"]');
  const resetButton = viewer.querySelector('[data-cad-action="reset"]');
  const modelUrl = viewer.dataset.cadModel;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 10000);
  let renderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
  } catch (error) {
    viewer.classList.add("is-error");
    if (status) {
      status.textContent = "CAD preview requires WebGL";
    }
    console.error("Failed to create CAD renderer:", error);
  }

  if (renderer) {

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.screenSpacePanning = false;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a928f, 2.8));

  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(5, 8, 7);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdceeff, 1.2);
  fillLight.position.set(-6, 3, -4);
  scene.add(fillLight);

  let homeCamera = {
    position: new THREE.Vector3(2.2, 1.4, 2.8),
    target: new THREE.Vector3(0, 0, 0),
  };

  const updateStatus = (message) => {
    if (status) {
      status.textContent = message;
    }
  };

  const resize = () => {
    const width = Math.max(1, viewer.clientWidth);
    const height = Math.max(1, viewer.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const frameModel = (model) => {
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z, 1);

    model.position.sub(center);

    const framedBounds = new THREE.Box3().setFromObject(model);
    const framedSize = framedBounds.getSize(new THREE.Vector3());
    const framedMaxDim = Math.max(framedSize.x, framedSize.y, framedSize.z, 1);
    const distance = framedMaxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)));
    const cameraDistance = distance * 1.55;

    camera.near = Math.max(cameraDistance / 1000, 0.001);
    camera.far = cameraDistance * 100;
    camera.position.set(cameraDistance * 0.58, cameraDistance * 0.32, cameraDistance * 0.82);
    camera.updateProjectionMatrix();

    controls.target.set(0, 0, 0);
    controls.minDistance = cameraDistance * 0.28;
    controls.maxDistance = cameraDistance * 4;
    controls.update();

    homeCamera = {
      position: camera.position.clone(),
      target: controls.target.clone(),
    };

    const grid = new THREE.GridHelper(framedMaxDim * 1.35, 16, 0xb8c1bc, 0xd8dedb);
    grid.position.y = framedBounds.min.y - framedMaxDim * 0.025;
    scene.add(grid);
  };

  const loader = new GLTFLoader();
  loader.load(
    modelUrl,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((object) => {
        if (!object.isMesh) {
          return;
        }
        object.frustumCulled = false;
        if (object.material) {
          object.material = object.material.clone();
          object.material.side = THREE.DoubleSide;
          object.material.needsUpdate = true;
        }
      });

      scene.add(model);
      frameModel(model);
      viewer.classList.add("is-loaded");
      updateStatus("CAD loaded");
    },
    (event) => {
      if (!event.total) {
        updateStatus("Loading CAD...");
        return;
      }
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      updateStatus(`Loading CAD ${percent}%`);
    },
    (error) => {
      viewer.classList.add("is-error");
      updateStatus("CAD model failed to load");
      console.error("Failed to load CAD model:", error);
    },
  );

  rotateButton?.addEventListener("click", () => {
    controls.autoRotate = !controls.autoRotate;
    rotateButton.classList.toggle("is-active", controls.autoRotate);
    rotateButton.setAttribute("aria-pressed", String(controls.autoRotate));
  });

  resetButton?.addEventListener("click", () => {
    camera.position.copy(homeCamera.position);
    controls.target.copy(homeCamera.target);
    controls.update();
  });

  const observer = new ResizeObserver(resize);
  observer.observe(viewer);
  resize();

  const render = () => {
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  };

  render();
  }
}
